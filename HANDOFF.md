# Intellicore CMP — Deployment Handoff

> Paste this into a new Claude Code session to pick up where the last one left off.
> Read alongside `CLAUDE.md` (product/architecture context). This file is the
> **live infrastructure state** — what's deployed, where, and what's still broken.

**Last updated:** 2026-09-09
**Branch:** `claude/intellicore-cmp-review-j4fbts` (clean, all work committed)
**Latest commit:** `18b46c9` — feat: connect to Searce GCP — IAP CI/CD + Google Workspace SSO + Cloud DNS

---

## 1. Where things stand

The app is deployed to a Searce GCP VM. The GCP side (project, VM, IAP, service
account, OAuth client) is **fully provisioned and working**. The remaining friction
is all on the VM: getting the right Docker Compose file running so Caddy serves
HTTPS, and getting a valid admin login.

| Area | Status |
|---|---|
| GCP project + billing | ✅ Done — using existing project with Searce sandbox billing |
| VM + static IP + firewall | ✅ Done |
| IAP SSH (no open port 22) | ✅ Done |
| CI/CD service account + JSON key | ✅ Generated, **not yet added to GitLab** |
| Google OAuth client (Workspace SSO) | ✅ Created, credentials in `.env.prod` |
| `.env.prod` on the VM | ✅ Generated (see §4 for the gotcha) |
| Admin user | ✅ Created via `create_admin.py` |
| **Caddy / HTTPS serving** | ⚠️ **In progress — see §3** |
| GitLab CI/CD variables | ❌ Not done |
| VM git remote → Searce GitLab | ❌ Still points at GitHub |

---

## 2. Infrastructure values

Everything you need to SSH, deploy, or configure CI/CD.

```
GCP project        atre-practice-solutionplatform
Billing account    016EA9-2AEB8C-77EA79  (Searce Internal Sandbox)
VM name            intellicore-cmp-v1
Zone               asia-south1-a
Static IP          35.200.215.108
Domain             35-200-215-108.sslip.io
App URL            https://35-200-215-108.sslip.io
VM SSH user        nikhil_john_searce_com
Repo path on VM    ~/intellicore-cmp
```

**CI/CD service account**
```
intellicore-cicd@atre-practice-solutionplatform.iam.gserviceaccount.com
Key file (in Cloud Shell): ~/intellicore-cmp/intellicore-cicd-sa-key.json
Roles: roles/iap.tunnelResourceAccessor, roles/compute.viewer, roles/iam.serviceAccountUser
```

**Google OAuth (Workspace SSO)**
```
Client ID       <in .env.prod on the VM as GOOGLE_OAUTH_CLIENT_ID>
Client secret   <in .env.prod on the VM as GOOGLE_OAUTH_CLIENT_SECRET>
Allowed domain  searce.com
Authorized JS origin    https://35-200-215-108.sslip.io      (base URL only, no path)
Authorized redirect URI https://35-200-215-108.sslip.io/api/auth/google/callback
```
The client lives in GCP Console → APIs & Services → Credentials, in project
`atre-practice-solutionplatform`.

**App login**
```
Email     nikhil.john@searce.com
Password  <see ADMIN_PASSWORD in .env.prod on the VM>
```
First login prompts for a TOTP QR scan (Google Authenticator / Authy).
To reset the password, re-run `create_admin.py` — it also clears TOTP enrolment.

> 🔐 **This repo is public — no secrets in this file.** Every live value lives in
> `~/intellicore-cmp/.env.prod` on the VM, which is gitignored. To read them:
> ```bash
> gcloud compute ssh nikhil_john_searce_com@intellicore-cmp-v1 \
>   --zone=asia-south1-a --tunnel-through-iap \
>   --project=atre-practice-solutionplatform \
>   --command='cat ~/intellicore-cmp/.env.prod'
> ```

---

## 3. The current blocker — wrong compose file

**Symptom:** `https://35-200-215-108.sslip.io` doesn't load. `docker compose ps`
shows 5 containers (postgres, neo4j, redis, backend, frontend) — **no Caddy**.
`docker compose logs caddy` returns `no such service: caddy`.

**Cause:** The repo has two compose files:

| File | Purpose | Has Caddy? |
|---|---|---|
| `docker-compose.yml` (repo root) | Local dev | ❌ No |
| `deploy/gcp/docker-compose.prod.yml` | Production | ✅ Yes — `intellicore-edge` on :80/:443 |

Plain `docker compose up` on the VM picks the **root** file, so nothing binds
:443 and the site is unreachable from the internet. Every command on the VM must
pass `-f deploy/gcp/docker-compose.prod.yml`.

**Fix (this command was issued but its result was never confirmed — re-run and
check the output):**

