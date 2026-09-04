# Intellicore Cloud Management Platform (Intellicore CMP)

**AI-native multi-cloud management platform** — with a per-customer knowledge graph that learns your cloud story and prevents your next mistake before you make it.

> Never again worry about your cloud.

---

## What This Is

Intellicore CMP is a managed cloud platform for organizations running production workloads on **GCP, AWS, or both**. Unlike traditional cloud management tools that show you a dashboard of the current state, Intellicore builds a **living graph** of every event your cloud emits — deployments, incidents, security findings, cost anomalies, architecture changes — and uses that graph to:

1. **Tell you your story** — a chronological, causal narrative of how your cloud has evolved
2. **Surface your patterns** — behavioral trends unique to your team, not generic best practices
3. **Prevent your next mistake** — pre-deployment intelligence that fires before you push

Backed by **CSRE** (Cloud Solutions & Reliability Engineering) — a named Searce squad that operates the platform on your behalf.

---

## Product Surface

Intellicore CMP is organized as **Operational Memory fused with five ops pillars**, plus a Command Center that briefs you on everything at once.

| Area | Route | What it does |
|------|-------|--------------|
| **Command Center** | `/` | Executive briefing: pillar health scores, what needs attention, patterns |
| **CloudOps** | `/cloudops` | Health + operational memory across VMs, Kubernetes, databases, serverless, data & AI |
| **FinOps** | `/finops` | Cost intelligence, anomalies correlated to past patterns, optimization memory |
| **Cloud Security** | `/secops` | Cloud security posture, CIS-mapped findings, IAM risk, compliance, remediation memory |
| **DevOps** | `/devops` | Risk-scored changes, orchestration, patch compliance, deployment memory |
| **AIOps** | `/aiops` | AI agents, natural-language queries, analysis tools — powered by your own AI key |
| **Memory** | `/memory` | The knowledge base — entries, incident patterns, remediation library, learnings |
| **Assets / CMDB** | `/assets` | Cloud resource inventory across GCP & AWS |
| **Alerts** | `/alerts` | Active / acknowledged / resolved alerts |
| **Settings** | `/settings` | AI keys (BYOK), in-product user guide, account |

### Bring Your Own AI Key (BYOK)

Every AI feature runs on the **customer's own key**. In **Settings → AI Keys**, customers add an **Anthropic Claude**, **OpenAI**, or **Google Gemini** key and pick one as active. Keys are **encrypted at rest** per-tenant (pgcrypto) and used only for that tenant — nothing is billed to Searce. The backend calls all three providers over their REST APIs (`app/services/llm_client.py`).

### Executive health reports

From any pillar, the top bar's **Download report** button generates a branded, print-to-PDF **executive health report** contextual to that pillar (CloudOps / FinOps / Cloud Security / DevOps / AIOps / Command Center) — ready to hand to a CIO, CISO, or CFO. See `frontend/src/lib/report.ts`.

### In-product user guide

**Settings → User Guide** documents every feature inside the product, so customers who log in can self-serve. Content lives in `frontend/src/lib/guide.ts`.

### Data layer (no hardcoding)

Every page's data flows through a typed data layer (`frontend/src/lib/api/`) via `useApiData(endpoint)` → `apiFetch`. It serves seed data from per-domain mock modules today; setting **`NEXT_PUBLIC_API_URL`** switches every page to the real backend with **zero page changes**.

---

## Architecture

```
                                  ┌─────────────────┐
                                  │   Next.js UI    │
                                  │   (frontend)    │
                                  └────────┬────────┘
                                           │ REST
                                  ┌────────▼────────┐
                                  │    FastAPI      │
                                  │   (backend)     │
                                  └────────┬────────┘
                        ┌──────────────────┼──────────────────┐
                        │                  │                  │
                ┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐
                │   PostgreSQL   │ │     Neo4j      │ │     Redis      │
                │   (tenants,    │ │  (Intellicore  │ │   (cache,      │
                │    accounts,   │ │    Memory      │ │    queue)      │
                │    audit)      │ │    graph)      │ │                │
                └────────────────┘ └────────────────┘ └────────────────┘
                                           │
                                  ┌────────▼────────┐
                                  │  Event Ingester │
                                  │   (worker)      │
                                  └────────┬────────┘
                                           │
                             ┌─────────────┼─────────────┐
                             │             │             │
                       ┌─────▼────┐  ┌─────▼────┐  ┌─────▼────┐
                       │   GCP    │  │   AWS    │  │  Mock    │
                       │ adapter  │  │ adapter  │  │ adapter  │
                       └──────────┘  └──────────┘  └──────────┘
```

**Databases**
- **PostgreSQL** — tenants, users, accounts, audit log, RBAC, settings
- **Neo4j** — the Intellicore Memory graph (resources, events, causal edges)
- **Redis** — session cache, event queue, rate limiting

**Services**
- **Backend** — FastAPI (Python 3.11), async, per-tenant isolation
- **Frontend** — Next.js 14 (App Router), TypeScript, Tailwind
- **Ingester** — background worker that pulls cloud events → normalizes → writes to Neo4j
- **LLM** — Anthropic Claude for Memory chat & pattern narration

---

## Repository Layout

