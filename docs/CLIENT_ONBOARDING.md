# Onboarding a New Client — Architecture, Steps, Requirements

What actually happens when Intellicore CMP is stood up for a new customer,
what you need before you start, and what is genuinely production-ready today
versus what is still a demo.

Everything below is derived from the repo as it stands:
`deploy/gcp/provision-customer.sh`, `deploy/gcp/docker-compose.prod.yml`,
`deploy/gcp/Caddyfile`, `postgres/init/01-schema.sql`, `backend/pyproject.toml`.

---

## 1. The isolation model

**One VM per customer, per environment.** Not a shared multi-tenant cluster.

```
intellicore-acme-staging      ← e2-standard-2, its own IP, its own database
intellicore-acme-production   ← e2-standard-4, its own IP, its own database
```

The Postgres schema is tenant-aware (`tenants`, and every table carries
`tenant_id` with `ON DELETE CASCADE`), and `TENANT_MODE` supports `multi`.
But provisioning always writes `TENANT_MODE=single`, so in practice each
customer gets a dedicated VM holding exactly one tenant.

**Why it's built this way:** hard data isolation with no query-scoping bugs
possible, per-customer billing that is trivially attributable, and a blast
radius of exactly one customer. **The cost:** infrastructure spend scales
linearly — there is no pooling.

---

## 2. Architecture — what runs on a customer VM

```
                    Internet
                       │
                       │  :80 / :443
              ┌────────▼─────────┐
              │  Caddy  (edge)   │   intellicore-edge
              │  auto-TLS via    │   Let's Encrypt, HTTP-01 on :80
              │  <ip>.sslip.io   │
              └────────┬─────────┘
                       │
        ┌──────────────┴───────────────┐
        │   forward_auth gate          │   every route except @public
        │   → backend /auth/session/   │   401 ⇒ 302 to /login
        │     check                    │
        └──────────────┬───────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
   /api/* (prefix stripped)          /*
         │                            │
   ┌─────▼──────┐              ┌──────▼──────┐
   │  backend   │              │  frontend   │
   │  FastAPI   │              │  Next.js 14 │
   │  :8000     │              │  :3000      │
   └─────┬──────┘              └─────────────┘
         │
    ┌────┼─────────────┬──────────────┐
    │    │             │              │
┌───▼──┐ │      ┌──────▼─────┐  ┌─────▼────┐
│Postgres     │ │   Neo4j    │  │  Redis   │
│ :5432│ │      │  :7687     │  │  :6379   │
│tenants,      │ │ memory     │  │ cache,   │
│users,│ │      │ graph      │  │ sessions │
│audit │ │      └────────────┘  └──────────┘
└──────┘ │
         │  BYOK egress (customer's own key)
         └──────────────► Anthropic / OpenAI / Gemini
```

**Only Caddy binds host ports.** Postgres, Neo4j and Redis are reachable only
on the compose network — `curl http://localhost:3000` from the VM returns
nothing, which is expected and not a fault.

**SSH is IAP-only.** Port 22 is not open to the internet; access is via
`gcloud compute ssh --tunnel-through-iap`.

---

## 3. What you need before you start

| Requirement | Detail | Blocker if missing? |
|---|---|---|
| **GCP project** | Customer's own, or a shared Searce one. Billing enabled. | **Yes** |
| **Billing permission** | `billing.resourceAssociations.create` to link a *new* project. | Only for new projects — see §7 |
| **`gcloud` authenticated** | Cloud Shell is simplest; already authed. | **Yes** |
| **Compute API enabled** | Script runs `gcloud services enable compute.googleapis.com`. | Handled |
| **Customer admin email** | Becomes the first login and the Let's Encrypt contact. | **Yes** |
| **Region decision** | Default `asia-south1`. Drives data residency. | **Yes** — hard to change later |
| **Customer's LLM API key** | BYOK. Anthropic / OpenAI / Gemini. | Not for provisioning; **yes** for any AI feature |
| **Custom domain** | Optional. Defaults to `<ip-with-dashes>.sslip.io`, needs no DNS. | No |
| **Repo access on the provisioning machine** | Script ships `HEAD` as a tarball. | **Yes** |

No DNS work is required to go live. `sslip.io` resolves `35-200-215-108.sslip.io`
to `35.200.215.108` automatically, and Caddy gets a real Let's Encrypt
certificate for it.

---

## 4. The steps

### 4.1 Provision staging

From the repo root, in Cloud Shell:

```bash
CUSTOMER=acme \
PROJECT=acme-cloud-prod \
ADMIN_EMAIL=admin@acme.com \
ENVIRONMENT=staging \
REGION=asia-south1 \
./deploy/gcp/provision-customer.sh
```

