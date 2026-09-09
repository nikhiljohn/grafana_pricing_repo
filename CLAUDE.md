# Intellicore CMP — Project Context for Claude

## What this is

**Intellicore Cloud Management Platform (Intellicore CMP)** is a B2B SaaS product
built by Searce for its CSRE (Cloud Solutions & Reliability Engineering) managed
services practice. It is an AI-native cloud management platform that fuses
**Operational Memory** (incident history, pattern recognition, resolution learnings)
with five ops pillars: CloudOps, FinOps, Cloud Security, DevOps, AIOps.

The product differentiator: every screen shows *intelligence*, not just data.
Every alert, cost anomaly, or security finding is contextualised by what happened
before and how it was resolved. It is meant to feel like working with Searce's
CSRE team, not browsing a dashboard.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python), PostgreSQL, Neo4j, Redis |
| Proxy / TLS | Caddy (auto-TLS via sslip.io) |
| Container | Docker Compose |
| Hosting | GCP VM (`intellicore-cmp-prod`, `asia-south1-a`, project `intellicore-cmp-504017`) |
| Auth | JWT via FastAPI + bcrypt passwords, TOTP 2FA |
| AI (BYOK) | Anthropic / OpenAI / Gemini — tenant supplies their own API key |

---

## Repository layout

```
grafana_pricing_repo/
├── frontend/                  # Next.js app
│   └── src/
│       ├── app/
│       │   ├── (app)/         # Main app shell (sidebar + topbar layout)
│       │   │   ├── page.tsx   # Command Center (org switcher + per-customer data)
│       │   │   ├── cloudops/
│       │   │   ├── finops/
│       │   │   ├── secops/    # UI says "Cloud Security"
│       │   │   ├── devops/
│       │   │   ├── aiops/
│       │   │   ├── memory/
│       │   │   ├── assets/
│       │   │   ├── alerts/
│       │   │   └── settings/  # AI Keys (BYOK), User Guide, Account
│       │   ├── (auth)/        # Login page
│       │   └── layout.tsx     # Root layout, no-flash dark mode script, Inter font
│       ├── components/
│       │   ├── Sidebar.tsx    # Clickable logo, nav links, ThemeToggle
│       │   ├── Topbar.tsx     # Memory search, notifications, account menu
│       │   ├── ThemeToggle.tsx
│       │   └── charts/        # Card, BarChart, LineChart, etc.
│       └── lib/
│           ├── api/
│           │   ├── index.ts   # useApiData hook, apiFetch, OpsScore, ChangeItem types
│           │   ├── client.ts  # DOMAIN_LOADERS — mock vs real API switch
│           │   ├── legacy.ts  # fetchMe, fetchTimeline, askMemory (backend-connected)
│           │   └── mock/      # Per-domain seed data
│           │       ├── command-center.ts  # Per-customer data keyed by org name
│           │       ├── cloudops.ts
│           │       ├── finops.ts
│           │       ├── secops.ts          # Cloud Security data
│           │       ├── devops.ts
│           │       ├── aiops.ts
│           │       ├── memory.ts
│           │       ├── assets.ts
│           │       └── alerts.ts
│           ├── settings.ts    # BYOK AI key management (backend + localStorage fallback)
│           ├── report.ts      # jsPDF executive PDF reports per pillar
│           └── guide.ts       # In-product user guide content
├── backend/                   # FastAPI app
│   └── app/
│       ├── api/               # Routes: auth, settings, command-center, cloudops, etc.
│       ├── services/
│       │   ├── llm_client.py  # Multi-provider LLM (Anthropic/OpenAI/Gemini) via httpx
│       │   └── settings_service.py  # pgcrypto key encryption per tenant
│       └── main.py
├── postgres/
│   └── init/01-schema.sql     # Schema: tenants, users, cloud_accounts, audit_log,
│                              #         guardrails, tenant_ai_credentials
├── deploy/
│   ├── gcp/
│   │   ├── provision-customer.sh  # One-shot new customer provisioning
│   │   ├── .env.prod.example
│   │   └── NEW_CUSTOMER.md        # Runbook for onboarding new accounts
│   └── docker-compose.yml
└── CLAUDE.md                  # ← this file
```

---

## Key architectural decisions

### Data layer — mock vs real API

```typescript
// frontend/src/lib/api/client.ts
const USE_REAL_API = process.env.NEXT_PUBLIC_DATA_SOURCE === "api";
```

- **Default (no env var)**: all data comes from `src/lib/api/mock/*.ts` — no backend required.
- **With `NEXT_PUBLIC_DATA_SOURCE=api`**: `apiFetch` calls the real FastAPI backend.
- `NEXT_PUBLIC_API_URL=/api` is baked into the Docker build for auth proxy routing.
  It has **no effect** on whether mock or real data is used — that's controlled separately.

### Command Center org switcher

`page.tsx` imports `CUSTOMER_DATA` from the mock file directly — no `useApiData` hook.
When the org dropdown changes, `useMemo` instantly returns the new customer's snapshot.
Data is fully isolated per customer: scores, attention items, patterns, timeline,
working-well wins, and CSRE activity are all customer-specific.

Customers: All Organizations, Netcore, Aarti Industries, ShoppersStop, DesignX,
PayNimbus, Kiranakart, MediSetu, ShipEasy.

### Dark mode

Class-based (`html.dark`). Persisted to `localStorage`. No-flash inline script in
`layout.tsx` applies the class before React hydrates. `ThemeToggle` component
in sidebar. 115+ CSS overrides in `globals.css` under `html.dark`.

