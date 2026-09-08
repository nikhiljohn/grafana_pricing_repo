"""Authentication — username/password + TOTP (Google Authenticator-compatible).

Interim app-gate ahead of full Google Workspace SSO (tracked in
deploy/gcp/README.md). Session state lives in two httpOnly cookies:

  intellicore_pending — set once the password checks out; identifies the
                         user mid-login for 5 minutes while they enter a
                         TOTP code (or scan the QR on first sign-in).
  intellicore_session — set once the TOTP code verifies; the real session.
                         Lifetime is 12h, or 30d if "remember this device"
                         was checked at verification time.

The session JWT alone is a bearer credential with no server-side kill
switch, so each one carries a `sid` claim that's mirrored into Redis
(`session:{sid}` -> uid, same TTL as the cookie). Logout — and any future
"revoke all sessions" action — deletes that Redis key, which is what
actually ends the session; the JWT's signature staying valid past that
point doesn't matter because session/check verifies the Redis entry too.

GET /auth/session/check is the target Caddy's forward_auth calls on every
request to the app; a 401 there sends the browser to /login.
"""

import base64
import io
import secrets
import uuid
from datetime import timedelta
from urllib.parse import urlencode

import bcrypt
import httpx
import pyotp
import qrcode
import qrcode.image.svg
from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from jose import JWTError
from pydantic import BaseModel
from sqlalchemy import text

from app.core.security import decode_token, encode_token
from app.db.postgres import get_session
from app.db.redis import get_client

router = APIRouter()

PENDING_COOKIE = "intellicore_pending"
SESSION_COOKIE = "intellicore_session"
SHORT_SESSION = timedelta(hours=12)
REMEMBER_SESSION = timedelta(days=30)
PENDING_TTL = timedelta(minutes=5)

_COOKIE_KWARGS = {"httponly": True, "secure": True, "samesite": "lax", "path": "/"}


class LoginRequest(BaseModel):
    email: str
    password: str


class TotpVerifyRequest(BaseModel):
    code: str
    remember: bool = False


def _qr_svg_data_uri(otpauth_uri: str) -> str:
    img = qrcode.make(otpauth_uri, image_factory=qrcode.image.svg.SvgImage)
    buf = io.BytesIO()
    img.save(buf)
    return f"data:image/svg+xml;base64,{base64.b64encode(buf.getvalue()).decode()}"