The script is idempotent on the GCP resources (`|| true` on create, "VM
exists, reusing") and does, in order:

1. Reserve a **static IP**, derive `DOMAIN=<ip-with-dashes>.sslip.io`
2. Open **firewall** :80 and :443 to `0.0.0.0/0` (LE needs :80 for HTTP-01)
3. Create the **VM** — Ubuntu 22.04, 50 GB pd-balanced, Docker via startup script
4. **Wait for Docker** to be ready (30 × 10 s)
5. **Package** the repo at HEAD and `scp` it to the VM
6. **Generate secrets** locally — Postgres, Neo4j, JWT, credentials, admin
   password — so the admin password can be printed once
7. Write `.env.prod` (chmod 600), `docker compose up -d --build`
8. Bootstrap the **first admin** via `scripts.create_admin`
9. Health-check frontend and backend

It prints the URL, admin email and **generated admin password**. That password
is shown once and stored nowhere else — capture it immediately.

### 4.2 Verify staging

1. Open `https://<ip>.sslip.io` — allow ~30 s for TLS on the first hit
2. Log in with the admin email + generated password
3. Complete **TOTP enrolment** (Google Authenticator / Authy) — mandatory
4. Confirm the sidebar shows Command Center + five pillars, Alerts, Memory, Settings
5. **Settings → AI Keys** — customer pastes their own key. *Nothing AI works
   until this is done.*
6. **Download report** on any pillar — a branded PDF should download

### 4.3 Provision production

Same command, `ENVIRONMENT=production` — a **separate VM, IP and database**.
Defaults to `e2-standard-4`.

### 4.4 Hand over

- Admin password, over a secure channel
- The customer sets up their own users
- Confirm data region matches their contractual requirement

---

## 5. Time and cost

**Wall-clock: 15–25 minutes per environment**, dominated by the Docker build.

Per customer, per environment (from `docs/GCP_ARCHITECTURE.md`):

| | On-demand | 1-yr committed use |
|---|---|---|
| Production (`e2-standard-4`) | ~$145/mo | ~$105/mo |
| Staging (`e2-standard-2`) | ~$85–95/mo | ~$60/mo |
| LLM inference | **$0 to platform** — BYOK | $0 |

A customer on staging + production is roughly **$230/mo on-demand**, or
**~$165/mo** on committed-use. Scaling is linear: 10 customers on production
only is ~$1,450/mo.

---

## 6. What is production-ready, and what is not

This is the part worth being precise about.

### Ready

- Isolated infrastructure per customer, provisioned in one command
- TLS, session auth, TOTP 2FA, IAP-only SSH
- BYOK key storage encrypted at rest with pgcrypto (`pgp_sym_encrypt`);
  only the last 4 characters are ever returned to the UI
- Tenant-scoped schema with cascade deletes
- Audit log table

### Not ready — the material gap

**The platform does not connect to the customer's cloud.**

`backend/pyproject.toml` has no `google-cloud-*`, no `boto3`, no Azure SDK.
`backend/app/services/` contains Memory, LLM, chat and pattern-detection
services — nothing that reads a billing export, an asset inventory, or a
security finding. The `cloud_accounts` table exists in the schema but nothing
outside the seed ever writes to it.

Every number on every pillar screen — the cost anomalies, the security
findings, the CPU predictions — is served from
`frontend/src/lib/api/mock/*.ts`. `NEXT_PUBLIC_DATA_SOURCE` is not set in the
Docker build, so the deployed app runs on mock data by design.

**What this means in practice:**

- Onboarding a client today gives them a **fully working, isolated, branded
  demo or pilot environment**. That is genuinely useful for sales, for POCs,
  and for validating the UX with a real customer.
- It does **not** give them a system observing their actual cloud. A client
  told "this is monitoring your estate" would be misled.

**What closing the gap requires** (not currently scoped anywhere in the repo):

1. A read-only service account or IAM role in the **customer's** cloud
2. Ingestion for billing export (BigQuery), asset inventory, and security
   findings (SCC / Security Hub)
3. A scheduled sync writing into `cloud_accounts` and the pillar tables
4. Backend endpoints serving that data, and flipping
   `NEXT_PUBLIC_DATA_SOURCE=api` in the frontend build
5. Per-tenant credential storage for those cloud roles — the `pgcrypto`
   pattern from `tenant_ai_credentials` is the obvious model to reuse

Until that exists, treat onboarding as **pilot provisioning**, and say so to
the client.

---

## 7. Known operational constraints

1. **New GCP projects may be blocked.** The current operator lacks
   `billing.resourceAssociations.create`, which is why existing work runs in
   `atre-practice-solutionplatform`. Either use the customer's own project or
   get that permission first.
2. **The seed demo user cannot log in.** `postgres/init/01-schema.sql` inserts
   `demo@intellicore.searce.com` with a placeholder bcrypt hash that is not a
   valid hash. Always provision via `scripts.create_admin`. The placeholder
   reads like a working credential and should be removed.
3. **Postgres passwords are baked in at first init.** Regenerating `.env.prod`
   after the volume exists breaks the backend's connection. Fixing it means
   dropping `<project>_postgres_data` — destructive.
4. **Region is effectively permanent.** Moving a customer's data region means
   re-provisioning and migrating volumes. Confirm residency requirements
   before the first run.
5. **Backups are not automated by the script.** The cost model assumes daily
   disk snapshots (~$6/mo); a snapshot schedule still has to be attached to
   each VM.
6. **Two provisioning paths exist** — `provision-customer.sh` and the
   `provision:customer` CI job in `.gitlab-ci.yml`. They do the same thing.
   The script is the one that has actually been run; the CI job is untested.

---

## 8. Scaling past Topology A

`docs/GCP_ARCHITECTURE.md` documents **Topology B** — Cloud Run or GKE
Autopilot, Cloud SQL with regional HA, Memorystore, Neo4j Aura, HTTPS LB — at
**~$505–850/mo per customer**. It buys real HA and managed backups.

The trigger to move a customer is an availability commitment the single-VM
shape cannot meet: one VM means a reboot is downtime, and there is no
failover. If an SLA above roughly 99.5% is signed, Topology A will not hold.
