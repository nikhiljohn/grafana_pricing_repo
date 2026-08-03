-- Intellicore CMP — OAuth migration (idempotent)
-- Applied automatically on new installs (picked up by postgres entrypoint).
-- For existing databases run manually:
--   docker exec intellicore-postgres psql -U intellicore intellicore \
--     -f /docker-entrypoint-initdb.d/02-oauth-migration.sql

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS oauth_provider TEXT
        CHECK (oauth_provider IN ('google', 'microsoft'));

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS oauth_sub TEXT;

-- Unique index — guards against duplicate OAuth accounts. CREATE UNIQUE INDEX
-- is safer than ADD CONSTRAINT here because it supports IF NOT EXISTS.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth
    ON users (oauth_provider, oauth_sub)
    WHERE oauth_provider IS NOT NULL AND oauth_sub IS NOT NULL;
