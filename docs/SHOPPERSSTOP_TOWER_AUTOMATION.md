# Shoppers Stop — Tower Automation Model

How Intellicore CMP compresses the delivery effort on the eCommerce Cloud
Managed Services engagement, tower by tower.

**Source contract:** SOW v1.0 (Draft), 4 September 2026. Effective 1 October
2026, 36-month term. Clause references below are to that document.

**Status of the numbers in this file:** the 420 hr/month baseline is the
human-only delivery estimate. The compressed column is a **model, not a
measurement** — the engagement has not started. Treat every figure here as a
target to be validated in the first two quarters, and re-baseline at the
first quarterly review. Nothing in this file should be quoted to the Client
as an achieved result.

---

## 1. Why the hours compress

The bulk of the 420 hours is not engineering. It is *watching* — L1 seats
monitoring dashboards, triaging alerts that mostly self-resolve, and executing
documented SOPs on a schedule. That work is automatable because it is
repetitive, has written procedures, and has a deterministic success check.

What does not compress is judgement: version upgrades, hardening, cascading
failure response, and anything where being wrong is expensive. Those hours stay
human, and the freed capacity moves into proactive work the Client has never had
capacity for.

---

## 2. The model

| Tower | Scope | Baseline hrs/mo | Modelled | Saving | Confidence |
|---|---|---:|---:|---:|---|
| A — Cloud Infrastructure | §4.3 | 100 | 65 | 35 | Medium |
| B — GKE & Cloud Run | §4.4 | 90 | 60 | 30 | Medium |
| C — Database (CloudSQL) | §4.5 | 70 | 50 | 20 | Medium |
| D — DevOps & CI/CD | §4.6 | 40 | 20 | 20 | Low |
| E — Windows VM | §4.7 | 30 | 15 | 15 | High |
| F — Cloud Security | §4.8 | 20 | 10 | 10 | Medium |
| G — FinOps | §4.9 | 20 | 8 | 12 | High |
| Governance / implementation | §3.1 | 50 | 40 | 10 | Medium |
| **Total** | | **420** | **268** | **152** | |

Confidence reflects how much of the saving depends on deterministic SOP
execution (high) versus model judgement that has to earn trust first (low).
**Tower D is the weakest claim in the table** — see §4.

### Squad sizing — correcting the arithmetic

At 173 hours per FTE-month:

- 420 hrs = **2.43 FTE**
- 268 hrs = **1.55 FTE**

If 420 hrs is 40% of the squad, the squad is ~6.1 FTE. Against that same
squad, 268 hrs is **25.5%, not 20%**. The earlier "40% → 20%" framing pairs
two different denominators and overstates the compression by about a fifth.

**Use 40% → 25%.** It is the defensible number, and it is still a strong
result. Adding ramp and edge cases, **25–30%** is the range to quote
commercially.

Tower E sunsets with the December 2026 GKE migration, recovering its
remaining 15 hrs/month from January 2027 — that is a scope reduction, not a
further AI saving, and should be presented separately.

---

## 3. What each agent does

Each agent maps to one tower and is seeded in
`frontend/src/lib/api/mock/aiops.ts`. Keep the two in step.

### Tower A — Alert Triage Agent · 100 → 65 hrs
Consumes Grafana and Dynatrace alerts across all 7 projects, classifies each
against Memory, opens the ITSM ticket with a proposed priority, and closes
the ones that self-resolve. The L1 engineer stops being a watcher and becomes
a responder.

*Acceptance:* ≥ 60% of alerts closed without paging; zero P1s missed or
misclassified downward over a rolling quarter.

### Tower B — GKE Health Agent · 90 → 60 hrs
Watches pod restarts, node pressure and autoscaling across both clusters and
Autopilot. Anything GKE repairs itself is logged, not paged. Escalates
cascading-failure signatures — the documented ss.com risk (§7.2).

*Acceptance:* Autopilot evictions never page. Cascade signature detected at
the checkout route with ≥ 6 minutes of warning.

*Not automated:* control-plane and node upgrades, Istio changes, hardening.
Those remain the senior specialist's 30 hrs.

### Tower C — Database SOP Agent · 70 → 50 hrs
Runs the weekly archival and backup-integrity SOPs inside the window,
verifies output, escalates only on failure. Tracks connection-pool and
storage trends for early warning.

*Acceptance:* SOPs run unattended with a verified success check; connection
exhaustion raised as P3 with ≥ 7 days of lead time rather than as a 03:00 P1.

*Note:* the MySQL 8.4 upgrade (§4.5) is a one-time project spike inside the
Senior DBA allocation. It burns off after December 2026 — do not model it as
recurring.

### Tower D — Deployment Agent · 40 → 20 hrs
Reads the pre-approved release note, validates pre-conditions, runs the
Jenkins pipeline in the 02:00–05:00 window, executes the release-specific
Magaz pod commands, runs post-deploy health checks, pages only on failure.