### BYOK AI keys

Tenants supply their own Anthropic / OpenAI / Gemini API key.
Keys are encrypted at rest in Postgres with `pgp_sym_encrypt` (pgcrypto).
Only the last 4 characters are ever returned to the UI.
`frontend/src/lib/settings.ts` falls back to localStorage if backend is unavailable
(useful in demo mode).

### PDF reports

`frontend/src/lib/report.ts` — jsPDF + jspdf-autotable. Each pillar has a
`REPORT_CONFIG` entry with sections and their API endpoints. Downloaded client-side.

---

## Critical naming rules

- The product is **Intellicore CMP** or **Intellicore Cloud Management Platform**. Never "CloudLens".
- The security pillar is **Cloud Security** everywhere in the UI. The route is `/secops`
  and internal code files use `secops` — but all user-facing strings say "Cloud Security".
- The delivery practice is **CSRE** (Cloud Solutions & Reliability Engineering).
- Tier model: **Foundation → Advanced → Elite**.

---

## Environment variables

| Variable | Where set | Effect |
|---|---|---|
| `NEXT_PUBLIC_DATA_SOURCE` | `.env.local` or Docker build arg | `api` → real backend; anything else → mock data |
| `NEXT_PUBLIC_API_URL` | Docker build, baked as `/api` | Auth proxy prefix; no effect on data source |
| `DATABASE_URL` | `.env.prod` | Postgres connection string |
| `NEO4J_URI` / `NEO4J_PASSWORD` | `.env.prod` | Neo4j connection |
| `REDIS_URL` | `.env.prod` | Redis connection |
| `CREDENTIALS_SECRET` | `.env.prod` | pgcrypto passphrase for AI key encryption |
| `JWT_SECRET` | `.env.prod` | JWT signing key |

---

## Docker Compose topology

```
Caddy (:80/:443) → /api/* → backend:8000
                 → /* → frontend:3000
PostgreSQL:5432   (internal only)
Neo4j:7687        (internal only)
Redis:6379        (internal only)
```

Only Caddy exposes host ports. `curl http://localhost:3000` from the VM returns nothing —
check health via `https://intellicore-demo.<ip>.sslip.io/`.

---

## Deploy pattern (GCP VM)

```bash
# Disconnect-safe deploy (SSH can drop mid-run):
setsid bash ~/deploy2.sh </dev/null >~/deploy.log 2>&1 & disown

# All docker compose commands need the env file:
docker compose --env-file .env.prod ps
docker compose --env-file .env.prod logs frontend --tail=50

# If neo4j/seed has root-owned files (common after failed first boot):
sudo rm -rf neo4j/seed
```

---

## Demo seed data — customer stories

Each org has a distinct narrative to support sales demos:

| Customer | Vertical | Key story |
|---|---|---|
| **Netcore** | SaaS | BigQuery ETL cost spike — Memory knew the fix in 12 min |
| **Aarti Industries** | Manufacturing/Pharma | SSH groups open to internet — auto-remediation before pharma audit |
| **ShoppersStop** | Retail | Pre-sale egress anomaly caught 18h before peak — prevented checkout outage |
| **DesignX** | Agency | Deploy-bot over-privileged — IAM guardrail fired before it shipped |
| **PayNimbus** | Fintech | Stale access key + open port — PCI-DSS gap caught 7 days before assessor |
| **Kiranakart** | E-commerce | Dinner-peak CPU breach predicted + auto-scaled 6 min early — zero downtime |
| **MediSetu** | Healthcare | GKE right-sized + HIPAA 97% — 18% cost savings, compliance retained |
| **ShipEasy** | Logistics | Redis pool exhaustion root-caused in 4 min via Memory pattern match |

---

## Known issues / gotchas

1. **`useApiData` hook** resolves from `src/lib/api/index.ts` (the barrel). The old
   `src/lib/api.ts` was renamed to `src/lib/api/legacy.ts` to fix a module shadow bug.
2. **Command Center page bypasses `useApiData`** — it imports `CUSTOMER_DATA` directly
   from the mock file. Other pages still use the hook.
3. **Backend unreachable on cold start**: `fetchMe()` in `legacy.ts` returns `null`
   on error — it does not crash the app shell.
4. **Dark mode on first deploy**: requires a hard refresh or logout/login cycle if
   the no-flash script wasn't in the previous build.

---

## Git branch

Active development branch: `claude/intellicore-cmp-review-j4fbts`

## Source control & CI/CD

The canonical remote is **Searce GitLab** (`gitlab.searce.com`), not GitHub.
GitHub Actions were removed in the migration; `.gitlab-ci.yml` is the single
source of CI/CD truth — validate → build → deploy → provision.

Deploys **push** a tarball to the GCP VM over an IAP tunnel; the VM never pulls
from GitLab. So the VM needs no deploy token and no network path to the Searce
perimeter. Never reintroduce a `git fetch` deploy step on the VM.

`gitlab.searce.com` is only reachable from inside the Searce network — it
returns 403 to the public internet. Anything that talks to it must run from the
VPN. Migration runbook: `deploy/gcp/MIGRATE_TO_GITLAB.md`.

---

## How to run locally

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000  (mock data, no backend needed)

# With real backend:
NEXT_PUBLIC_DATA_SOURCE=api npm run dev
```

Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Full stack:
```bash
cd deploy
docker compose --env-file gcp/.env.prod up --build
```
