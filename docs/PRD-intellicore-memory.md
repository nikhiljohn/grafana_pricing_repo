# PRD — Intellicore Memory (Intellicore CMP Hero Feature)

**Status**: Draft v1 · **Owner**: Product · **Target**: V1 backend / V2 UI · **Last updated**: 2026-07-28

---

## 1. Problem Statement

Every customer's cloud is not a collection of resources — it is a record of decisions. Deployments cause incidents. Incidents cause re-architectures. Re-architectures introduce security misconfigurations. Cost anomalies trace back to a scaling decision made 6 months ago.

**No tool in the market maps this causal graph.**

- **Google Enhanced Support / AWS Enterprise Support**: reactive, ticket-based, zero customer memory
- **Datadog / New Relic**: current state, no causal history
- **CloudHealth / Apptio Cloudability**: cost snapshots, no cross-domain correlation
- **Wiz / SCC**: security findings without deployment context

Every cloud tool today is a **rearview mirror**. Customers see what happened, but not *why* it keeps happening — and never what will happen next.

**Persona pain (all four ICPs)**:
- **Arjun (CTO)** — "Every 3 months we hit the same class of incident. Different team, different cluster, same root cause. Nobody's tracking the pattern."
- **Meera (FinOps Lead)** — "Our cost spikes always trace back to a decision made months ago. By the time we understand it, we've already paid for it 3 times."
- **Rohan (Eng Head)** — "After every AI rollout, our SCC lights up. I don't know which findings are new patterns vs. old known-issues."
- **Pooja (AI-native)** — "We're moving so fast we're re-making decisions we already made — because nobody remembered the last time didn't work."

**Evidence**:
- 6 of 6 pilot customers asked "why did *X* happen?" in the first month — a question no dashboard could answer
- Netcore's ₹40L+ annual savings came from a single pattern: campaign launches without pre-scaled infra → 3× incident rate → cost spike
- 100% of ICP interviewees said they would pay more for "an MSP that actually remembers our history"

---

## 2. Goal & Success Metrics

**North star**: shift Intellicore CMP from a *retrospective dashboard* to a *prospective advisor*.

### Objectives & Key Results

| Objective | KR (12 months post-launch) |
|---|---|
| Customers see the value in month 1 | 90% of new customers open the Memory Timeline in first 7 days |
| Patterns drive action | Median customer has ≥5 patterns "activated" (guardrail on) by month 3 |
| Prospective intelligence prevents incidents | 25% reduction in "repeated cause" incidents (defined as: incident whose root cause matches a prior graph pattern) |
| Memory drives retention | NRR of Memory-active accounts is 15pp above non-Memory accounts |
| Memory drives sales | 40% of demos that show a live Memory convert to pilot within 30 days |

### Leading indicators (weekly)
- Events ingested per customer per day (proxy: graph is growing)
- Pattern surface rate (patterns/week/customer)
- Pre-deployment intelligence trigger rate
- Memory Chat sessions per customer per week

### Lagging indicators (quarterly)
- Repeated-cause incident rate (target: -25% YoY)
- Memory-account NRR (target: 130%+)
- Time to first "aha" moment in pilot (target: <7 days)

---

## 3. User Stories

### Retrospective (Act 1 — Days 1–90)

**US-1**: As a **CTO**, I want to see a visual timeline of every major event my cloud has emitted, so that I can understand the story of how we got here.

**US-2**: As a **FinOps Lead**, I want to trace a cost spike back to the deployment or configuration change that caused it, so that I can prevent a recurrence.

**US-3**: As an **Eng Head**, I want to see which of my security findings were caused by which deployments, so I can prioritize architectural fixes over one-off remediations.

### Pattern Recognition (Act 2 — Days 90–180)

**US-4**: As a **CTO**, I want Intellicore to tell me the top 5 recurring patterns in my cloud, so I can decide which ones to guardrail.

**US-5**: As a **FinOps Lead**, I want to see behavioral patterns unique to my team (e.g. "your GKE clusters hit memory pressure at 65% of projected load, not 80%"), so my capacity planning gets more accurate.

### Prospective (Act 3 — Days 180+)

**US-6**: As a **DevOps Engineer**, I want Intellicore to warn me before I apply a Terraform plan that historically causes issues in our environment, so I don't repeat mistakes.

**US-7**: As an **AI Engineer**, I want Intellicore to flag when I'm about to spin up an inference endpoint configuration that has historically caused cost runaway or latency issues in our stack.

### Conversational (Continuous)

**US-8**: As **anyone on the team**, I want to ask "why did X happen?" in natural language and get an answer sourced from our actual cloud history, so I don't have to trawl logs.

---

## 4. Scope