```bash
gcloud compute ssh nikhil_john_searce_com@intellicore-cmp-v1 \
  --zone=asia-south1-a \
  --tunnel-through-iap \
  --project=atre-practice-solutionplatform \
  --command='
    cd ~/intellicore-cmp

    # update.sh and the CI pipeline expect .env.prod at the REPO ROOT,
    # but the setup script wrote it to deploy/gcp/. Move it once.
    if [ -f deploy/gcp/.env.prod ] && [ ! -f .env.prod ]; then
      mv deploy/gcp/.env.prod .env.prod
    fi

    sudo docker compose --env-file .env.prod down --remove-orphans 2>/dev/null || true

    sudo docker compose --env-file .env.prod \
      -f deploy/gcp/docker-compose.prod.yml up -d

    sleep 30
    sudo docker compose --env-file .env.prod \
      -f deploy/gcp/docker-compose.prod.yml ps

    # ADMIN_EMAIL / ADMIN_PASSWORD are already in .env.prod, so the backend
    # container has them in its env — no need to retype the password.
    sudo docker compose --env-file .env.prod \
      -f deploy/gcp/docker-compose.prod.yml exec backend \
      python -m scripts.create_admin
  '
```

**Success looks like:** 6 containers running, including `intellicore-edge`
(the Caddy container) with `0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp`.

**If Caddy is up but HTTPS still fails:** it's almost certainly Let's Encrypt.
Check `docker compose ... logs caddy --tail=50`. Confirm the GCP firewall allows
:80 and :443 from `0.0.0.0/0` — LE needs :80 reachable for the HTTP-01 challenge.

---

## 4. Gotchas already hit (don't rediscover these)

1. **`.env.prod` path mismatch.** `deploy/gcp/update.sh` does `cd <repo root>` then
   looks for `./.env.prod`, and its `$COMPOSE` var is
   `sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml`.
   So the canonical location is the **repo root**, not `deploy/gcp/`. The setup
   script writes it to `deploy/gcp/` — that inconsistency is worth fixing in the
   repo (see §6).

2. **Docker permission denied.** The IAP SSH user isn't in the `docker` group by
   default. Already fixed with
   `sudo usermod -aG docker nikhil_john_searce_com`, but group membership only
   applies to *new* SSH sessions. Using `sudo docker` sidesteps it entirely — all
   the commands here do that.

3. **Stale container name conflicts.** A partial `down` left
   `intellicore-neo4j` around and blocked recreate. Nuke with:
   ```bash
   sudo docker rm -f intellicore-postgres intellicore-neo4j intellicore-redis \
     intellicore-backend intellicore-frontend intellicore-edge 2>/dev/null || true
   ```

4. **The seed demo user cannot log in.** `postgres/init/01-schema.sql:116` inserts
   `demo@intellicore.searce.com` with a **placeholder bcrypt hash** that isn't a
   valid hash (`$2b$12$KIXKQhZQhZQhZQhZQhZQuOJgOJg...` — repeating filler). It will
   never match any password. Always provision via
   `backend/scripts/create_admin.py`. Worth replacing the placeholder with a real
   hash or dropping the seed user (see §6).

5. **Postgres password changes need a volume wipe.** The password is baked in at
   first init. If you regenerate `.env.prod`, you must
   `docker volume rm intellicore-cmp_postgres_data` or the backend can't connect.

6. **OAuth console field confusion.** "Authorized JavaScript origins" takes the
   **base URL only** (`https://35-200-215-108.sslip.io`). The callback path goes
   in "Authorized redirect URIs". Putting a path in the origins field throws
   "Invalid Origin".

7. **Billing.** The user lacks `billing.resourceAssociations.create`, so new GCP
   projects can't be created and linked. That's why this runs in the pre-existing
   `atre-practice-solutionplatform` project.

---

## 5. Remaining work

**a. Confirm the site is up.** Run §3, verify `intellicore-edge` is listed, load
the URL, log in, complete TOTP enrolment.

**b. Test Google SSO.** Once HTTPS works, the login page should show
"Continue with Google" (it's feature-detected via `GET /api/auth/google/status`,
which returns `{"enabled": true}` only when all three
`GOOGLE_OAUTH_*` vars are set). Confirm a `@searce.com` account signs in and a
non-Searce account is rejected with `domain_not_allowed`.

**c. Add the 6 GitLab CI/CD variables.** Settings → CI/CD → Variables:

| Variable | Type | Value |
|---|---|---|
| `GCP_SA_KEY` | **File** | full JSON from `intellicore-cicd-sa-key.json` — Protect, do **not** mask |
| `GCP_PROJECT_ID` | Variable | `atre-practice-solutionplatform` |
| `VM_NAME` | Variable | `intellicore-cmp-v1` |
| `VM_ZONE` | Variable | `asia-south1-a` |
| `VM_USER` | Variable | `nikhil_john_searce_com` |
| `DOMAIN` | Variable | `35-200-215-108.sslip.io` |