```
intellicore-cmp/
├── backend/                # FastAPI service
│   ├── app/
│   │   ├── api/            # REST endpoints
│   │   ├── db/             # Postgres, Neo4j, Redis clients
│   │   ├── models/         # Pydantic schemas
│   │   ├── services/       # Business logic (graph writer, pattern detector, Claude)
│   │   ├── adapters/       # Cloud event adapters (GCP, AWS, mock)
│   │   └── core/           # Config, logging, auth
│   ├── scripts/            # DB init, demo seeding
│   ├── tests/              # pytest
│   └── pyproject.toml
├── frontend/               # Next.js UI
│   └── src/
│       ├── app/            # App Router pages
│       ├── components/     # Shared UI + Memory components (Timeline, PatternList)
│       └── lib/            # API client, theme
├── neo4j/                  # Graph schema + demo seed
│   ├── init/               # Constraints & indexes
│   └── seed/               # Demo customer graph (Cypher)
├── postgres/init/          # Table DDL
├── infra/terraform/        # Staging environment IaC (GCP)
├── docs/                   # PRDs, architecture notes
│   └── PRD-intellicore-memory.md
├── docker-compose.yml      # Local + staging environment
├── Makefile                # Common commands
└── .env.example
```

---

## Getting Started (Staging)

**Prereqs**: Docker Desktop, Make, Node 20+ (only if you want to run frontend outside Docker), Python 3.11+ (same).

```bash
git clone https://github.com/<your-org>/intellicore-cmp.git
cd intellicore-cmp
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY at minimum
make up
```

That's it. Wait ~30 seconds for services to become healthy, then:

- **UI**: http://localhost:3000
- **API**: http://localhost:8000/docs (Swagger)
- **Neo4j Browser**: http://localhost:7474 (user: `neo4j`, pass: from `.env`)

### Seed the demo graph

```bash
make seed
```

This loads a 6-month synthetic event history for a fictional customer ("Netcore Cloud"), so you can see the Memory in action immediately.

### Common commands

| Command | What it does |
|---|---|
| `make up` | Start all services in the background |
| `make down` | Stop all services |
| `make logs` | Tail logs from all services |
| `make seed` | Load demo graph into Neo4j |
| `make reset` | Wipe all databases and re-seed |
| `make test` | Run backend + frontend test suites |
| `make lint` | Format + lint all code |
| `make shell-backend` | Shell into the backend container |
| `make shell-neo4j` | Cypher shell into Neo4j |

---

## The Hero Feature: Intellicore Memory

See **`docs/PRD-intellicore-memory.md`** for the full product requirements document.

TL;DR: every event your cloud emits becomes a node in a per-customer Neo4j graph. Edges capture causality (`CAUSED`, `PRECEDED`, `RESOLVED_BY`, `TRIGGERED`). After 90 days, we surface **patterns unique to your cloud**. After 180 days, we fire pre-deployment intelligence that stops recurring mistakes.

Try it: `make seed && open http://localhost:3000/memory`

---

## Environment Variables

See `.env.example` for the full list. Critical ones:

| Var | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Platform fallback LLM key. Optional — customers Bring Their Own Key in Settings |
| `CREDENTIALS_SECRET` | Encrypts tenant-supplied AI keys at rest (falls back to `JWT_SECRET`) |
| `NEO4J_PASSWORD` | Neo4j admin password |
| `POSTGRES_PASSWORD` | Postgres admin password |
| `JWT_SECRET` | JWT signing secret (change in prod) |
| `TENANT_MODE` | `single` (dev) or `multi` (staging/prod) |
| `NEXT_PUBLIC_API_URL` | Frontend → real backend. Unset = serve seed/mock data |

---

## Development Workflow

1. **Branch**: `feature/<short-name>` or `fix/<short-name>`
2. **Commit**: conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
3. **PR**: opens against `main`; runs backend + frontend CI
4. **Merge**: squash-merge to keep `main` history clean

Backend hot-reloads via `uvicorn --reload`. Frontend hot-reloads via Next.js dev server. Both are mounted as volumes in Docker Compose so changes are picked up instantly.

---

## Testing

```bash
make test              # everything
make test-backend      # pytest only
make test-frontend     # jest + playwright
```

CI runs on every PR (`.github/workflows/`).

---

## Deployment & CI/CD

GitHub Actions pipelines (`.github/workflows/`):

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | push / PR to `main`, `staging` | Lint + build frontend, syntax-check backend |
| `deploy-staging.yml` | push to `staging` | Deploy to the staging GCP VM |
| `deploy-production.yml` | push to `main` | Deploy to production with health check + auto-rollback |
| `deploy-customer.yml` | manual dispatch | Provision a **new per-customer** GCP VM (static IP, TLS, Docker, generated `.env.prod`) |

Every new customer gets an isolated single-VM deployment via `deploy-customer.yml`.

## GCP architecture & cost

See **`docs/GCP_ARCHITECTURE.md`** for the two deployment topologies (single-VM per
customer, and production HA with managed services), diagrams, and a full monthly
cost breakdown. Because of BYOK, LLM inference is never a platform cost.

## Documentation

| Doc | Contents |
|-----|----------|
| `docs/USER_GUIDE.md` | End-user guide for every feature |
| `docs/SETUP_GUIDE.md` | Developer setup, data-layer wiring, API reference |
| `docs/FEATURE_AUDIT.md` | What's dynamic vs. seed data, per page |
| `docs/GCP_ARCHITECTURE.md` | GCP topologies + cost to operate |
| `docs/PRD-intellicore-memory.md` | Product requirements for Intellicore Memory |
| `docs/PRODUCT_BUILD.md` | Snapshot of what's actually built — demo-ready pass, customer book, what's not built yet |
| `marketing/WEBSITE.md` | The standalone marketing site — pages, design system, deployment |
| `BACKLOG.md` | Larger roadmap items not yet built |

---

## License

MIT. See `LICENSE`.

---

**Intellicore Cloud Management Platform** · A Searce Product · Powered by CSRE