### In Scope (V1)
- **Event ingestion** from GCP Audit Logs, GCP Cloud Asset Inventory changes, AWS CloudTrail, AWS Config, SCC findings, Cost anomaly stream, Terraform plan/apply events (via webhook)
- **Neo4j graph** — schema, indexes, per-tenant isolation
- **Cloud Timeline UI** — scrollable, filterable narrative view (read-only)
- **Pattern detection** — background job that runs Cypher queries against graph, surfaces patterns to review UI
- **Memory Chat (basic)** — natural language questions answered via Claude + graph context
- **Adapters interface** — pluggable so new event sources can be added

### In Scope (V2 — Q4)
- **Pre-Deployment Intelligence** — GitHub Action + Terraform Cloud integration; queries graph before plan apply
- **Pattern Library** with "never again" toggles that create guardrails
- **Memory Chat (advanced)** — multi-turn, memory-aware, cites specific graph nodes

### Out of Scope (V1 & V2)
- Cross-customer pattern sharing (privacy risk; separate PRD later)
- Auto-remediation from patterns (guardrails only; humans still approve actions)
- Historical event backfill beyond what cloud providers retain (typically 90–400 days)
- Kubernetes cluster-level events beyond Deployment/StatefulSet lifecycle (add in V3)
- On-prem event ingestion (cloud-only for V1/V2)

---

## 5. Functional Requirements

### FR-1: Event Ingestion
- **FR-1.1** System ingests events from at minimum: GCP Audit Logs, AWS CloudTrail, SCC, Cost anomalies, Terraform hooks
- **FR-1.2** Events are normalized to a canonical schema (`Event` node type) before write
- **FR-1.3** Ingestion is idempotent — the same source event must not create duplicate nodes
- **FR-1.4** Ingestion lag from source event → graph write is < 5 minutes p95
- **FR-1.5** Per-tenant event isolation is enforced at the database level (separate graph labels/namespaces or separate databases)

### FR-2: Graph Schema
- **FR-2.1** Node types: `Resource`, `Deployment`, `Incident`, `SecurityFinding`, `CostAnomaly`, `ArchPattern`, `AIWorkload`, `Team`, `Change`, `Person`
- **FR-2.2** Edge types: `CAUSED`, `PRECEDED`, `RESOLVED_BY`, `DEPLOYED_WITH`, `DEPENDS_ON`, `TRIGGERED`, `CORRELATED_WITH`, `LEARNED_FROM`, `OWNED_BY`
- **FR-2.3** Indexes on `(tenant_id, timestamp)`, `(tenant_id, resource_id)`, `(tenant_id, event_type)`
- **FR-2.4** Every node carries `tenant_id`, `created_at`, `source`, `raw_payload_ref` (pointer to raw event in object storage)

### FR-3: Causal Edge Inference
- **FR-3.1** A background job runs every 15 minutes to infer causal edges between events using rules (temporal proximity + resource overlap + known patterns)
- **FR-3.2** Inferred edges carry a `confidence` score (0.0–1.0); UI shows only edges above threshold (default 0.6)
- **FR-3.3** Users can confirm/reject inferred edges — feedback trains the inference rules over time

### FR-4: Cloud Timeline UI
- **FR-4.1** Renders events grouped by month, then week, then day (drill-down)
- **FR-4.2** Filterable by event type, resource, team, severity
- **FR-4.3** Clicking any event opens a side panel showing full detail + causal chain (upstream + downstream)
- **FR-4.4** "Zoom out" mode shows a 3-year narrative summary generated by Claude

### FR-5: Pattern Detection
- **FR-5.1** Every 24 hours, a job runs `pattern:*` Cypher queries against each tenant's graph
- **FR-5.2** Detected patterns are stored as `Pattern` nodes with `first_seen`, `last_seen`, `occurrence_count`, `confidence`
- **FR-5.3** Patterns with `occurrence_count >= 3` and `confidence >= 0.7` surface to the Pattern Library UI
- **FR-5.4** Each surfaced pattern includes: title, evidence (list of graph nodes), impact estimate, recommended action

### FR-6: Pre-Deployment Intelligence (V2)
- **FR-6.1** GitHub Action posts a comment on Terraform PRs with matched historical patterns
- **FR-6.2** Terraform Cloud/Atlantis integration blocks plan apply if a high-severity pattern is matched (customer opt-in)
- **FR-6.3** Response time: pattern check completes in < 10 seconds p95

### FR-7: Memory Chat
- **FR-7.1** Natural language interface at `/memory/chat`
- **FR-7.2** Backend translates user question → Cypher query (via Claude tool use) → executes → returns natural language answer with cited graph nodes
- **FR-7.3** Every answer includes a "show evidence" link that opens the underlying subgraph in the Timeline