**d. Point the VM's git remote at Searce GitLab.** The pipeline does
`git fetch origin main && git reset --hard origin/main` on the VM. The remote is
still GitHub, so CI deploys would pull the wrong source.
```bash
# On the VM:
git remote set-url origin https://gitlab.searce.com/<group>/intellicore-cmp.git
# Needs a deploy token for HTTPS pulls:
#   GitLab → Settings → Repository → Deploy Tokens (scope: read_repository)
#   git remote set-url origin https://<token-user>:<token>@gitlab.searce.com/<group>/intellicore-cmp.git
```

**e. Merge this branch to `main`.** The pipeline only fires on `main`
(`.gitlab-ci.yml` rules). Nothing auto-deploys until the work lands there.

---

## 6. Repo fixes worth making

Small changes that would have prevented most of the pain above:

1. **Unify the `.env.prod` location.** Make `setup-searce-gcp.sh` write to the repo
   root, matching what `update.sh` and the CI pipeline read. Or teach both to check
   `deploy/gcp/.env.prod` as a fallback.
2. **Fix or drop the seed user** in `postgres/init/01-schema.sql:110-119` — the
   bcrypt hash is a non-functional placeholder that reads as a working credential.
3. **Add a compose-file guard.** A tiny `deploy/gcp/dc.sh` wrapper that always
   applies `--env-file .env.prod -f deploy/gcp/docker-compose.prod.yml` would make
   "wrong compose file" structurally impossible.
4. **Add `usermod -aG docker` to the provisioning script** so the IAP user has
   Docker access from the start.

---

## 7. Command cheat sheet

All of these run from Cloud Shell. `$DC` is the correct compose invocation.

```bash
# SSH in interactively
gcloud compute ssh nikhil_john_searce_com@intellicore-cmp-v1 \
  --zone=asia-south1-a --tunnel-through-iap \
  --project=atre-practice-solutionplatform

# On the VM, define this first — it saves a lot of grief:
cd ~/intellicore-cmp
DC="sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml"

$DC ps                          # container status
$DC logs caddy --tail=50        # TLS / routing issues
$DC logs backend --tail=50      # API errors
$DC logs frontend --tail=50     # Next.js errors
$DC restart backend             # restart one service
$DC up -d --build               # rebuild + restart everything

# Re-apply the admin user from .env.prod (also clears TOTP enrolment)
$DC exec backend python -m scripts.create_admin

# Set a NEW admin password: edit ADMIN_PASSWORD in .env.prod, then
$DC up -d --no-deps backend && $DC exec backend python -m scripts.create_admin

# Standard redeploy after a git pull (uses deploy/gcp/update.sh)
git fetch origin main && git reset --hard origin/main && bash deploy/gcp/update.sh
```

---

## 8. Relevant files

| Path | What it does |
|---|---|
| `deploy/gcp/docker-compose.prod.yml` | **The** production stack. Caddy + 5 services. |
| `docker-compose.yml` | Local dev only. No Caddy. Not for the VM. |
| `deploy/gcp/Caddyfile` | TLS + `forward_auth` session gate. `@public` matcher lists the routes reachable without a session — includes the three Google SSO endpoints. |
| `deploy/gcp/setup-searce-gcp.sh` | One-shot GCP provisioning (7 steps). Already run. |
| `deploy/gcp/update.sh` | Incremental redeploy. Called by CI. Expects `.env.prod` at repo root. |
| `deploy/gcp/.env.prod.example` | Template documenting every env var. |
| `deploy/gcp/GITLAB_CI.md` | Full CI/CD setup guide + IAP troubleshooting. |
| `.gitlab-ci.yml` | Two stages: `frontend:build`, then `deploy:production` via IAP SSH. `main` only. |
| `backend/scripts/create_admin.py` | Provisions/resets the admin user. Reads `ADMIN_EMAIL` / `ADMIN_PASSWORD`. |
| `backend/app/api/auth.py` | Password + TOTP login, plus the three Google SSO endpoints. |
| `backend/app/config.py` | `google_oauth_enabled` gates the SSO button. |
| `postgres/init/01-schema.sql` | Schema + seed. ⚠️ Seed user's hash is a placeholder. |
| `postgres/init/02-google-sso.sql` | Allows empty `password_hash` for SSO-provisioned users. |
| `frontend/src/components/login/LoginForm.tsx` | Login UI, Google button, SSO error messages. |

---

## 9. How to open the next session

Something like:

> Read `HANDOFF.md` and `CLAUDE.md` in the repo root. I'm continuing the Intellicore
> CMP deployment to Searce GCP. Pick up at section 3 — the site at
> https://35-200-215-108.sslip.io still isn't loading and I need Caddy serving HTTPS.

Have Cloud Shell open at `~/intellicore-cmp` in the
`atre-practice-solutionplatform` project. Claude will hand you `gcloud compute ssh
--tunnel-through-iap` commands to paste — it has no direct access to the VM.
