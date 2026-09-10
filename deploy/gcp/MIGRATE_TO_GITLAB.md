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

The project already exists: **`gitlab.searce.com/intellicore-cmp/intellicore-cmp`**
(private). It was created **with** a README, so it is *not* empty — it has a
stub `Initial commit` on `main`. Two consequences shape the migration:

- `git push --mirror` is **not** used. Mirror pushes delete remote refs that
  are absent locally, which is destructive against a non-empty target. The
  script pushes named branches instead.
- Our history is **unrelated** to that stub commit, so putting our tree on
  `main` is a non-fast-forward. That needs an explicit opt-in.

```bash
# On the Searce VPN, from a clone of this repo:
bash deploy/gcp/migrate-to-gitlab.sh
```

The default target is already the right project, so no `GITLAB_URL` export is
needed. The script mirror-clones from GitHub, pushes all three branches by
name, then attempts `main` and verifies every branch SHA on both sides.

**Credentials.** There is no SSH key on the GitLab profile yet, so this runs
over HTTPS. When prompted for a password, paste a **Personal Access Token** —
*Edit profile → Access tokens*, scope `write_repository`. To use SSH instead,
add a key first (*Edit profile → SSH Keys*) and pass
`GITLAB_URL=git@gitlab.searce.com:intellicore-cmp/intellicore-cmp.git`.

### Establishing `main`

The first run pushes the branches and then **stops short of `main`**, because
overwriting the stub commit discards it. Re-run with the opt-in:

```bash
FORCE_MAIN=yes bash deploy/gcp/migrate-to-gitlab.sh
```

If that is rejected, it is GitLab's default branch protection. Either:

- **A — allow it once:** *Settings → Repository → Protected branches → `main`
  → "Allowed to force push" = ON*. Re-run, then switch it back off.
- **B — start clean:** delete the project, create a new blank one and
  **uncheck "Initialize repository with a README"**, then re-run. Nothing is
  lost; the stub commit is only a placeholder README.

Afterwards set the default branch: **Settings → Repository → Branch defaults
→ `main`**.

### Turn Auto DevOps off

The project has **Auto DevOps enabled**, and GitLab warns that the **container
registry is not enabled on this instance** — so Auto DevOps cannot work here
regardless. Our `.gitlab-ci.yml` takes precedence the moment it is pushed
("will be used if no alternative CI configuration file is found"), so this is
not a blocker, but leave it on and every pipeline listing is confusing.

**Settings → CI/CD → Auto DevOps → off.**

The missing container registry is worth noting for later: our pipeline builds
images *on the VM* via `docker compose build`, so it needs no registry. Any
future move to registry-based deploys would need an administrator to enable
it.

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

### One inconsistency, stated plainly

That is true of the **CI pipeline**. It is *not* true of the manual script
`deploy/gcp/cloudshell-deploy.sh`, which has the VM `git fetch` from **GitHub**.
So there are currently two deploy paths with different source assumptions:

| Path | Source of code | Works if GitHub is archived? |
|---|---|---|
| `.gitlab-ci.yml` → `deploy:production` | tarball pushed from the runner | **Yes** |
| `deploy/gcp/cloudshell-deploy.sh` | VM pulls from GitHub | **No** |

The manual script cannot simply be repointed at GitLab: the VM sits in
`atre-practice-solutionplatform` and there is no evidence it can reach the
Searce perimeter — `gitlab.searce.com` 403s from everywhere outside. Cloud
Shell is outside the perimeter too, so it cannot clone from GitLab either.

The resolution is to convert the manual script to package-and-ship, like the
CI job: build the tarball wherever the operator has the repo (a laptop on the
VPN) and copy it over IAP. **Do not do this casually** — Docker Compose derives
its project name from the working directory, and deploying from a *different*
directory would change the project name and therefore the volume names, which
presents as a wiped database. Any rewrite must read the existing project name
off a running container's `com.docker.compose.project` label and pin it with
`-p`, rather than assuming.

Until that is done: **keep GitHub as-is** and use the manual script only as
the fallback it currently is. Do not archive GitHub before either the CI
pipeline is deploying successfully or the manual script is converted.

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
