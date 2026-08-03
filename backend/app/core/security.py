"""JWT + tenant helpers."""

from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import get_settings

_bearer = HTTPBearer(auto_error=False)


def create_access_token(subject: str, tenant_id: str) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiry_minutes)
    payload = {"sub": subject, "tenant_id": tenant_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def encode_token(payload: dict, expires_delta: timedelta) -> str:
    """Generic signed token for cookie-based sessions (see app.api.auth)."""
    settings = get_settings()
    to_encode = {**payload, "exp": datetime.now(timezone.utc) + expires_delta}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        ) from exc


async def current_tenant(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    """Return the tenant_id for the current request.

    In `single` tenant mode (dev), returns the demo tenant.
    In `multi` mode, decodes the JWT and returns its tenant_id.
    """
    settings = get_settings()
    if settings.tenant_mode == "single":
        return "demo-tenant"

    if not creds:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )

    payload = decode_token(creds.credentials)
    tenant_id = payload.get("tenant_id")
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing tenant_id",
        )
    return tenant_id
