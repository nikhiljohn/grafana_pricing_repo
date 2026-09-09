# Migrating Intellicore CMP to Searce GitLab

Moving the repo from `github.com/nikhiljohn/grafana_pricing_repo` to
Searce's self-hosted GitLab, and cutting CI/CD over with it.

The repo side of the work is **already done and committed** — GitHub Actions
have been removed and all four workflows ported into `.gitlab-ci.yml`. What
remains is the push itself and the GitLab-side configuration, both of which
need network access to `gitlab.searce.com`.

---

## 0. Before you start — the network constraint

`gitlab.searce.com` resolves to `34.120.28.229` (a Google load balancer) and
returns **HTTP 403 to every path** from the public internet, including
`/users/sign_in`. It is reachable only from inside Searce's network perimeter.

**Run the migration from your laptop on the Searce VPN/corporate network.**
Cloud Shell and CI sandboxes sit outside the perimeter and will fail with 403.

Verify before anything else:

```bash
curl -o /dev/null -w '%{http_code}\n' https://gitlab.searce.com/users/sign_in
# 200 or 302 → good.  403 → you're outside the perimeter.
```

---

## 1. What is actually being moved

Three branches. **All three carry unique work** — this is not a
one-branch repo, and a naive `git push` of the current checkout would lose
most of it.

| Branch | Commits | Status |
|---|---|---|
| `claude/intellicore-cmp-review-j4fbts` | 25 | Deployment work, GCP/IAP, SSO, and the new `.gitlab-ci.yml`. **Most current.** |
| `claude/intellicore-cmp-architecture-16g3vz` | 13 | **12 commits found nowhere else.** Holds the entire `marketing/` site (`index.html`, `features.html`, `team.html`, team photos), `docs/PRODUCT_BUILD.md`, `BACKLOG.md`, and 2 Postgres migrations — 18 files that exist on no other branch. |
| `claude/grafana-pricing-page-yTE5w` | 1 | The original pricing calculator. Fully contained in the review branch; currently the GitHub **default** branch. |

No tags exist. Total history is 25 commits, `.git` is ~55 MB.

> **The two main branches have genuinely diverged.** `review` and `architecture`
> independently built overlapping files (`report.ts`, `settings.ts`,
> `01-schema.sql`). Reconciling them is a **separate decision** — the migration
> deliberately carries both across untouched rather than merging them. Decide
> what to do with `marketing/` after the move, not during it.

### There is no `main` branch

GitHub's default branch is `claude/grafana-pricing-page-yTE5w`. Nothing is
called `main`. This matters: **`deploy:production` only fires on `main`**, so
until `main` exists and is the default, no pipeline will ever deploy.

The migration script creates `main` from the review branch. Override with
`MAIN_FROM=<branch>` if you'd rather seed it from somewhere else.

---

## 2. Run the migration

```bash
# On the Searce VPN, from a clone of this repo:
export GITLAB_URL="https://gitlab.searce.com/<group>/intellicore-cmp.git"
bash deploy/gcp/migrate-to-gitlab.sh
```

First create the target project in GitLab — **New project → Create blank
project**, and **uncheck "Initialize repository with a README"**. `git push
--mirror` requires an empty target.

When prompted for credentials, use a **Personal Access Token** (Preferences →
Access Tokens, scope `write_repository`) as the password, not your login
password.

The script mirror-clones from GitHub, pushes every ref with `git push
--mirror`, creates `main`, then verifies each branch SHA matches on both sides
and fails loudly if any don't.

Afterwards, set the default branch: **Settings → Repository → Branch defaults
→ `main`**.

---

## 3. GitLab CI/CD variables

**Settings → CI/CD → Variables.** All six are required for `deploy:production`.

| Variable | Type | Value |
|---|---|---|
| `GCP_SA_KEY` | **File** | Full JSON from `intellicore-cicd-sa-key.json`. Protect: yes. **Mask: no** — JSON can't be masked. |
| `GCP_PROJECT_ID` | Variable | `atre-practice-solutionplatform` |
| `VM_NAME` | Variable | `intellicore-cmp-v1` |
| `VM_ZONE` | Variable | `asia-south1-a` |
| `VM_USER` | Variable | `nikhil_john_searce_com` |
| `DOMAIN` | Variable | `35-200-215-108.sslip.io` |

Staging only, if a staging VM exists: `STAGING_VM_NAME`, `STAGING_VM_ZONE`,
`STAGING_DOMAIN`.

The service account already exists with the right roles
(`iap.tunnelResourceAccessor`, `compute.viewer`, `iam.serviceAccountUser`) —
`deploy/gcp/setup-searce-gcp.sh` created it.

---

## 4. The VM needs no changes

Earlier plans called for repointing the VM's git remote at GitLab and issuing a
deploy token. **That is no longer necessary.**

The ported pipeline packages the code as a tarball and copies it to the VM over
the IAP tunnel, the same way the old GitHub Actions did. The VM never pulls
from GitLab, so:

- no deploy token to create or rotate,
- no VM → `gitlab.searce.com` network path required — which matters, because
  the VM lives in `atre-practice-solutionplatform` and there is no evidence it
  can reach the Searce perimeter,
- the VM's existing git remote is irrelevant; leave it.

The old `git fetch origin main && git reset --hard` deploy step has been
replaced accordingly.

---

## 5. GitLab Runner requirements

The pipeline needs a runner that can:

- run Docker images (`node:20-alpine`, `python:3.11-slim`,
  `google/cloud-sdk:alpine`), and
- reach `oauth2.googleapis.com` / `compute.googleapis.com` to open the IAP
  tunnel.

If Searce's shared runners are network-restricted, register a project runner
somewhere with egress to Google APIs. A runner that cannot reach Google APIs
will fail at `gcloud auth activate-service-account`.

---

## 6. First pipeline

Push any commit to `main`. Expected sequence:

```
validate → frontend:lint, backend:check
build    → frontend:build
deploy   → deploy:production
```

`provision:customer` is manual and only appears on pipelines started from the
UI (**CI/CD → Pipelines → Run pipeline**), where the `CUSTOMER_*` fields show
up as a form.

If `deploy:production` fails at the IAP step, confirm the runner has Google API
egress and that `GCP_SA_KEY` is **File** type, not Variable.

---

## 7. What happens to GitHub

Nothing, for now. It stays intact as a fallback until GitLab is confirmed
working end-to-end. Once the first GitLab deploy succeeds, archive it:

**GitHub → Settings → General → Danger Zone → Archive this repository.**

Archiving is reversible and preserves history; deleting is not. Archive rather
than delete unless you're certain.
