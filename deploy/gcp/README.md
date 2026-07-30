# Deploying Intellicore CMP to Google Cloud

One command from Cloud Shell, run at the repo root:

```bash
bash deploy/gcp/deploy.sh
```

## What you get

| | |
|---|---|
| URL | `https://<static-ip>.sslip.io` (auto-TLS via Let's Encrypt) |
| Login | Email + password, set by you during deploy |
| 2FA | TOTP (Google Authenticator, Authy, 1Password, ...) — enrolled via QR on first login |
| "Remember me" | Checkbox at login skips the TOTP prompt for 30 days on that browser |
| Compute | 1× `e2-standard-2` VM, `asia-south1` (~$50/mo) |
| Exposure | Ports 80/443 only — DBs and app servers stay private |

## Architecture

```
Internet ──► Caddy :443 (TLS)
               ├─ /login, /api/auth/login, /api/auth/totp/verify   ─► public
               ├─ /api/*   ─► FastAPI backend :8000     ┐ session-gated
               └─ /*       ─► Next.js frontend :3000    ┘
                                   │
                     Postgres · Neo4j (Memory graph) · Redis
```

Every route except the login page and the two auth endpoints that
implement it requires a valid `intellicore_session` cookie — Caddy checks
it via `forward_auth` against the backend's `GET /auth/session/check` on
every request; a 401 there 302s the browser to `/login`.

## Why app-gate auth instead of Google SSO

This deploy currently runs under a personal/sandbox GCP account
(`cmspractice10@gmail.com`), not the Searce Workspace org. Google's
"Internal" OAuth consent screen — which would lock sign-in to `@searce.com`
at the identity-provider level — is only available to projects owned by a
Workspace organization, so it isn't an option here yet.

Instead, the app itself gates access: one admin account you set during
deploy, password + TOTP, exactly like enabling 2-Step Verification on any
individual account. It's a real security boundary today, and it's designed
to be swapped out, not thrown away, once this moves to Searce's GCP org.

### Migrating to Google Workspace SSO later

1. Move/recreate the project under the Searce GCP org.
2. Create an **Internal** OAuth consent screen + Web OAuth client
   (redirect URI `https://<domain>/oauth2/callback`).
3. Reintroduce an `oauth2-proxy` service in
   `docker-compose.prod.yml` (config is straightforward — provider
   `google`, `OAUTH2_PROXY_EMAIL_DOMAINS=searce.com`) and repoint the
   Caddyfile's `forward_auth` target from `backend:8000/auth/session/check`
   to `oauth2-proxy:4180/oauth2/auth`.
4. Leave `app/api/auth.py` in place or remove it — the app-gate and SSO
   paths don't conflict, since both terminate at the same protected routes.

## Manual steps (none — this is fully scripted)

Unlike the earlier Google OAuth design, there's no console step Google
gates behind a UI. The script prompts you directly for the admin email and
password.

## Day-2 operations

```bash
# SSH in
gcloud compute ssh intellicore-cmp-prod --zone asia-south1-a

# On the VM — logs / restart / re-seed
cd ~/intellicore-cmp
sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml logs -f
sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml restart backend
sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml exec -T backend python -m scripts.seed_demo

# Reset the admin password (re-run with new credentials, then log in —
# a fresh TOTP QR is issued automatically since enrollment is cleared)
sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml exec \
  -e ADMIN_EMAIL=you@example.com -e ADMIN_PASSWORD='new-password' \
  -T backend python -m scripts.create_admin

# Stop the VM when idle (stops billing for compute)
gcloud compute instances stop intellicore-cmp-prod --zone asia-south1-a
```

## Custom domain later?

Point an A record (e.g. `intellicore.searce.io`) at the static IP, set
`DOMAIN=intellicore.searce.io` in `.env.prod`, and `up -d` again — Caddy
issues the new cert automatically.