*Acceptance:* routine releases execute with zero human presence in the
window; any schema-bearing release still requires a human on call.

*Why confidence is low:* both deploy failures in the last 90 days carried a
database schema change, and **schema-change governance is still an open SOW
item (§9 item 1, due within 30 days of the Effective Date)**. Until that
workflow is agreed, a human stays on call for every release and this tower
saves closer to 10 hrs than 20. Resolving §9 item 1 is the single highest
-leverage action for this model.

### Tower E — Windows VM SOP Agent · 30 → 15 hrs
Weekly restart of all 5 production Windows VMs plus post-restart curl
validation per SOP, and the nightly card-archival script.

*Acceptance:* restarts and health checks run unattended; failures page.

*This one needs no model at all* — it is a scheduled job with a validation
script, which is why confidence is high. It is also the tower most likely to
be delivered in week one.

### Tower F — Security Triage Agent · 20 → 10 hrs
Ranks all 65+ CSPM checks by exploitability against this estate rather than
by raw CVSS, so the engineer works a top-N list instead of reviewing
everything.

*Acceptance:* the finding a senior engineer would have picked first appears
in the agent's top 3 on ≥ 90% of reviews.

*Evidence this works:* six findings carried higher CVSS than the Keycloak
22.0.1 CVE, but all six were in non-production while Keycloak sits on the
live ss.com auth path. Re-ranking moved it from 7th to 1st.

### Tower G — FinOps Digest Agent · 20 → 8 hrs
Drafts the bi-monthly cost report due on the 1st and 15th (§4.9), with
anomaly narratives and right-sizing recommendations written up. The analyst
edits and sends rather than authoring.

*Acceptance:* draft needs only editorial change, not re-analysis.

*Guardrail:* never action a right-sizing recommendation against production
GKE without checking the sale calendar. Deliberate sale-window headroom is
indistinguishable from waste to a generic report, and the SOW's 48-hour sale
notice (§7.2) is also the signal not to downsize.

---

## 4. Dependencies and risks

These are the conditions the model assumes. If they do not hold, the savings
do not either.

1. **BYOK keys must be live.** AI Hub features are contingent on the Client
   supplying and maintaining a valid Anthropic / OpenAI / Gemini key
   (§3.2, §4.10). With no key, every agent above stops and the engagement
   reverts to the 420-hour manual baseline. This is the single largest
   delivery risk and it sits on the Client's side of the RACI.

2. **Schema-change governance is unresolved** (§9 item 1). See Tower D.

3. **SOPs must be shared** (§9 item 5, due 1 October 2026). Towers C and E
   automate documented procedures. Undocumented procedure means no agent.

4. **Searce access is read-mostly** (§4.11). Agents operate through
   `ms.cloudengineer@` (Viewer) and `ms.prodsupport@` (Viewer + Tech Support
   Editor). Anything that changes state needs Client approval (§3.2), so
   "auto-remediation" means *propose and execute on approval*, not
   unilateral change. Pitch it that way — over-claiming autonomy here will
   not survive the first security review.

5. **Ramp time is real.** Memory has no history on this estate at day one.
   The compression curve starts near zero and builds over roughly two
   quarters as patterns accumulate. Do not promise month-one savings.

---

## 5. What the Client gets that a larger human squad cannot

Three things that are genuinely better, not merely cheaper. These are the
argument — the hours saved are Searce's margin story, not the Client's.

1. **Early warning instead of incident response.** Connection-pool exhaustion
   projected 9 days out and raised as a P3 in a maintenance window, rather
   than a P1 at 03:00. The cascade risk on ss.com is real and was flagged in
   the SOW itself (§7.2).

2. **Pre-sale event risk scoring.** A go/no-go assessment before each sale
   event: node headroom against expected load, DB connection headroom, open
   findings that carry blast radius. No human squad delivers this today at
   any price, and Shoppers Stop currently scales manually.

3. **MySQL 8.4 upgrade with AI-assisted dependency mapping.** Magento, SSO,
   Keycloak and CMS all touch the database layer. Knowing which services
   break if a schema changes compresses the upgrade and de-risks the
   December 2026 deadline (§4.5).

---

## 6. How to position it

Do not pitch this as "fewer people". Pitch it as:

> We are replacing L1 watch-and-wait hours with AI that never sleeps, does not
> miss anomalies, and gives you early warning instead of incident response.
> The human hours that frees go into proactive work your team has never had
> capacity for.

The commercial shape: 40% squad was the honest human-only estimate. With
Intellicore CMP fully activated the effective effort is **25–30% squad**,
delivering more capability. Searce keeps the margin improvement, the Client
gets a better service.

One caution: the SOW pricing table (§10.1) is still TBD and its Open Item 7
is owned by Nikhil John with Shoppers Stop procurement. Do not let the
compression model leak into the pricing conversation as a discount
justification before that table is agreed.