### FR-8: Multi-tenancy
- **FR-8.1** Per-tenant Neo4j database (recommended) or per-tenant graph label (fallback)
- **FR-8.2** All queries are tenant-scoped at the API layer; no cross-tenant reads possible
- **FR-8.3** Tenant deletion purges all graph data within 24 hours (DPDP compliance)

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Timeline API returns first page in < 500ms p95 for graphs up to 1M nodes |
| **Ingestion throughput** | Sustain 10k events/minute per tenant; burst to 50k/minute |
| **Availability** | 99.5% for Memory read APIs; 99.9% for ingestion |
| **Data residency** | All tenant data resides in `asia-south1` (Mumbai) by default; DPDP-compliant |
| **Security** | Row-level tenant isolation, mTLS between services, all Claude prompts scrubbed of PII before send |
| **Cost per tenant** | Neo4j Aura cost target: <$50/tenant/month at median graph size |
| **Retention** | Full event graph retained for 2 years; older events summarized and archived to object storage |

---

## 7. Dependencies

| Dependency | Owner | Status |
|---|---|---|
| Neo4j Aura (managed) | Infra | Contract required for prod; local Neo4j OK for staging |
| Anthropic API access | Product | Already contracted |
| GCP Audit Log Pub/Sub sink | Customer (per account) | Documentation + Terraform module needed |
| AWS EventBridge → CloudTrail | Customer (per account) | Documentation + CloudFormation template needed |
| Terraform Cloud webhook (V2) | Customer opt-in | V2 only |
| GitHub App for PR comments (V2) | Platform team | V2 only |

---

## 8. Open Questions

| # | Question | Owner | Decision needed by |
|---|---|---|---|
| Q1 | Neo4j Aura pricing at 100 tenants — is it economical, or do we self-host on GKE? | Infra + Finance | Before V1 GA |
| Q2 | How do we handle customers with 3+ cloud accounts — one graph or one graph per account? | Product + Eng | V1 design |
| Q3 | Memory Chat over Claude — do we allow multi-turn history to persist? What's the retention model? | Product + Legal | Before Chat beta |
| Q4 | Do we ship the graph schema as versioned migrations, or as a runtime-adaptive schema? | Eng lead | V1 design |
| Q5 | What's the customer opt-in flow for pre-deployment intelligence — customer-scoped or repo-scoped? | Product | V2 design |
| Q6 | Cross-customer pattern sharing (with opt-in + anonymization) — is this a V3 feature or never? | Product + Legal | V3 planning |

---

## 9. Launch Plan

### Alpha (V1 core — internal only)
- **Timing**: 6 weeks from PRD approval
- **Scope**: Event ingestion (mock adapter + GCP Audit Logs), graph schema, Timeline UI (basic)
- **Users**: Internal CSRE squads on their own test accounts
- **Success**: Timeline renders correctly for a real 30-day event stream

### Beta (V1 GA candidates)
- **Timing**: +6 weeks after Alpha (12 weeks total)
- **Scope**: All V1 features (GCP + AWS adapters, pattern detection, Memory Chat basic)
- **Users**: 3 pilot customers (Netcore, Aarti Industries, Indihood — all already opted in)
- **Success**: 5+ patterns surfaced per customer; Memory Chat answers first 20 questions correctly; NPS 40+

### GA (V1)
- **Timing**: +6 weeks after Beta (18 weeks total)
- **Scope**: V1 hardened + pricing tiers + docs
- **Users**: All Advanced tier and above
- **Success**: 10 GA customers within 30 days; retention above baseline

### V2 (Prospective intelligence)
- **Timing**: +12 weeks after V1 GA
- **Scope**: Pre-Deployment Intelligence (GH Action + Terraform Cloud), Pattern Library with guardrails, Memory Chat advanced
- **Success**: 25% reduction in repeated-cause incidents at pilot customers

---

## 10. Positioning & Naming

**Product surface**: **Intellicore Memory** — customer-facing name for the graph experience.

**Taglines**:
- *"Your cloud, remembered."*
- *"Your mistakes, never repeated."*
- *"The only cloud platform with memory."*

**How it appears in the Intellicore CMP UI**:
- Left sidebar top item: **Memory** (with a small "NEW" badge until GA+90d)
- Landing page for Memory is the Timeline; sub-tabs: Timeline / Patterns / Chat

**How it appears in sales collateral**:
- Slide 3 of the GTM deck ("What if your cloud could think ahead?") → this is the answer
- Demo flow: connect account → wait 24 hours → show the customer their own story back

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Graph gets too large / expensive at scale | Retention policy + node summarization for old events; cost-monitor per tenant |
| Pattern detection surfaces false positives → user trust erosion | Confidence threshold + user confirm/reject → feedback loop; conservative default threshold (0.7) |
| Memory Chat hallucinates cloud events | All answers must cite graph nodes; reject responses that can't be grounded; audit sample weekly |
| Ingestion delay causes stale Timeline | SLA + monitoring; failure alerts to CSRE squad |
| DPDP / GDPR — graph contains sensitive metadata | Data residency in region; scrub PII before Claude calls; tenant deletion within 24h |

---

**End of PRD**
