-- ─────────────────────────────────────────────────────────────────────
--  Intellicore CMP — Shoppers Stop tenant provisioning
--
--  First real customer tenant. Provisions the tenant record, the 7 GCP
--  projects under management, and the Memory-derived guardrails for the
--  eCommerce Cloud Managed Services engagement.
--
--  Source: SOW "Cloud Managed Services — eCommerce Workloads",
--  Shoppers Stop Limited × Searce Cosourcing Services, v1.0 Draft,
--  4 Sep 2026. Effective 1 Oct 2026, 36-month term.
--
--  WHEN THIS RUNS
--  Files in postgres/init/ execute once, on FIRST initialisation of an
--  empty data volume. On an already-initialised database this file is
--  NOT picked up automatically — run it by hand:
--
--    docker compose --env-file .env.prod \
--      -f deploy/gcp/docker-compose.prod.yml exec -T postgres \
--      psql -U intellicore -d intellicore < postgres/init/03-shoppersstop-tenant.sql
--
--  It is idempotent, so re-running is safe.
--
--  USERS ARE DELIBERATELY NOT SEEDED HERE.
--  users.password_hash is NOT NULL, and seeding a placeholder hash is
--  exactly the trap the demo user in 01-schema.sql fell into: a row that
--  reads like a working credential but matches no password. Provision
--  real users with backend/scripts/create_admin.py instead. The intended
--  roster is listed in the comment block at the end of this file.
-- ─────────────────────────────────────────────────────────────────────

-- ─── Tenant ──────────────────────────────────────────────────────────
-- tier: 'elite' is an INFERENCE, not a contract term. The SOW does not
-- name a tier; it is inferred from 24x7x365 coverage across 7 towers
-- with a 15-minute P1 response SLO (§4.3, §7.1). Confirm before billing.
INSERT INTO tenants (id, name, tier, data_region, csre_squad_id)
VALUES ('shoppersstop', 'Shoppers Stop Limited', 'elite', 'asia-south1', NULL)
ON CONFLICT (id) DO UPDATE
    SET name        = EXCLUDED.name,
        tier        = EXCLUDED.tier,
        data_region = EXCLUDED.data_region,
        updated_at  = NOW();

-- csre_squad_id stays NULL on purpose: SOW §9 item 2 (dedicated PoC vs
-- shared squad model) is unresolved, due within 14 days of the Effective
-- Date, and §6 lists the L1 squad lead as TBD. Set it once §9.2 closes.

-- ─── Cloud accounts — the 7 GCP projects [SOW §4.2] ──────────────────
-- Project IDs mirror frontend/src/lib/api/mock/shoppersstop-env.ts. Both
-- are placeholders pending the real IDs, which arrive with SOW §9 item 3
-- (access provisioning, due 1 Oct 2026). Update both together.
--
-- status starts 'disconnected': nothing is connected until the Searce
-- service accounts are granted access. Onboarding flips these to
-- 'connected' as each project is verified.
INSERT INTO cloud_accounts (tenant_id, provider, external_id, display_name, status)
VALUES
    ('shoppersstop', 'gcp', 'ss-ecom-prod-network', 'Production — VPC / Jump / Firewall', 'disconnected'),
    ('shoppersstop', 'gcp', 'ss-ecom-prod-gke',     'Production — GKE cluster project',   'disconnected'),
    ('shoppersstop', 'gcp', 'ss-ecom-prod-winapi',  'Production — Windows VM / Ecom API', 'disconnected'),
    ('shoppersstop', 'gcp', 'ss-ecom-uat-1',        'Non-Production — UAT 1',             'disconnected'),
    ('shoppersstop', 'gcp', 'ss-ecom-uat-2',        'Non-Production — UAT 2',             'disconnected'),
    ('shoppersstop', 'gcp', 'ss-ecom-dev',          'Non-Production — Development',       'disconnected'),
    ('shoppersstop', 'gcp', 'ss-ecom-cicd',         'CI/CD — Jenkins (gcphulk.ssecom.tech)', 'disconnected')
ON CONFLICT DO NOTHING;

