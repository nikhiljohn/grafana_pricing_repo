"""Create or update the app-gate admin user (pre-Workspace-SSO auth).

Run: python -m scripts.create_admin
Reads ADMIN_EMAIL / ADMIN_PASSWORD from the environment. Resets the
password hash and clears any existing TOTP enrollment, so the next
login re-provisions a fresh authenticator QR code.
"""

import asyncio
import os

import bcrypt
from sqlalchemy import text

from app.db.postgres import close_postgres, get_session, init_postgres


async def main() -> None:
    email = os.environ["ADMIN_EMAIL"]
    password = os.environ["ADMIN_PASSWORD"]
    tenant_id = os.environ.get("TENANT_ID", "demo-tenant")

    await init_postgres()
    async for session in get_session():
        await session.execute(
            text(
                "INSERT INTO tenants (id, name, tier) "
                "VALUES (:id, 'Intellicore Demo', 'elite') "
                "ON CONFLICT (id) DO NOTHING"
            ),
            {"id": tenant_id},
        )
        await session.execute(
            text(
                "INSERT INTO users (tenant_id, email, name, password_hash, role) "
                "VALUES (:tenant_id, :email, :name, :hash, 'owner') "
                "ON CONFLICT (tenant_id, email) DO UPDATE "
                "SET password_hash = EXCLUDED.password_hash, "
                "    totp_secret = NULL, totp_confirmed = FALSE"
            ),
            {
                "tenant_id": tenant_id,
                "email": email,
                "name": email.split("@")[0],
                "hash": bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode(),
            },
        )
        await session.commit()
        break
    await close_postgres()
    print(f"Admin user ready: {email} (tenant={tenant_id})")


if __name__ == "__main__":
    asyncio.run(main())
