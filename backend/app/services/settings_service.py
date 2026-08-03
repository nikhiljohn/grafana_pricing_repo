"""Tenant settings — Bring Your Own Key (BYOK) credential storage.

Customers supply their own LLM API keys (Anthropic / OpenAI / Gemini) to
power every AI feature. Keys are encrypted at rest with pgcrypto
(``pgp_sym_encrypt``) using the server credentials secret. Only the last
four characters are ever returned to the UI; the plaintext key leaves the
database only inside the process that makes the LLM call.
"""

import logging

from sqlalchemy import text

from app.config import get_settings
from app.db.postgres import get_session

logger = logging.getLogger(__name__)

VALID_PROVIDERS = ("anthropic", "openai", "gemini")


async def list_ai_credentials(tenant_id: str) -> list[dict]:
    """Return configured providers for a tenant (masked — never the key)."""
    sql = text(
        """
        SELECT provider, key_last4, model, is_active, updated_at
        FROM tenant_ai_credentials
        WHERE tenant_id = :tenant_id
        ORDER BY provider
        """
    )
    async for session in get_session():
        result = await session.execute(sql, {"tenant_id": tenant_id})
        rows = result.mappings().all()
        return [
            {
                "provider": r["provider"],
                "configured": True,
                "key_last4": r["key_last4"],
                "model": r["model"],
                "is_active": r["is_active"],
                "updated_at": r["updated_at"].isoformat() if r["updated_at"] else None,
            }
            for r in rows
        ]
    return []


async def upsert_ai_credential(
    tenant_id: str, provider: str, api_key: str, model: str | None
) -> None:
    """Encrypt and store (or replace) a tenant's key for a provider.

    The first key a tenant adds becomes the active provider automatically.
    """
    if provider not in VALID_PROVIDERS:
        raise ValueError(f"Unsupported provider: {provider}")
    if not api_key or len(api_key) < 8:
        raise ValueError("API key looks too short")

    secret = get_settings().cred_secret
    last4 = api_key[-4:]

    sql = text(
        """
        INSERT INTO tenant_ai_credentials
            (tenant_id, provider, key_ciphertext, key_last4, model, is_active, updated_at)
        VALUES (
            :tenant_id, :provider,
            pgp_sym_encrypt(:api_key, :secret),
            :last4, :model,
            NOT EXISTS (
                SELECT 1 FROM tenant_ai_credentials WHERE tenant_id = :tenant_id
            ),
            NOW()
        )
        ON CONFLICT (tenant_id, provider) DO UPDATE SET
            key_ciphertext = pgp_sym_encrypt(:api_key, :secret),
            key_last4 = :last4,
            model = :model,
            updated_at = NOW()
        """
    )
    async for session in get_session():
        await session.execute(
            sql,
            {
                "tenant_id": tenant_id,
                "provider": provider,
                "api_key": api_key,
                "secret": secret,
                "last4": last4,
                "model": model,
            },
        )
        await session.commit()
        return


async def set_active_provider(tenant_id: str, provider: str) -> None:
    """Mark one provider active (used by AI features); unset the others."""
    if provider not in VALID_PROVIDERS:
        raise ValueError(f"Unsupported provider: {provider}")

    async for session in get_session():
        await session.execute(
            text(
                """
                UPDATE tenant_ai_credentials
                SET is_active = (provider = :provider)
                WHERE tenant_id = :tenant_id
                """
            ),
            {"tenant_id": tenant_id, "provider": provider},
        )
        await session.commit()
        return


async def delete_ai_credential(tenant_id: str, provider: str) -> None:
    """Remove a stored key. If it was active, promote another if present."""
    async for session in get_session():
        await session.execute(
            text(
                """
                DELETE FROM tenant_ai_credentials
                WHERE tenant_id = :tenant_id AND provider = :provider
                """
            ),
            {"tenant_id": tenant_id, "provider": provider},
        )
        # Ensure at least one active provider remains if any are left.
        await session.execute(
            text(
                """
                UPDATE tenant_ai_credentials
                SET is_active = TRUE
                WHERE tenant_id = :tenant_id
                  AND provider = (
                    SELECT provider FROM tenant_ai_credentials
                    WHERE tenant_id = :tenant_id
                    ORDER BY updated_at DESC LIMIT 1
                  )
                  AND NOT EXISTS (
                    SELECT 1 FROM tenant_ai_credentials
                    WHERE tenant_id = :tenant_id AND is_active = TRUE
                  )
                """
            ),
            {"tenant_id": tenant_id},
        )
        await session.commit()
        return


async def get_active_credential(tenant_id: str) -> dict | None:
    """Return the tenant's active provider with the DECRYPTED key.

    Used only inside the process making an LLM call. Returns None if the
    tenant has not configured any key.
    """
    secret = get_settings().cred_secret
    sql = text(
        """
        SELECT provider,
               pgp_sym_decrypt(key_ciphertext, :secret) AS api_key,
               model
        FROM tenant_ai_credentials
        WHERE tenant_id = :tenant_id AND is_active = TRUE
        LIMIT 1
        """
    )
    async for session in get_session():
        result = await session.execute(sql, {"tenant_id": tenant_id, "secret": secret})
        row = result.mappings().first()
        if not row:
            return None
        return {
            "provider": row["provider"],
            "api_key": row["api_key"],
            "model": row["model"],
        }
    return None
