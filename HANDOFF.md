# Intellicore CMP — Deployment Handoff

> Paste this into a new Claude Code session to pick up where the last one left off.
> Read alongside `CLAUDE.md` (product/architecture context). This file is the
> **live infrastructure state** — what's deployed, where, and what's still broken.

**Last updated:** 2026-09-10
**Branch:** `claude/intellicore-cmp-review-j4fbts` (clean, all work committed & pushed)
**Latest commit:** `974bbe7` — docs(gitlab): record the runner constraint that rules out the deploy VM

---

## 1. Where things stand

The **GitLab migration is complete.** Code, `main`, project settings and all six
CI/CD variables are in place at
`gitlab.searce.com/intellicore-cmp/intellicore-cmp`.

Two things are open, and they are independent of each other:

- **CI cannot run:** the project has **no GitLab runner**, so every pipeline
  queues forever. This is an infrastructure ask, not a repo change. See §3.
- **The live site is stale and probably down:** the frontend restyle is
  committed but never deployed, and the VM was last seen with its containers
  torn down. See §4.

| Area | Status |
|---|---|
| GCP project + billing | ✅ Existing project, Searce sandbox billing |
| VM + static IP + firewall | ✅ Done |
| IAP SSH (no open port 22) | ✅ Done |
| Google OAuth client (Workspace SSO) | ✅ Created, credentials in `.env.prod` |
| `.env.prod` on the VM | ✅ Present at repo root on the VM |
| Admin user | ✅ Created via `create_admin.py` |
| GitHub Actions → GitLab CI port | ✅ All 4 workflows in `.gitlab-ci.yml`; `.github/` removed |
| Repo pushed to Searce GitLab | ✅ All 3 branches, SHAs verified both sides |
| `main` on GitLab | ✅ Created (force-pushed over the stub README commit) |
| `main` is the default branch | ✅ Set |
| `main` is protected | ✅ Maintainers may push; force push OFF |
| GitLab Auto DevOps | ✅ Turned off |
| GitLab CI/CD variables (all 6) | ✅ Set, all `protected=true` |
| **GitLab runner** | ❌ **None available — pipelines queue forever. See §3** |
| **Frontend restyle deployed** | ❌ **Committed, never shipped. See §4** |
| **Site serving** | ⚠️ **Last known: down. Unverified. See §4** |
| Cloud provider integration | ❌ Does not exist — all data is mock. See §7 |
| GitHub archived | ➖ Deliberately not — still the source for the manual deploy |

---

## 2. Infrastructure values

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

**GitLab**
```
Project   https://gitlab.searce.com/intellicore-cmp/intellicore-cmp   (private)
Default   main
Reachable ONLY from inside the Searce network perimeter — 403 to the public
          internet, including Cloud Shell and CI sandboxes.
```

**CI/CD service account**
```
intellicore-cicd@atre-practice-solutionplatform.iam.gserviceaccount.com
Roles: roles/iap.tunnelResourceAccessor, roles/compute.viewer, roles/iam.serviceAccountUser
Key: minted into ~/Downloads on the operator laptop and uploaded as GCP_SA_KEY.
     A service account can hold several keys, so minting another is safe.
```

**Google OAuth (Workspace SSO)**
```
Client ID / secret      in .env.prod on the VM as GOOGLE_OAUTH_CLIENT_ID / _SECRET
Allowed domain          searce.com
Authorized JS origin    https://35-200-215-108.sslip.io      (base URL only, no path)
Authorized redirect URI https://35-200-215-108.sslip.io/api/auth/google/callback
```

**App login**
```
Email     nikhil.john@searce.com
Password  <see ADMIN_PASSWORD in .env.prod on the VM>
```
First login prompts for a TOTP QR scan. `create_admin.py` resets the password
and clears TOTP enrolment.

> 🔐 **This repo is public — no secrets in this file.** Live values live in
> `~/intellicore-cmp/.env.prod` on the VM (gitignored). To read them:
> ```bash
> gcloud compute ssh nikhil_john_searce_com@intellicore-cmp-v1 \
>   --zone=asia-south1-a --tunnel-through-iap \
>   --project=atre-practice-solutionplatform \
>   --command='cat ~/intellicore-cmp/.env.prod'
> ```
>
> **Tokens pasted into a chat session are exposed.** Two were, during the
> migration — revoke them at
> `https://gitlab.searce.com/-/user_settings/personal_access_tokens`, and reset
> the feed token on that same page.

---

## 3. Blocker A — no GitLab runner

**Symptom:** pipeline `/-/pipelines/47062` on `main` is `pending` and stays
pending. `configure-gitlab.sh` reports "NO runners available to this project"
on every run.

