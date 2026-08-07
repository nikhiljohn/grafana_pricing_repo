-- Intellicore CMP — managed customer book migration (idempotent)
-- Applied automatically on new installs (picked up by postgres entrypoint
-- as part of 01-schema.sql). For an ALREADY-RUNNING deployment (postgres
-- init scripts only run once, on first container boot), apply manually:
--
--   docker exec -i intellicore-postgres psql -U intellicore intellicore \
--     < postgres/init/03-customer-book-migration.sql
--
-- Adds the five customer tenants from the demo script (netcore, aarti,
-- shopstop, designx, dmart) so the frontend org switcher and the
-- Neo4j Memory graph (backend/scripts/seed_demo.py) have matching ids.

INSERT INTO tenants (id, name, tier, data_region)
VALUES
    ('netcore', 'Netcore Cloud', 'elite', 'asia-south1'),
    ('aarti', 'Aarti Industries', 'advanced', 'asia-south1'),
    ('shopstop', 'ShoppersStop', 'elite', 'asia-south1'),
    ('designx', 'DesignX', 'foundation', 'asia-south1'),
    ('dmart', 'Dmart', 'elite', 'asia-south1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cloud_accounts (tenant_id, provider, external_id, display_name, status)
VALUES
    ('netcore', 'gcp', 'netcore-prod-1', 'Netcore Production (GCP)', 'connected'),
    ('netcore', 'gcp', 'netcore-staging-1', 'Netcore Staging (GCP)', 'connected'),
    ('aarti', 'aws', 'aarti-prod-1', 'Aarti Production (AWS)', 'connected'),
    ('aarti', 'aws', 'aarti-uat-1', 'Aarti UAT (AWS)', 'connected'),
    ('shopstop', 'gcp', 'shopstop-prod-1', 'ShoppersStop Production (GCP)', 'connected'),
    ('shopstop', 'aws', '010863548913', 'ShoppersStop Analytics (AWS)', 'connected'),
    ('shopstop', 'gcp', 'shopstop-staging-1', 'ShoppersStop Staging (GCP)', 'connected'),
    ('designx', 'gcp', 'designx-prod-1', 'DesignX Production (GCP)', 'connected'),
    ('dmart', 'gcp', 'dmart-prod-1', 'Dmart Production (GCP)', 'connected'),
    ('dmart', 'gcp', 'dmart-staging-1', 'Dmart Staging (GCP)', 'connected')
ON CONFLICT DO NOTHING;
