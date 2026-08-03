-- Intellicore CMP — Postgres schema
-- Applied by the postgres container on first boot.

-- ─── Extensions ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Tenants ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    tier              TEXT NOT NULL DEFAULT 'foundation'
                      CHECK (tier IN ('foundation', 'advanced', 'elite')),
    csre_squad_id     TEXT,
    data_region       TEXT NOT NULL DEFAULT 'asia-south1',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Users ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email             TEXT NOT NULL,
    name              TEXT,
    -- NULL for OAuth-only users (no local password set).
    password_hash     TEXT,
    role              TEXT NOT NULL DEFAULT 'viewer'
                      CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    -- App-gate auth (pre-Workspace-SSO): TOTP secret is provisioned on the
    -- user's first login and confirmed once they verify a code against it.
    -- Not required for OAuth-authenticated users.
    totp_secret       TEXT,
    totp_confirmed    BOOLEAN NOT NULL DEFAULT FALSE,
    -- OAuth (Google / Microsoft). oauth_sub is the provider's stable user id.
    oauth_provider    TEXT CHECK (oauth_provider IN ('google', 'microsoft')),
    oauth_sub         TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at     TIMESTAMPTZ,
    UNIQUE (tenant_id, email),
    -- Fast lookup by OAuth identity.
    UNIQUE (oauth_provider, oauth_sub)
);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- ─── Cloud Accounts ────────────────────────────────────────────────
-- The customer's connected GCP projects / AWS accounts.
CREATE TABLE IF NOT EXISTS cloud_accounts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider          TEXT NOT NULL CHECK (provider IN ('gcp', 'aws')),
    external_id       TEXT NOT NULL,   -- GCP project id or AWS account id
    display_name      TEXT,
    status            TEXT NOT NULL DEFAULT 'connected'
                      CHECK (status IN ('connected', 'degraded', 'disconnected')),
    connected_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_event_at     TIMESTAMPTZ,
    ingest_config     JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (tenant_id, provider, external_id)
);
CREATE INDEX IF NOT EXISTS idx_accounts_tenant ON cloud_accounts(tenant_id);

-- ─── Audit log ─────────────────────────────────────────────────────
-- Every user action in the Intellicore UI is recorded here.
CREATE TABLE IF NOT EXISTS audit_log (
    id                BIGSERIAL PRIMARY KEY,
    tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
    action            TEXT NOT NULL,
    entity_type       TEXT,
    entity_id         TEXT,
    detail            JSONB NOT NULL DEFAULT '{}'::jsonb,
    ts                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_ts ON audit_log(tenant_id, ts DESC);

-- ─── Guardrails ────────────────────────────────────────────────────
-- Patterns customers have chosen to "never again" — actionable rules.
CREATE TABLE IF NOT EXISTS guardrails (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pattern_id        TEXT NOT NULL,       -- refs Pattern.id in Neo4j
    title             TEXT NOT NULL,
    enforcement       TEXT NOT NULL DEFAULT 'warn'
                      CHECK (enforcement IN ('warn', 'block')),
    scope             JSONB NOT NULL DEFAULT '{}'::jsonb,
    enabled           BOOLEAN NOT NULL DEFAULT TRUE,
    created_by        UUID REFERENCES users(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, pattern_id)
);

-- ─── Tenant AI credentials (Bring Your Own Key) ───────────────────
-- Customers supply their own LLM API keys (Anthropic / OpenAI / Gemini)
-- to power every AI feature. Keys are encrypted at rest with pgcrypto
-- (pgp_sym_encrypt) using the server credentials secret; only the last
-- 4 characters are ever returned to the UI.
CREATE TABLE IF NOT EXISTS tenant_ai_credentials (
    tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider          TEXT NOT NULL
                      CHECK (provider IN ('anthropic', 'openai', 'gemini')),
    key_ciphertext    BYTEA NOT NULL,
    key_last4         TEXT NOT NULL,
    model             TEXT,
    is_active         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_ai_creds_tenant ON tenant_ai_credentials(tenant_id);

-- ─── Seed demo tenant ──────────────────────────────────────────────
INSERT INTO tenants (id, name, tier, data_region)
VALUES ('demo-tenant', 'Netcore Cloud (Demo)', 'advanced', 'asia-south1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (tenant_id, email, name, password_hash, role)
VALUES (
    'demo-tenant',
    'demo@intellicore.searce.com',
    'Demo User',
    -- bcrypt of 'demo'; regenerate in production
    '$2b$12$KIXKQhZQhZQhZQhZQhZQuOJgOJgOJgOJgOJgOJgOJgOJgOJgOJgOJ',
    'owner'
)
ON CONFLICT (tenant_id, email) DO NOTHING;

INSERT INTO cloud_accounts (tenant_id, provider, external_id, display_name, status)
VALUES
    ('demo-tenant', 'gcp', 'netcore-prod', 'Netcore Production (GCP)', 'connected'),
    ('demo-tenant', 'gcp', 'netcore-staging', 'Netcore Staging (GCP)', 'connected'),
    ('demo-tenant', 'aws', '429617291000', 'Netcore Analytics (AWS)', 'connected')
ON CONFLICT DO NOTHING;