Nothing in `.gitlab-ci.yml` can fix this and no amount of variable-setting
will either — a runner has to exist.

The pipeline needs a runner that can do three things, and the third constrains
where it may live:

1. run Docker images (`node:20-alpine`, `python:3.11-slim`, `google/cloud-sdk:alpine`);
2. reach `oauth2.googleapis.com` / `compute.googleapis.com`, for the IAP tunnel
   — without it, jobs die at `gcloud auth activate-service-account`;
3. reach `gitlab.searce.com`, to pick up jobs at all.

Requirements 2 and 3 pull in opposite directions here, which rules out the
intuitive answer:

| Runner host | Reaches GitLab | Reaches Google APIs | Verdict |
|---|---|---|---|
| The deploy target VM `intellicore-cmp-v1` | **No** — outside the Searce perimeter | Yes | **Not viable** |
| A Searce-internal host | Yes | Verify, don't assume | Correct answer |
| Operator laptop on VPN | Yes | Yes | Works while awake + connected |

**Routes, in order of preference:**

- **A — ask the `gitlab.searce.com` admins to enable instance/shared runners**
  for the project. Ask about their Google API egress in the same message: a
  shared runner without it fails later at `gcloud auth`, which is a slower way
  to find the same problem. The container registry is disabled on this
  instance, which suggests a locked-down setup — don't assume shared runners
  are one toggle away.
- **B — a project runner on a Searce-internal host.** The durable answer.
  *Settings → CI/CD → Runners → New project runner*, Docker executor.
- **C — a laptop runner.** Enough for a first green pipeline; not a CI system.

Full reasoning in `deploy/gcp/MIGRATE_TO_GITLAB.md` §5.

**Until a runner exists, pipeline deploys are impossible.** The manual path
(§4) is the only working deploy, and it doesn't touch GitLab.

---

## 4. Blocker B — the site is stale, and probably down

Two separate problems that resolve with the same script.

**a. The VM was last seen torn down.** An earlier version of
`cloudshell-deploy.sh` had an unbound-variable bug that aborted *after* the
teardown step, leaving no containers running. The bug is fixed (build now
happens before teardown, plus a restore-on-failure trap), but **nobody
confirmed the site came back**. Verify first:

```bash
gcloud compute ssh nikhil_john_searce_com@intellicore-cmp-v1 \
  --zone=asia-south1-a --tunnel-through-iap \
  --project=atre-practice-solutionplatform \
  --command='cd ~/intellicore-cmp && sudo docker compose --env-file .env.prod \
    -f deploy/gcp/docker-compose.prod.yml ps'
```

Nothing listed → bring it up on the currently-deployed build:

```bash
gcloud compute ssh nikhil_john_searce_com@intellicore-cmp-v1 \
  --zone=asia-south1-a --tunnel-through-iap \
  --project=atre-practice-solutionplatform \
  --command='cd ~/intellicore-cmp && sudo docker compose --env-file .env.prod \
    -f deploy/gcp/docker-compose.prod.yml up -d'
```

**b. The frontend restyle has never shipped.** The app was restyled to match
the marketing site — design tokens, brand mark, favicon, nav, dark mode. All
committed; the live CSS still has the old palette.

> The reference is `marketing/index.html`, which is **not on this branch** —
> it lives on `claude/intellicore-cmp-architecture-16g3vz` (see §5). The
> rendered copy is at
> `storage.googleapis.com/intellicore-cmp-site-77682/index.html`, which is what
> to read when you need a colour or a treatment.

To ship it:

```bash
bash deploy/gcp/cloudshell-deploy.sh
```

Run from **Cloud Shell**. It safeguards `.env.prod`, syncs code, builds images,
tears down, restarts, waits for health, provisions the admin user, verifies.

> ⚠️ That script has the VM `git fetch` from **GitHub**, not GitLab — the VM
> cannot reach the Searce perimeter and neither can Cloud Shell. So **do not
> archive GitHub** until either the pipeline deploys successfully or this script
> is converted to package-and-ship. See `MIGRATE_TO_GITLAB.md` §4.

---

## 5. What the migration taught us (don't rediscover)

**GitLab tokens.** Four separate traps, all of which present as the same
`HTTP Basic: Access denied`:

1. **Token type.** `glft-` is the **feed token** (RSS/calendar) and GitLab
   prints it on the *same settings page* as the access tokens, so it gets
   copied by mistake. It authenticates no git operation. A real PAT starts
   `glpat-`. Length varies by GitLab version — 54 chars on this instance, not
   the 26 older docs cite. The prefix is the signal, not the length.
2. **Scope split.** `write_repository` pushes code and *nothing else*;
   project settings need `api`. Scopes cannot be edited after creation.