-- ─── Guardrails ──────────────────────────────────────────────────────
-- Each guardrail encodes a learning from this estate's Memory into a
-- pre-change check. These are the rules that stop the squad — or an
-- agent — from repeating a known-bad action.
--
-- enforcement 'block' is reserved for actions with a customer-visible
-- blast radius. Everything else warns, because a guardrail that fires
-- noisily and wrongly gets disabled, and then protects nothing.
--
-- created_by is NULL: these are platform-seeded, not user-authored.
INSERT INTO guardrails (tenant_id, pattern_id, title, enforcement, scope, enabled)
VALUES
    -- Sale-window headroom is deliberate over-provisioning. A generic
    -- right-sizing pass cannot tell it from waste. SOW §7.2 requires 48h
    -- notice of sale events; that notice is also the do-not-downsize signal.
    ('shoppersstop', 'finops-sale-window-headroom',
     'Block right-sizing of production GKE inside a sale window',
     'block',
     '{"projects":["ss-ecom-prod-gke"],"resource_types":["gke_node_pool"],"requires":"sale_calendar_check"}'::jsonb,
     TRUE),

    -- Both deploy failures in 90 days carried a schema change. Schema
    -- governance is open (SOW §9 item 1) — until it closes, a
    -- schema-bearing release needs a rehearsal and a human on call.
    ('shoppersstop', 'devops-schema-release-rehearsal',
     'Require UAT rehearsal + named on-call for any schema-bearing release',
     'block',
     '{"projects":["ss-ecom-prod-gke"],"change_types":["db_schema_migration"],"requires":"uat_rehearsal_evidence"}'::jsonb,
     TRUE),

    -- Deploys are contractually confined to 02:00-05:00 IST (SOW §4.6,
    -- §7.2). Emergency P1 work may fall outside it; routine work may not.
    ('shoppersstop', 'devops-maintenance-window',
     'Block routine deployments outside the 02:00-05:00 IST window',
     'block',
     '{"window":"02:00-05:00 Asia/Kolkata","exempt_priorities":["P1"]}'::jsonb,
     TRUE),

    -- PITR and HA are how the §4.5 point-in-time restore commitment is
    -- actually met. Disabling them silently breaches the SOW.
    ('shoppersstop', 'db-pitr-ha-required',
     'Warn on any Cloud SQL instance with PITR or HA disabled',
     'warn',
     '{"resource_types":["cloudsql_instance"],"require":["pitr","regional_ha"]}'::jsonb,
     TRUE),

    -- Static SA keys are the recurring identity-hygiene finding here
    -- (SOW §4.8). Workload Identity removes the key class entirely.
    ('shoppersstop', 'sec-sa-key-age',
     'Warn on service account keys older than 90 days',
     'warn',
     '{"max_age_days":90,"prefer":"workload_identity"}'::jsonb,
     TRUE),

    -- Silent TLS expiry takes ss.com down outright. Certs live as
    -- Kubernetes secrets via Istio (SOW §4.4).
    ('shoppersstop', 'sec-tls-expiry',
     'Warn 30 days before any Istio-managed TLS secret expires',
     'warn',
     '{"namespace":"istio-system","warn_days":30}'::jsonb,
     TRUE),

    -- Egress magnitude alone produces false positives on this estate;
    -- the catalogue export subnet is benign, the payment subnet is not.
    ('shoppersstop', 'cloudops-egress-by-subnet',
     'Classify egress anomalies by source subnet, not magnitude',
     'warn',
     '{"benign_sources":["catalogue_export"],"escalate_sources":["payment_gateway"]}'::jsonb,
     TRUE)
ON CONFLICT (tenant_id, pattern_id) DO UPDATE
    SET title       = EXCLUDED.title,
        enforcement = EXCLUDED.enforcement,
        scope       = EXCLUDED.scope,
        enabled     = EXCLUDED.enabled;

-- ─────────────────────────────────────────────────────────────────────
--  Intended user roster [SOW §5] — provision with create_admin.py,
--  do NOT insert here.
--
--    Client
--      bipin.nasit@shoppersstop.com      Head - IT Infrastructure      (admin)
--      sandeep.sharma@shoppersstop.com   Head - eCommerce              (viewer)
--      subhasish.mishra@shoppersstop.com eCommerce Infrastructure Lead (admin)
--
--    Searce
--      harish.gurram@searce.com          Director - CMS                (owner)
--      chandan.rudani@searce.com         Sr. Manager - CMS             (admin)
--      rathod.dhwani@searce.com          Sr. Solutions Consultant      (editor)
--      nikhil.john@searce.com            Director - Solutions          (editor)
--
--  BYOK: tenant_ai_credentials is intentionally empty. The Client
--  supplies and maintains the LLM key (SOW §3.2, §4.10). Until a key is
--  active, every AI Hub feature is inert and the towers run manually.
-- ─────────────────────────────────────────────────────────────────────
