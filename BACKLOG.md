# Intellicore CMP — Product Backlog

This tracks the larger items that came out of the product-manager gap analysis
and the GTM/build-vs-buy review, which are documented here as roadmap rather
than built in the "demo-ready" pass (see git history around this file for
what *was* built: Memory Chat wiring, one real action per pillar, the
"SecOps → Cloud Security" naming cleanup, the published score methodology,
and the re-seeded 5-tenant customer book).

None of the items below are started. They're ordered roughly by what closes
the biggest gap between the GTM deck and the live product first.

## P1 — next after demo-ready

- **Discover / CMDB pillar, for real.** The deck's strongest unbuilt promise:
  a live multi-cloud CMDB in ~15 minutes — dependency mapping, auto-
  classification, orphaned-resource detection. Today `assets/page.tsx` is a
  polished UI over static seed data with no backend. This is the single
  highest-leverage build after the demo-ready wiring: it's the feature most
  likely to close a prospect in the first meeting, and the one most
  defensible against Freshservice/Freddy (see "Build vs. buy" below —
  ITSM tools have no CMDB-grade infrastructure discovery at all).

- **"Value Realized" dashboard.** The deck claims "30-50% less spend" and
  "up to 90% faster MTTR." Nothing in the product proves either claim today.
  Add a computed view to Command Center: incidents prevented (patterns with
  an active guardrail), savings realized (FinOps optimizations actually
  applied), MTTR trend (from the incident timeline). This is buildable from
  data the seed book already has — it turns two unproven deck claims into a
  demo-provable number.

## P2 — decide, then build

- **Agent MVP vs. explicit "Layer 2 only" positioning.** The GTM deck sells
  a full Agent layer (pre-built RCA/remediation/cost-advisor agents, custom
  agents on Vertex AI Agent Engine / ADK, AgentOps monitoring). The product
  has zero agent runtime — AIOps agent cards are static status displays, not
  running processes. Two paths: (a) scope a minimal single-agent RCA MVP —
  one agent that runs a Cypher query against the Memory graph and returns a
  root-cause report, roughly a sprint — or (b) tell solutions consultants to
  verbally position the current product as "Layer 2 only" in demos and hold
  the agent story for a later quarter. Needs a decision before more agent
  copy goes into customer-facing material.

- **`FreshserviceAdapter` on the existing `CloudAdapter` interface.**
  Backlog conclusion from the build-vs-buy review: don't rebuild what
  Freshservice/Freddy already does well (ticket-centric memory, similar-
  ticket suggestions), but do fold Freshservice's ticket + resolution data
  into the Memory graph as one more ingestion source, the same way
  `GCPAdapter`/`AWSAdapter`/`MockAdapter` feed it today. This is what lets
  Intellicore answer cross-domain questions ("this incident, this cost
  spike, and this security finding are the same root cause") that a
  single-domain ITSM tool structurally can't. Roughly 1-2 sprints.

- **Deck naming cleanup.** The GTM deck still uses "CloudLens" in the
  pre-built agents section (old product name, pre-dates the Intellicore CMP
  rebrand) and positions "Searce FinOps Platform" as a standalone asset
  rather than a pillar inside Intellicore. Both need a pass so the deck and
  the product agree on what the platform is.

## Known, accepted gaps (not urgent)

- Dedicated per-event "Investigate" views (Command Center, FinOps
  anomalies, Cloud Security findings) — currently disabled with a "Coming
  in V2" tooltip rather than left silently dead.
- Paginated Assets/CMDB browsing beyond page 1 of the seed set.
- On-demand AI Analysis Tool runs outside the Memory Chat conversation
  (CloudOps "Run Analysis", AIOps "Launch") — same treatment.
- Real remediation execution. `ApplyFixModal` (used by Command Center,
  FinOps, Cloud Security, DevOps, and the AIOps chat) simulates the apply
  step and updates the page's own state — there is no backend endpoint yet
  that actually executes a Terraform apply, IAM change, or config push.
  Building that is a distinct, larger effort (execution sandboxing,
  approval workflow, rollback) and is intentionally out of scope here.
