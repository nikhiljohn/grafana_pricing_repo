# Intellicore CMP — Product Build Summary

Snapshot of what's actually built in the application (backend + frontend),
as of the "demo-ready" pass. For the full architecture and setup, see the
root `README.md`, `docs/SETUP_GUIDE.md`, and `docs/GCP_ARCHITECTURE.md`.
For what's intentionally *not* built yet, see `BACKLOG.md`.

## Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind — 10 pages
- **Backend**: FastAPI (Python 3.11), async, per-tenant isolation
- **Databases**: PostgreSQL (tenants/users/accounts/audit), Neo4j (the
  Memory graph), Redis (session cache, event queue)
- **Auth**: email + TOTP, JWT sessions, plus Google OAuth (Sign in with
  Google) — CSRF state via Redis, httpx token exchange, Postgres user
  upsert (`backend/app/api/auth.py`)
- **AI**: Bring-Your-Own-Key — Anthropic Claude, OpenAI, or Gemini, added
  per-tenant in Settings → AI Keys, encrypted at rest (pgcrypto). Nothing
  is billed to Searce.

## Core feature: Intellicore Memory

Every event a customer's cloud emits (deployment, incident, security
finding, cost anomaly, architecture change) becomes a node in a per-tenant
Neo4j graph, with causal edges (`CAUSED`, `PRECEDED`, `RESOLVED_BY`,
`TRIGGERED`). Three backend endpoints expose it:

- `GET /memory/timeline` — the customer's cloud story, event by event
- `GET /memory/patterns` — recurring behavioral patterns, with confidence
- `POST /memory/chat` — natural-language questions over the graph
  (question → Cypher via Claude tool use → grounded, cited answer)

## What's wired end-to-end (demo-ready pass)

- **Memory Chat is live**: the AIOps "Query Infrastructure" tab is a real
  conversation — it calls the backend when configured
  (`NEXT_PUBLIC_DATA_SOURCE=api`) and falls back to per-tenant canned
  answers otherwise, so it's interactive in every environment. Responses
  carry a confidence score and, where applicable, an Apply Fix action.
- **One real action per pillar**: a shared `ApplyFixModal` component
  (Memory evidence → confirm → applied) backs Command Center's Resolve,
  FinOps's Apply Fix, Cloud Security's Auto-Fix/Generate Role, DevOps's
  Approve, and the AIOps chat's Apply fix. Alerts' Acknowledge/Resolve are
  wired the same way. Every other still-unwired action button is
  explicitly labeled "Coming in V2" (disabled, with a tooltip) rather than
  silently doing nothing.
- **The org switcher actually changes everything**: every page reads
  tenant + environment-scoped data via `useApiData()` → `apiFetch()`, keyed
  `[tenantId][environmentId][endpoint]` (`frontend/src/lib/api/`). Setting
  `NEXT_PUBLIC_API_URL` switches every page to the real backend with zero
  page changes.
- **Pillar naming is consistent**: the "Cloud Security" pillar label is
  normalized everywhere data flows (it was inconsistently tagged
  `"SecOps"` in some mock modules, which broke a filter/badge lookup for
  tenants already using `"Cloud Security"`).
- **Health scores have a published methodology**: `frontend/src/lib/scoring.ts`
  defines the formula (penalize open critical/warning items, active
  anomalies, and unresolved recurring patterns; credit back for a
  validated high-confidence fix on file), surfaced via an info affordance
  on Command Center. The demo book's scores are still hand-authored to
  match each tenant's narrative, but the formula is the intended
  production algorithm — no more "it's hardcoded."

## The managed customer book (demo tenants)

Five tenants, each with a distinct Memory graph, cost profile, and
narrative — switching the org switcher changes the whole product, not
just a label:

| Tenant | Cloud | Spend | Story |
|---|---|---|---|
| **Netcore Cloud** | GCP | ~$1.1M/mo | Martech SaaS — FinOps hero: BigQuery ETL cost spike |
| **Aarti Industries** | AWS | ~$22K/mo | Chemicals/Pharma — Cloud Security hero: SSH open to internet, mid-audit |
| **ShoppersStop** | GCP + AWS | ~$220K/mo | Retail/E-commerce (incl. SAP HANA/ECC workloads) — CloudOps hero: pre-sale egress anomaly |
| **DesignX** | GCP | ~$10K/mo | Design SaaS — DevOps hero: CI bot IAM guardrail |
| **Dmart** | GCP | ~$70K/mo | Retail (HCL Commerce on GKE) — CloudOps/Kubernetes hero: checkout pods OOMKilled under flash-sale load |

Seed data is authored in three places that stay in sync: the frontend mock
modules (`frontend/src/lib/api/mock/*.ts`), the backend event generator
(`backend/app/adapters/mock.py`, consumed by `backend/scripts/seed_demo.py`
to populate Neo4j), and the Postgres tenant/account rows
(`postgres/init/01-schema.sql`, `postgres/init/03-customer-book-migration.sql`).

## Product surface (10 pages)

Command Center, CloudOps, FinOps, Cloud Security, DevOps, AIOps, Memory,
Assets/CMDB, Alerts, Settings — see the root `README.md` for the full
route table and what each page does.

## Not built yet

See `BACKLOG.md` for the larger items intentionally out of scope so far:
a real Discover/CMDB backend, a Value Realized (ROI) dashboard, a decision
on an Agent MVP vs. "Layer 2 only" positioning, a Freshservice ingestion
adapter, and real remediation execution behind `ApplyFixModal` (today it
simulates the apply step and updates the page's own state).
