# Intellicore CMP — Feature Audit

## Executive Summary

| Metric | Count |
|--------|-------|
| Total frontend pages | 10 (9 app + 1 login) |
| Pages using data layer (`@/lib/api`) | **0** |
| Pages with 100% hardcoded data | **9** |
| Working backend API endpoints | **12** |
| Frontend ↔ Backend connections | **2** (Login + TopBar user display) |
| Interactive features (tabs, filters) | **Working** |
| Action buttons (Apply Fix, Auto-fix, etc.) | **Visual only** |

---

## Page-by-Page Breakdown

### 1. Command Center (`/`) — 470 lines
**Data**: 100% hardcoded (9 const arrays inline)
- `intelligenceScores` — 5 pillar scores
- `attentionItems` — 4 priority alerts with Memory context
- `changeItems` — 5 recent changes by pillar
- `workloadHealth` — 5 workload type summaries
- `memoryPatterns` — 4 detected patterns
- `csreActivity`, `greenChecks`, `memoryTimeline`, `timelineMonths`

**Working interactions**:
- Tab switching (Intelligence Briefing / 24h Changes / Memory Patterns)
- Dismiss button on attention items (local state toggle)

**Visual-only**:
- Memory Timeline chart (static SVG bars)
- "View all" links (no target pages)

---

### 2. CloudOps (`/cloudops`) — 867 lines
**Data**: 100% hardcoded (3+ large inline objects)
- VM instances, Kubernetes clusters, databases, serverless functions, data pipelines
- Incident history per workload type
- Analysis metrics

**Working interactions**:
- Top tabs (All Workloads / Compute / Kubernetes / Databases / Serverless / Data & AI)
- Sub-tabs (Overview / Analysis)
- Expand/collapse instance detail panels
- Analysis category switching

**Visual-only**:
- "View Incident" links
- Metric trend indicators (static percentages)

---

### 3. FinOps (`/finops`) — 708 lines
**Data**: 100% hardcoded (6 const arrays)
- `costByPillar` — 5 cost breakdowns with sparkline data
- `anomalies` — 2 cost anomalies with Memory correlation
- `optimizations` — 3 optimization entries
- `monthlyTrend` — 7 months of cost data
- `forecast` — 3 future months

**Working interactions**:
- Tab switching (Cost Intelligence / Optimization Memory / Anomalies / Forecasting)

**Visual-only**:
- "Apply Fix" buttons (no API call)
- Sparkline charts (rendered but static data)
- Cost trend charts

---

### 4. SecOps (`/secops`) — 636 lines
**Data**: 100% hardcoded (inline objects in JSX)
- Security findings with CIS benchmark mappings
- IAM risk identities
- Compliance frameworks
- Remediation history

**Working interactions**:
- Tab switching (Findings Intelligence / IAM Risk / Compliance / Remediation Memory)
- Severity filter (Critical / High / Medium / Low)
- Expand finding detail panels

**Visual-only**:
- "Auto-fix available" badges (no action)
- Posture score donut (static SVG)
- "Run Remediation" actions

---

### 5. DevOps (`/devops`) — 799 lines
**Data**: 100% hardcoded (inline objects)
- Risk-scored changes with Memory context
- Orchestration requests
- Patch compliance data
- Deployment history

**Working interactions**:
- Tab switching (Change Intelligence / Orchestration / Patch Compliance / Deployment Memory)

**Visual-only**:
- Risk score badges
- Orchestration approval buttons
- Deployment rollback options

---

### 6. AIOps (`/aiops`) — 737 lines
**Data**: 100% hardcoded (9 const arrays)
- 3 AI agents with status
- Agent activity log
- Audit trail
- Analysis tools grid
- Usage governance data