async def _require_session(request: Request) -> dict:
    """Decode + validate the session cookie, honoring server-side revocation."""
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No session")
    try:
        payload = decode_token(token)
    except (HTTPException, JWTError) as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired") from exc
    if payload.get("purpose") != "session" or not payload.get("sid"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid session")
    if not await get_client().exists(f"session:{payload['sid']}"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session revoked")
    return payload


@router.post("/login")
async def login(req: LoginRequest, response: Response) -> dict:
    async for session in get_session():
        row = (
            await session.execute(
                text(
                    "SELECT id, tenant_id, email, password_hash, totp_secret "
                    "FROM users WHERE lower(email) = lower(:email)"
                ),
                {"email": req.email},
            )
        ).mappings().first()
        break
    else:
        row = None

    if not row or not bcrypt.checkpw(req.password.encode(), row["password_hash"].encode()):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    pending = encode_token({"uid": str(row["id"]), "purpose": "totp-pending"}, PENDING_TTL)
    response.set_cookie(
        PENDING_COOKIE, pending, max_age=int(PENDING_TTL.total_seconds()), **_COOKIE_KWARGS
    )

    if not row["totp_secret"]:
        secret = pyotp.random_base32()
        async for session in get_session():
            await session.execute(
                text("UPDATE users SET totp_secret = :secret WHERE id = :id"),
                {"secret": secret, "id": row["id"]},
            )
            await session.commit()
            break
        uri = pyotp.TOTP(secret).provisioning_uri(name=row["email"], issuer_name="Intellicore CMP")
        return {"stage": "totp_setup", "secret": secret, "qr_code": _qr_svg_data_uri(uri)}

    return {"stage": "totp_required"}


@router.post("/totp/verify")
async def verify_totp(req: TotpVerifyRequest, request: Request, response: Response) -> dict:
    pending = request.cookies.get(PENDING_COOKIE)
    if not pending:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Login session expired — start again")

    try:
        payload = decode_token(pending)
    except HTTPException as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Login session expired — start again") from exc
    if payload.get("purpose") != "totp-pending":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid login session")

    async for session in get_session():
        row = (
            await session.execute(
                text("SELECT id, tenant_id, email, totp_secret FROM users WHERE id = :id"),
                {"id": payload["uid"]},
            )
        ).mappings().first()
        break
    else:
        row = None

    if not row or not row["totp_secret"]:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "TOTP not configured for this account")

    if not pyotp.TOTP(row["totp_secret"]).verify(req.code, valid_window=1):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect code")

    async for session in get_session():
        await session.execute(
            text(
                "UPDATE users SET totp_confirmed = TRUE, last_login_at = NOW() WHERE id = :id"
            ),
            {"id": row["id"]},
        )
        await session.commit()
        break

    ttl = REMEMBER_SESSION if req.remember else SHORT_SESSION
    sid = str(uuid.uuid4())
    session_token = encode_token(
        {
            "uid": str(row["id"]),
            "tenant_id": row["tenant_id"],
            "email": row["email"],
            "purpose": "session",
            "sid": sid,
        },
        ttl,
    )
    await get_client().set(f"session:{sid}", str(row["id"]), ex=int(ttl.total_seconds()))

    response.delete_cookie(PENDING_COOKIE, path="/")
    response.set_cookie(SESSION_COOKIE, session_token, max_age=int(ttl.total_seconds()), **_COOKIE_KWARGS)
    return {"ok": True, "email": row["email"], "tenant_id": row["tenant_id"]}


@router.get("/session/check")
async def session_check(request: Request, response: Response) -> dict:
    """Caddy's forward_auth target — 200 lets the request through, 401 sends it to /login."""
    payload = await _require_session(request)
    response.headers["X-Auth-User"] = payload.get("email", "")
    return {"email": payload.get("email"), "tenant_id": payload.get("tenant_id")}


@router.post("/logout")
async def logout(request: Request, response: Response) -> dict:
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        try:
            payload = decode_token(token)
            if sid := payload.get("sid"):
                await get_client().delete(f"session:{sid}")
        except (HTTPException, JWTError):
            pass
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


@router.get("/me")
async def me(request: Request) -> dict:
    payload = await _require_session(request)
    return {"email": payload.get("email"), "tenant_id": payload.get("tenant_id")}


GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


@router.get("/google/login")
async def google_login(request: Request) -> RedirectResponse:
    from app.config import get_settings
    settings = get_settings()
    if not settings.google_oauth_enabled:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Google SSO is not configured")

    # CSRF state stored in Redis for 10 minutes
    state = secrets.token_urlsafe(32)
    rd = request.query_params.get("rd", "/")
    await get_client().set(f"oauth:state:{state}", rd, ex=600)

    # Build the first allowed domain as the hd hint
    # (Google only accepts a single hd value, but we verify all allowed on callback)
    hd_hint = settings.google_oauth_allowed_domains_list[0]

    params = {
        "client_id": settings.google_oauth_client_id,
        "redirect_uri": str(request.base_url).rstrip("/") + "/auth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "hd": hd_hint,
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


@router.get("/google/callback")
async def google_callback(
    request: Request,
    response: Response,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
) -> RedirectResponse:
    from app.config import get_settings
    settings = get_settings()

    # Handle user-denied or errors
    if error or not code or not state:
        return RedirectResponse(f"/login?error={error or 'cancelled'}")

    # Verify CSRF state
    rd_bytes = await get_client().get(f"oauth:state:{state}")
    if not rd_bytes:
        return RedirectResponse("/login?error=state_mismatch")
    await get_client().delete(f"oauth:state:{state}")
    redirect_to = rd_bytes if isinstance(rd_bytes, str) else rd_bytes.decode()

    # Exchange code for tokens
    redirect_uri = str(request.base_url).rstrip("/") + "/auth/google/callback"
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_oauth_client_id,
                "client_secret": settings.google_oauth_client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
    if not token_resp.is_success:
        return RedirectResponse("/login?error=token_exchange_failed")
    tokens = token_resp.json()
    id_token = tokens.get("id_token")
    if not id_token:
        return RedirectResponse("/login?error=no_id_token")

    # Verify the ID token via Google's tokeninfo endpoint
    async with httpx.AsyncClient() as client:
        info_resp = await client.get(GOOGLE_TOKENINFO_URL, params={"id_token": id_token})
    if not info_resp.is_success:
        return RedirectResponse("/login?error=token_invalid")
    info = info_resp.json()

    email = info.get("email", "")
    email_verified = info.get("email_verified") in (True, "true")
    hd = info.get("hd", "")   # hosted domain from Google

    if not email or not email_verified:
        return RedirectResponse("/login?error=email_not_verified")

    # Check domain is allowed
    allowed = settings.google_oauth_allowed_domains_list
    if hd not in allowed and not any(email.endswith(f"@{d}") for d in allowed):
        return RedirectResponse("/login?error=domain_not_allowed")

    # Find or create user
    google_name = info.get("name") or email.split("@")[0]
    async for session in get_session():
        row = (
            await session.execute(
                text("SELECT id, tenant_id, email FROM users WHERE lower(email) = lower(:email)"),
                {"email": email},
            )
        ).mappings().first()

        if not row:
            # Auto-provision internal Searce users into the demo tenant
            # (production: look up the tenant by domain mapping)
            new_id = str(uuid.uuid4())
            await session.execute(
                text(
                    """INSERT INTO users (id, tenant_id, email, name, password_hash, role, totp_confirmed)
                       VALUES (:id, 'demo-tenant', :email, :name, '', 'viewer', TRUE)
                       ON CONFLICT (tenant_id, email) DO NOTHING"""
                ),
                {"id": new_id, "email": email, "name": google_name},
            )
            await session.commit()
            row = (
                await session.execute(
                    text("SELECT id, tenant_id, email FROM users WHERE lower(email) = lower(:email)"),
                    {"email": email},
                )
            ).mappings().first()
        else:
            await session.execute(
                text("UPDATE users SET last_login_at = NOW() WHERE id = :id"),
                {"id": row["id"]},
            )
            await session.commit()
        break
    else:
        row = None

    if not row:
        return RedirectResponse("/login?error=user_creation_failed")

    # Issue session (same as TOTP flow)
    sid = str(uuid.uuid4())
    ttl = REMEMBER_SESSION  # Google SSO users always get the long session
    session_token = encode_token(
        {
            "uid": str(row["id"]),
            "tenant_id": row["tenant_id"],
            "email": row["email"],
            "purpose": "session",
            "sid": sid,
            "sso": "google",
        },
        ttl,
    )
    await get_client().set(f"session:{sid}", str(row["id"]), ex=int(ttl.total_seconds()))

    resp = RedirectResponse(redirect_to, status_code=302)
    resp.set_cookie(SESSION_COOKIE, session_token, max_age=int(ttl.total_seconds()), **_COOKIE_KWARGS)
    return resp


@router.get("/google/status")
async def google_status() -> dict:
    """Let the frontend know if Google SSO is configured."""
    from app.config import get_settings
    settings = get_settings()
    return {"enabled": settings.google_oauth_enabled}
