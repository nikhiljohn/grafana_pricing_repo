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

### Design system — ported from the marketing site

The app's visual language is taken **verbatim from the marketing site**
(`marketing/index.html`, live at
`storage.googleapis.com/intellicore-cmp-site-77682/index.html`). If you need a
colour, radius or button treatment, read that file first — it is the reference.

Tokens live in `frontend/src/app/globals.css` under `:root` as `--ic-*`, and are
exposed to Tailwind as `ic-*` utilities (`bg-ic-panel`, `text-ic-muted`,
`border-ic-border`) via `tailwind.config.ts`. Because the utilities point at the
CSS variables, every one of them follows dark mode automatically.

Two accent families, and picking the wrong one is the usual mistake:

- **`--ic-*-ink`** (emerald `#059669`, blue `#0284c7`, …) — for anything drawn on
  the light page: text, badges, icons, active states. **Emerald-ink is the
  primary brand accent** — it replaced the old `searce-blue`.
- **`--ic-*`** vivid (emerald `#34d399`, blue `#38bdf8`, …) — only against dark
  canvases, where the ink shades go muddy. The site uses these inside its dark
  diagram cards.

Geometry: 16px cards (Tailwind `rounded-xl` is remapped from 12px to 16px so
existing cards inherit it), 10px buttons/controls (`rounded-btn`).

Primary buttons are the site's gradient, not a flat fill:
`bg-gradient-to-br from-ic-emerald to-emerald-500 text-[#062018]`. There are no
black or navy buttons anywhere in the design — if you see one, it's drift.

Reusable pieces in `globals.css @layer components`: `.ic-nav` (sticky
translucent header), `.ic-brand-mark`, `.ic-card` / `.ic-card-hover`,
`.ic-btn*`, `.ic-eyebrow`, `.ic-stat-value`.

### Brand mark

`frontend/src/components/BrandMark.tsx` — one memory-graph glyph, used by the
favicon (`src/app/icon.svg`), the app header and the login screen, so the
browser tab and the in-app header always match.

`BrandLockup` includes the site's **CMP hover-bloom**: the acronym expands to
"Cloud Management Platform" on hover. The three `.cmp-letter` spans must stay
the only element children of `.cmp-expand` — reveal timing keys off
`:nth-child` — and the `{" "}` between them is load-bearing (JSX strips the
inter-element whitespace the site's HTML relies on).

Branding lives in the **header only**. The sidebar deliberately has no wordmark;
putting one back duplicates the mark a few hundred pixels away.

### Dark mode

Class-based (`html.dark`). Persisted to `localStorage`. No-flash inline script in
`layout.tsx` applies the class before React hydrates. `ThemeToggle` component
in sidebar. `html.dark` overrides the `--ic-*` tokens — including promoting the
ink accents to their vivid equivalents — so token-based code needs no dark
variants. A remap layer still covers pages that hardcode `text-slate-*`
utilities; prefer `ic-*` tokens in new work so that layer can shrink.

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

## Git remotes and branch

Active development branch: `claude/intellicore-cmp-review-j4fbts`

| Remote | URL | Notes |
|---|---|---|
| `gitlab` | `https://gitlab.searce.com/intellicore-cmp/intellicore-cmp.git` | Private. **Canonical.** Default branch `main`, protected. |
| `origin` | `https://github.com/nikhiljohn/grafana_pricing_repo` | Public. Kept deliberately — `cloudshell-deploy.sh` still sources from it. Do **not** archive it. |

## Source control & CI/CD

The canonical remote is **Searce GitLab** (`gitlab.searce.com`), not GitHub.
GitHub Actions were removed in the migration; `.gitlab-ci.yml` is the single
source of CI/CD truth — validate → build → deploy → provision.

Deploys **push** a tarball to the GCP VM over an IAP tunnel; the VM never pulls
from GitLab. So the VM needs no deploy token and no network path to the Searce
perimeter. Never reintroduce a `git fetch` deploy step on the VM.

That applies to the *pipeline*. The manual fallback
`deploy/gcp/cloudshell-deploy.sh` does have the VM `git fetch` from **GitHub**,
because neither the VM nor Cloud Shell can reach the Searce perimeter. That is
why GitHub stays alive — until the pipeline can deploy (it needs a runner,
`HANDOFF.md` §3) or the script is converted to package-and-ship.

`gitlab.searce.com` is only reachable from inside the Searce network — it
returns 403 to the public internet, and that includes Cloud Shell, CI sandboxes
and Claude Code sessions. Anything that talks to it must run from the VPN.

Auth to GitLab needs a `glpat-` PAT — **not** the `glft-` feed token GitLab
prints on the same settings page. `write_repository` scope pushes code; project
settings need `api`, and scopes cannot be edited after creation. Migration
runbook: `deploy/gcp/MIGRATE_TO_GITLAB.md`; token traps: `HANDOFF.md` §5.

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