**Working interactions**:
- Tab switching (AI Agents / Query Infrastructure / AI Analysis Tools / Usage & Governance)
- Query input field (accepts text but doesn't call API)
- Quick query suggestions (populate input field)

**Visual-only**:
- AI Agent status indicators
- "Run Analysis" tool cards
- Query send button (no backend call)
- Confidence threshold sliders

---

### 7. Memory (`/memory`) — 756 lines
**Data**: 100% hardcoded (5 const arrays)
- 8 memory entries
- 4 incident patterns
- 4 remediation library entries
- 4 cross-pillar learnings

**Working interactions**:
- Tab switching (All Memory / Incident Patterns / Remediation Library / Learnings)
- Pillar filter (All / CloudOps / FinOps / SecOps / DevOps)
- Search input (filters locally — functional)

**Visual-only**:
- Pattern occurrence bar charts
- "View Details" links
- Auto-fix Library section

---

### 8. Alerts (`/alerts`) — 300 lines
**Data**: 100% hardcoded (2 const arrays)
- 4 alert objects with severity, status, description

**Working interactions**:
- Status filter tabs (All / Active / Acknowledged / Resolved)
- Expand/collapse alert detail cards

**Visual-only**:
- "Acknowledge" buttons (no API call)
- Alert severity badges
- Baseline/current/increase metrics

---

### 9. Assets/CMDB (`/assets`) — 427 lines
**Data**: 100% hardcoded (1 large asset array)
- Cloud asset inventory with type, provider, region, cost

**Working interactions**:
- Search input (filters locally — functional)
- Provider filter tabs
- Sort controls
- Grid/table view toggle

**Visual-only**:
- Asset detail links (`href="#"`)
- Cost values

---

### 10. Login (`/login`) — 10 lines + LoginForm (222 lines)
**Data**: DYNAMIC — calls real backend API
- `POST /api/auth/login` — email/password authentication
- `POST /api/auth/totp/verify` — TOTP 2FA verification

**Working interactions**:
- Email/password form submission → backend API
- TOTP setup with QR code display
- TOTP code verification
- "Remember device" toggle
- Redirect after successful login

**Status**: **Fully functional** (requires running backend)

---

## Backend API Status

### Working Endpoints (12 total)

| Endpoint | Method | Status | Frontend Consumer |
|----------|--------|--------|-------------------|
| `/health` | GET | Working | Docker healthcheck |
| `/ready` | GET | Working | Docker healthcheck |
| `/auth/login` | POST | Working | LoginForm |
| `/auth/totp/verify` | POST | Working | LoginForm |
| `/auth/session/check` | GET | Working | Middleware (Caddy) |
| `/auth/logout` | POST | Working | LogoutButton |
| `/auth/me` | GET | Working | TopBar |
| `/memory/timeline` | GET | Working | Not connected to frontend |
| `/memory/patterns` | GET | Working | Not connected to frontend |
| `/memory/event/{id}` | GET | Working | Not connected to frontend |
| `/memory/chat` | POST | Working | Not connected to frontend |
| `/events/ingest` | POST | Working | Not connected to frontend |
| `/cost/summary` | GET | Stub | Not connected to frontend |
| `/security/summary` | GET | Stub | Not connected to frontend |

### Backend Services
- **Auth**: Full email/password + TOTP (Google Authenticator compatible) — JWT + Redis sessions
- **Memory**: Neo4j-backed knowledge graph with timeline, patterns, causal chains, chat
- **Events**: Ingest pipeline for cloud events → Neo4j graph
- **Cost/Security**: Stub endpoints returning placeholder data

---

## Data Layer Status

### Created but NOT wired

| File | Purpose | Status |
|------|---------|--------|
| `lib/api/types.ts` | 25 TypeScript interfaces | Created, unused |
| `lib/api/mock.ts` | 26 mock endpoints | Created, unused |
| `lib/api/client.ts` | `apiFetch()` with mock/real swap | Created, unused |
| `lib/api/hooks.ts` | `useApiData()` React hook | Created, unused |
| `lib/api/index.ts` | Barrel export | Created, unused |

### Separate legacy client
| File | Purpose | Status |
|------|---------|--------|
| `lib/api.ts` | Auth + Memory backend calls | **Used** by TopBar, LoginForm |

---

## What Works End-to-End

1. **Login flow** — Email → Password → TOTP setup/verify → JWT session → redirect to app
2. **Session display** — TopBar fetches `/auth/me` and shows user email + initials
3. **Logout** — Clears session cookie via `/auth/logout`
4. **Navigation** — Sidebar routing between all 9 app pages
5. **Tab/filter interactions** — All tab switches, severity filters, search inputs work (local state)
6. **Build/Deploy pipeline** — `npm run build` succeeds, Docker Compose stack deploys
7. **Health checks** — `/health` and `/ready` endpoints

## What Does NOT Work

1. **All dashboard data is static** — scores, alerts, costs, findings, memory entries are `const` arrays
2. **Action buttons are decorative** — "Apply Fix", "Auto-fix", "Acknowledge", "Remediate" do nothing
3. **AIOps query interface** — accepts input but doesn't call any API
4. **Memory search** — TopBar search bar ("Ask Memory anything") has no handler
5. **Dark mode toggle** — sidebar button exists, no implementation
6. **Notifications bell** — visual only
7. **Charts/sparklines** — render but show static hardcoded data
8. **Cost/Security backend** — stub endpoints return empty data
