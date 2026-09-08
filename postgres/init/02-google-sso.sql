-- Google Workspace SSO migration
-- Allow password_hash to be empty for SSO-only users.
ALTER TABLE users ALTER COLUMN password_hash SET DEFAULT '';
-- Add SSO provider tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS sso_provider TEXT;