3. **Whitespace.** A trailing newline on a pasted token fails identically to a
   wrong token. Both scripts now strip it.
4. **macOS keychain.** With no token supplied, git falls back to
   `osxkeychain`, which silently replays a bad credential saved by an earlier
   attempt — an "Access denied" that fixing the token cannot shift. Both
   scripts now disable the helper for the GitLab host.

**Diagnose auth by probing the endpoint git actually uses**, not the API
(`/api/v4/user` needs `read_api`, so a correctly scoped `write_repository`
token fails it and sends you chasing the wrong problem):

```bash
TOK=glpat-...
for svc in git-upload-pack git-receive-pack; do
  printf '%-18s ' "$svc"
  curl -s -o /dev/null -w '%{http_code}\n' -u "oauth2:$TOK" \
    "https://gitlab.searce.com/intellicore-cmp/intellicore-cmp.git/info/refs?service=$svc"
done
# 200/200 good · 200/403 scope or role · 401/401 token rejected · 000/000 VPN
```

**Protected variables and protected branches are one decision.** A protected
CI variable is invisible to pipelines on an *unprotected* branch. Protected
variables plus an unprotected `main` = `deploy:production` runs with an empty
`GCP_SA_KEY` and dies at `gcloud auth`, looking exactly like a bad service
account. `main` is protected here, so the variables are safe to keep protected.

**`--mirror` was wrong for this target.** The GitLab project was created *with*
a README, so it wasn't empty, and a mirror push deletes remote refs absent
locally. The script pushes named branches instead.

**All three branches carry unique work.** `claude/intellicore-cmp-architecture-16g3vz`
alone holds the entire `marketing/` site, `docs/PRODUCT_BUILD.md`, `BACKLOG.md`
and 2 Postgres migrations — 18 files on no other branch. `review` and
`architecture` have genuinely diverged (both independently built `report.ts`,
`settings.ts`, `01-schema.sql`). **Reconciling them is a separate, unmade
decision.** The migration carried both across untouched.

---

## 6. Older gotchas, still true

1. **`.env.prod` lives at the repo root** on the VM, not `deploy/gcp/`.
   `update.sh` and the CI pipeline both read `./.env.prod`, but
   `setup-searce-gcp.sh` writes it to `deploy/gcp/`. Worth unifying.
2. **Two compose files.** `docker-compose.yml` (root) is **dev, no Caddy**;
   `deploy/gcp/docker-compose.prod.yml` is production. Every VM command must
   pass `-f deploy/gcp/docker-compose.prod.yml`, or nothing binds :443.
3. **Docker permission denied.** The IAP SSH user needs the `docker` group, and
   membership only applies to *new* sessions. All commands here use
   `sudo docker` to sidestep it.
4. **Stale container name conflicts** after a partial `down`:
   ```bash
   sudo docker rm -f intellicore-postgres intellicore-neo4j intellicore-redis \
     intellicore-backend intellicore-frontend intellicore-edge 2>/dev/null || true
   ```
5. **The seed demo user cannot log in.** `postgres/init/01-schema.sql:113`
   inserts `demo@intellicore.searce.com` with a **placeholder** bcrypt hash
   that reads like a working credential but matches no password. Always
   provision via `backend/scripts/create_admin.py`.
6. **Postgres password changes need a volume wipe** — it's baked in at first
   init. `docker volume rm intellicore-cmp_postgres_data`.
7. **Compose project name = directory name**, and it determines volume names.
   Deploying from a *different* directory silently changes them, which presents
   as a wiped database. Any rewrite of the manual deploy must read the existing
   name off a running container's `com.docker.compose.project` label and pin it
   with `-p`.
8. **OAuth console fields.** "Authorized JavaScript origins" takes the base URL
   only; the callback path goes in "Authorized redirect URIs".
9. **Billing.** The user lacks `billing.resourceAssociations.create`, so new GCP
   projects can't be created — hence the pre-existing project.

---

## 7. Known product gap — no cloud integration

Worth stating plainly because the UI hides it: **Intellicore CMP has no cloud
provider integration.** There is no `google-cloud-*`, no `boto3`, no Azure SDK
in the backend. Every number on every screen comes from
`frontend/src/lib/api/mock/*.ts`. It demos convincingly and connects to nothing.

`docs/CLIENT_ONBOARDING.md` documents the onboarding architecture (one VM per
customer per environment, ~$145/mo on-demand, ~$105 committed) and flags this
as the critical gap before any real customer.

---

## 8. Command cheat sheet

