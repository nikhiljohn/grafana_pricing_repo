# Onboarding a New Customer — Staging & Production

Intellicore CMP runs **one isolated VM per customer per environment** (hard data
isolation, simplest billing). To onboard a customer you stand up **staging**
first, validate, then **production**. Two ways to do it: a one-shot script, or
the GitHub Actions workflow.

---

## What each environment is

| | Staging | Production |
|---|---|---|
| VM name | `intellicore-<customer>-staging` | `intellicore-<customer>-production` |
| Default machine | `e2-standard-2` | `e2-standard-4` |
| URL | `https://<ip>.sslip.io` (auto-TLS) | `https://<ip>.sslip.io` or your DNS |
| Data | separate Postgres/Neo4j/Redis volumes | separate volumes |
| Purpose | validate, demo, UAT | live customer |

Everything (frontend, backend, Postgres, Neo4j, Redis, Caddy) runs via
`deploy/gcp/docker-compose.prod.yml`. Caddy handles auto-TLS; only 80/443 are
exposed. Auth is email/password + TOTP (swappable to Workspace SSO later —
see `deploy/gcp/README.md`).

---

## Prerequisites (once)

- A GCP project for the customer (or a shared one), billing enabled.
- `gcloud` authenticated (Cloud Shell is easiest — it already is).
- This repo checked out. Run all commands **from the repo root**.

---

## Option A — One-shot script (recommended)

`deploy/gcp/provision-customer.sh` reserves a static IP, opens the firewall,
creates the VM, installs Docker, ships this repo, generates strong secrets,
brings up the stack, and bootstraps the first admin.

**1. Staging**
```bash
CUSTOMER=acme \
PROJECT=acme-cloud-prod \
ADMIN_EMAIL=admin@acme.com \
ENVIRONMENT=staging \
REGION=asia-south1 \
./deploy/gcp/provision-customer.sh
```

**2. Production** (after staging looks good)
```bash
CUSTOMER=acme \
PROJECT=acme-cloud-prod \
ADMIN_EMAIL=admin@acme.com \
ENVIRONMENT=production \
REGION=asia-south1 \
./deploy/gcp/provision-customer.sh
```

Each run prints the **URL, admin email, and generated admin password**
(share the password securely — first login provisions the TOTP QR code).
Override the VM size with `MACHINE_TYPE=e2-standard-4` if needed.

---

## Option B — GitHub Actions workflow

Use `.github/workflows/deploy-customer.yml` (**Actions → Deploy Customer
Environment → Run workflow**). Inputs: customer name, GCP project, region,
machine type, admin email. Requires repo secrets/vars:

- Secret `GCP_SA_KEY` — service-account JSON (Compute Admin + OS Login/SSH)
- Variable `GCP_PROJECT_ID` (or pass per-run)

Run it once with a staging name and once with a production name. The workflow
provisions the VM and deploys, printing the URL + credentials in the run log.

For **ongoing deploys** to existing customer envs, use the branch-based
pipelines: push to `staging` → `deploy-staging.yml`; push to `main` →
`deploy-production.yml` (health check + auto-rollback). These build into a new
directory and swap, so they never leave stale files.

---

## After provisioning — verify

1. Open `https://<ip>.sslip.io` (TLS provisions on the first HTTPS hit; allow ~30s).
2. Log in with the admin email + generated password → set up the authenticator app.
3. Check the sidebar shows Command Center + the five pillars (incl. **Cloud
   Security**), **Settings**, **Alerts**, **Memory**.
4. **Settings → AI Keys** — have the customer paste their own Anthropic/OpenAI/
   Gemini key (BYOK) to enable AI features. Nothing AI works until a key is active.
5. Try **Download report** on any pillar — a branded PDF should download.

---

## Required environment values

`provision-customer.sh` generates `.env.prod` for you. If you ever hand-create
it, copy `deploy/gcp/.env.prod.example` and fill in — the stack refuses to start
without `POSTGRES_PASSWORD`, `NEO4J_PASSWORD`, `JWT_SECRET`, `DOMAIN`,
`LETSENCRYPT_EMAIL`. Generate secrets with `openssl rand -hex 24|32`.

---

## Updating an existing customer environment

SSH to the VM and pull + rebuild (preserves secrets):
```bash
gcloud compute ssh intellicore-<customer>-<env> --zone <zone> --command '
  APP=~/intellicore-cmp
  C="sudo docker compose --env-file $APP/.env.prod -f $APP/deploy/gcp/docker-compose.prod.yml"
  cd $APP && git pull 2>/dev/null || true
  $C up -d --build
'
```
For a clean update that also clears deleted files, re-run the branch pipeline
or re-run `provision-customer.sh` (it re-ships the repo; note this recreates the
app dir — data volumes persist).

---

## Custom domain (optional, instead of sslip.io)

Point the customer's DNS `A` record at the static IP, set `DOMAIN=cmp.acme.com`
and `LETSENCRYPT_EMAIL=...` in `.env.prod`, then
`docker compose ... up -d` to re-issue the cert.

---

## Teardown

```bash
gcloud compute instances delete intellicore-<customer>-<env> --zone <zone>
gcloud compute addresses delete intellicore-<customer>-<env>-ip --region <region>
gcloud compute firewall-rules delete intellicore-<customer>-<env>-web
```

---

## Cost per environment (asia-south1, list price)

- Staging (e2-standard-2): **~$85–95/mo** · Production (e2-standard-4): **~$105–145/mo**.
- LLM inference is **not** a platform cost — BYOK (customer's own key).
- Full breakdown + HA topology: `docs/GCP_ARCHITECTURE.md`.
