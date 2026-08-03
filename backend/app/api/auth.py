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

from app.config import get_settings
from app.core.security import decode_token, encode_token
from app.db.postgres import get_session
from app.db.redis import get_client

router = APIRouter()

PENDING_COOKIE = "intellicore_pending"
SESSION_COOKIE = "intellicore_session"
SHORT_SESSION = timedelta(hours=12)
REMEMBER_SESSION = timedelta(days=30)
PENDING_TTL = timedelta(minutes=5)
OAUTH_STATE_TTL = timedelta(minutes=10)

_GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

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


# ── Google OAuth (Sign in with Google) ───────────────────────────────────────

@router.get("/oauth/google")
async def oauth_google_start(request: Request) -> RedirectResponse:
    """Redirect the browser to Google's OAuth consent screen.

    Stores a short-lived CSRF state token in Redis; the callback verifies it.
    The optional ``rd`` query param is the post-login redirect target and is
    stored with the state so it survives the round-trip through Google.
    """
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Google OAuth is not configured on this instance")

    state = secrets.token_urlsafe(32)
    rd = request.query_params.get("rd", "/")
    await get_client().set(f"oauth_state:{state}", rd, ex=int(OAUTH_STATE_TTL.total_seconds()))

    redirect_uri = f"{settings.public_base_url}/api/auth/oauth/google/callback"
    qs = urlencode({
        "client_id": settings.google_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    })
    return RedirectResponse(f"{_GOOGLE_AUTH_URL}?{qs}", status_code=302)


@router.get("/oauth/google/callback")
async def oauth_google_callback(
    request: Request,
    response: Response,
    code: str = "",
    state: str = "",
    error: str = "",
) -> RedirectResponse:
    """Handle Google's redirect back after the user consents (or cancels).

    Steps:
      1. Verify the CSRF state token stored in Redis.
      2. Exchange the authorization code for an access token.
      3. Fetch the user's email + stable sub from Google's userinfo endpoint.
      4. Upsert the user row in Postgres (links to an existing password account
         by email, or creates a new viewer account under the demo tenant).
      5. Issue the standard Intellicore session cookie and redirect home.
    """
    if error:
        return RedirectResponse(f"/login?error={error}", status_code=302)

    if not code or not state:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing code or state")

    # ── 1. Verify CSRF state ────────────────────────────────────────────────
    redis = get_client()
    rd_raw = await redis.get(f"oauth_state:{state}")
    if not rd_raw:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OAuth state expired or invalid — please try signing in again")
    await redis.delete(f"oauth_state:{state}")
    rd = rd_raw.decode() if isinstance(rd_raw, bytes) else rd_raw

    settings = get_settings()
    redirect_uri = f"{settings.public_base_url}/api/auth/oauth/google/callback"

    # ── 2. Exchange code for access token ───────────────────────────────────
    async with httpx.AsyncClient(timeout=10) as client:
        token_res = await client.post(
            _GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
    if not token_res.is_success:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Failed to exchange OAuth code with Google")

    access_token = token_res.json().get("access_token")
    if not access_token:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Google token response missing access_token")

    # ── 3. Fetch Google user info ────────────────────────────────────────────
    async with httpx.AsyncClient(timeout=10) as client:
        user_res = await client.get(
            _GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if not user_res.is_success:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Failed to fetch user info from Google")

    ginfo = user_res.json()
    email = (ginfo.get("email") or "").lower().strip()
    sub = ginfo.get("sub") or ""
    name = ginfo.get("name") or email.split("@")[0]

    if not email or not sub:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google did not return a usable email address")

    # ── 4. Upsert user in Postgres ───────────────────────────────────────────
    user_id: str | None = None
    tenant_id: str | None = None

    async for db in get_session():
        existing = (
            await db.execute(
                text("SELECT id, tenant_id FROM users WHERE lower(email) = :email"),
                {"email": email},
            )
        ).mappings().first()

        if existing:
            # Link OAuth to an existing account (password or previous OAuth).
            await db.execute(
                text(
                    "UPDATE users SET oauth_provider = 'google', oauth_sub = :sub, "
                    "last_login_at = NOW() WHERE id = :id"
                ),
                {"sub": sub, "id": existing["id"]},
            )
            user_id = str(existing["id"])
            tenant_id = existing["tenant_id"]
        else:
            # New user — provision under the demo tenant.
            # In a multi-tenant deployment, map the email domain to a tenant here.
            tenant_id = "demo-tenant"
            result = await db.execute(
                text(
                    "INSERT INTO users "
                    "(tenant_id, email, name, password_hash, oauth_provider, oauth_sub, role) "
                    "VALUES (:tenant_id, :email, :name, NULL, 'google', :sub, 'viewer') "
                    "ON CONFLICT (tenant_id, email) DO UPDATE "
                    "  SET oauth_provider = 'google', oauth_sub = :sub, last_login_at = NOW() "
                    "RETURNING id"
                ),
                {"tenant_id": tenant_id, "email": email, "name": name, "sub": sub},
            )
            user_id = str(result.scalar())

        await db.commit()
        break

    if not user_id or not tenant_id:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "User upsert failed")

    # ── 5. Issue session cookie and redirect ────────────────────────────────
    sid = str(uuid.uuid4())
    session_token = encode_token(
        {
            "uid": user_id,
            "tenant_id": tenant_id,
            "email": email,
            "purpose": "session",
            "sid": sid,
        },
        REMEMBER_SESSION,  # OAuth logins are always "remembered" (30 days)
    )
    await redis.set(f"session:{sid}", user_id, ex=int(REMEMBER_SESSION.total_seconds()))

    final = RedirectResponse(rd or "/", status_code=302)
    final.set_cookie(
        SESSION_COOKIE,
        session_token,
        max_age=int(REMEMBER_SESSION.total_seconds()),
        **_COOKIE_KWARGS,
    )
    return final