```bash
# SSH in interactively (from Cloud Shell)
gcloud compute ssh nikhil_john_searce_com@intellicore-cmp-v1 \
  --zone=asia-south1-a --tunnel-through-iap \
  --project=atre-practice-solutionplatform

# On the VM, define this first — it saves a lot of grief:
cd ~/intellicore-cmp
DC="sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml"

$DC ps                          # container status
$DC logs caddy --tail=50        # TLS / routing
$DC logs backend --tail=50      # API errors
$DC logs frontend --tail=50     # Next.js errors
$DC up -d                       # bring the stack back up
$DC up -d --build               # rebuild + restart
$DC exec backend python -m scripts.create_admin   # reset admin + clear TOTP

# Deploy the current code (from Cloud Shell, sources GitHub)
bash deploy/gcp/cloudshell-deploy.sh

# GitLab: re-run project config any time; it's idempotent
GITLAB_TOKEN=glpat-… bash deploy/gcp/configure-gitlab.sh
DRY_RUN=1 GITLAB_TOKEN=glpat-… bash deploy/gcp/configure-gitlab.sh   # preview

# GitLab: re-push branches (also idempotent)
GITLAB_TOKEN=glpat-… bash deploy/gcp/migrate-to-gitlab.sh
```

---

## 9. Relevant files

| Path | What it does |
|---|---|
| `.gitlab-ci.yml` | **The** pipeline. validate → build → deploy → provision, 6 jobs. Deploys ship a tarball over IAP with health check + auto-rollback. `deploy:production` fires on `main` only. |
| `deploy/gcp/configure-gitlab.sh` | **New.** Does the post-migration GitLab config over the REST API: default branch, Auto DevOps off, branch protection, all 6 variables, plus a read-only runner/pipeline readiness check. Idempotent, `DRY_RUN=1`. Needs an `api`-scope token. |
| `deploy/gcp/migrate-to-gitlab.sh` | GitHub → GitLab push. Probes the git endpoint before cloning so auth failures name their cause. Named branch pushes, `FORCE_MAIN=yes` for `main`. Run from the VPN. |
| `deploy/gcp/MIGRATE_TO_GITLAB.md` | Migration runbook. §3 variables + protected-branch interaction, §4 the two deploy paths, **§5 the runner constraint**. |
| `deploy/gcp/cloudshell-deploy.sh` | Manual deploy from Cloud Shell. Builds before teardown; restore-on-failure trap. Sources **GitHub**. |
| `deploy/gcp/docker-compose.prod.yml` | **The** production stack. Caddy + 5 services. |
| `docker-compose.yml` | Local dev only. No Caddy. Not for the VM. |
| `deploy/gcp/Caddyfile` | TLS + `forward_auth` session gate. `@public` lists pre-login routes — includes `/icon.svg` (without it the favicon 302s to /login). |
| `deploy/gcp/setup-searce-gcp.sh` | One-shot GCP provisioning. Already run. |
| `deploy/gcp/update.sh` | Incremental redeploy, called by CI. Expects `.env.prod` at repo root. |
| `docs/CLIENT_ONBOARDING.md` | New-customer architecture, steps, cost, and the no-integration gap. |
| `frontend/src/app/globals.css` | `--ic-*` design tokens + `@layer components`. `html.dark` promotes ink accents to vivid. |
| `frontend/tailwind.config.ts` | Wires `ic-*` utilities to the CSS variables; `rounded-xl` remapped to 16px. |
| `frontend/src/components/BrandMark.tsx` | Brand glyph + `BrandLockup` with the CMP hover-bloom. |
| `postgres/init/01-schema.sql` | Schema + seed. ⚠️ Seed user's hash is a placeholder. |
| `backend/scripts/create_admin.py` | Provisions/resets the admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. |

---

## 10. How to open the next session

> Read `HANDOFF.md` and `CLAUDE.md` in the repo root. I'm continuing the
> Intellicore CMP work. The GitLab migration is done; §3 and §4 are what's
> open. Start with §4 — get the site back up and ship the restyle.

Have Cloud Shell open at `~/intellicore-cmp` in the
`atre-practice-solutionplatform` project. Claude has no direct access to the VM
or to `gitlab.searce.com` — it will hand you commands to paste. Anything
touching GitLab must run from a machine on the Searce VPN.

**Suggested order:**

1. **§4** — verify/restore the site, then ship the restyle. Doesn't need GitLab
   or a runner. This is the visible win.
2. **§3** — chase a runner. It's an ask to Searce IT/GitLab admins, so start it
   early and let it run in parallel.
3. Revoke the two exposed tokens (§2).
4. Then, in no particular order: reconcile the `review` / `architecture` branch
   divergence (§5), the repo fixes in §6, and the cloud integration gap (§7).
