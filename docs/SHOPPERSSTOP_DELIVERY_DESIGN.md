# Shoppers Stop — Delivery Design

Onboarding, release engineering, FinOps maturity, and outcome attachment for
the eCommerce Cloud Managed Services engagement.

**Source contract:** SOW v1.0 (Draft), 4 Sep 2026. Effective **1 Oct 2026**,
36-month term. Clause references are to that document.

**Companion:** `SHOPPERSSTOP_TOWER_AUTOMATION.md` holds the per-tower hours
model. This file is what has to be true operationally for that model to hold.

**Today is 12 Sep 2026 — 19 days to the Effective Date.** Everything in §1 is
on the critical path.

---

## 0. The one constraint that shapes all four answers

Searce operates **read-mostly** and does not control the application.

Per §4.11, Searce holds Project Viewer and Tech Support Editor through two
service accounts, has no access to application data, source code or business
data, and the Client retains Owner with an approval workflow over every
change (§3.2). Application code, release notes, schema design and Magento
administration are all explicitly the Client's (§3.2, §4.6).

This is the right security posture and it should not change. But it means:

- "Auto-remediation" is **propose-and-execute-on-approval**, never unilateral.
- Searce cannot fix the root cause of the failures it is most often blamed
  for — every deploy failure in 90 days came from a schema change Searce
  neither designed nor wrote.
- Any outcome metric must be filtered for **controllability** before fee is
  attached to it (§4).

Every design below is built around that boundary rather than pretending it
isn't there.

---

## 1. Onboarding

### 1.1 What actually blocks the start

SOW §9 lists eight open items. They are not equal — two block signature, six
block delivery, and one blocks everything else.

| # | Item | Owner | Due | Blocks |
|---|---|---|---|---|
| 3 | **GCP access to all 7 projects** | Subhasish Mishra | 1 Oct | **Everything** |
| 6 | MSA date + OppID | Nikhil John + Diwyata Burbure | Signature | Signature |
| 7 | Pricing table (§10.1) | Nikhil John + SS Procurement | Signature | Signature |
| 5 | SOP documentation | Subhasish + Dhwani | 1 Oct | Towers C, E automation |
| 2 | Dedicated PoC vs shared squad | Subhasish Mishra | +14d | Squad assignment, §6 L1 name |
| 4 | Jenkins / pipeline config | Subhasish Mishra | +14d | Tower D |
| 1 | **Schema change governance** | Subhasish + Harish | +30d | Tower D savings, release quality |
| 8 | Keycloak replacement timeline | Subhasish Mishra | +60d | Tower F scope |

**Item 3 is the critical path.** Nothing — no inventory, no baseline, no
Memory, no agent — starts before the two Searce service accounts are granted
on all 7 projects. It is due *on* the Effective Date, which leaves no slack.
**Pull it forward to 25 Sep** and treat any slip as a start-date slip.

**Item 1 is the highest-leverage.** It alone caps Tower D at roughly half its
modelled saving (see `SHOPPERSSTOP_TOWER_AUTOMATION.md` §3) and it is the
root of the release quality problem in §2 below.

### 1.2 The thing most onboardings get wrong here

**Memory starts empty.** The entire product proposition is that every alert is
contextualised by what happened before — and on day one, nothing happened
before. For the first 60 days Intellicore CMP is a well-organised dashboard,
which is not what was sold.

So onboarding must include a **Memory backfill** as a first-class workstream,
not an afterthought:

- Export 12 months of incident history from the Client's ITSM.
- Export Grafana alert history and Dynatrace problem records.
- Pull 12 months of GCP billing export for seasonal cost baselines — this is
  what makes the festive curve a model rather than a flat threshold.
- Harvest the SOPs (§9 item 5) as seed remediation-library entries.

Ingested history is what makes the first sale event defensible. Without it,
the first festive peak is faced with no seasonal baseline at all.

*Dependency:* historical exports need Client cooperation beyond the §4.11
read-only service accounts. Raise it as an explicit onboarding ask, not an
assumption.

### 1.3 Phases

**Phase 0 — now to 30 Sep · Contract and access**
Close items 6 and 7. Pull item 3 forward. Agree the backfill exports. Name
the L1 squad lead (§6 shows TBD) by closing item 2. Confirm the tier
assumption — the tenant record infers `elite` from 24×7 coverage and a 15-min
P1 SLO; the SOW never states it, and it should not first surface on an invoice.

**Phase 1 — Day 1–7 · Connect and reconcile**
Grant the service accounts. Run asset discovery across all 7 projects.

Then do the step that is routinely skipped: **reconcile discovered inventory
against SOW §4.2.** The SOW says 7 projects, ~21–25 production pods, 5 Windows
VMs, 5 Cloud SQL instances. Reality will differ. Any material divergence is a
change-order conversation in week one, when it is cheap, rather than in month
six when it is a dispute. Update
`frontend/src/lib/api/mock/shoppersstop-env.ts` and
`postgres/init/03-shoppersstop-tenant.sql` with the real project IDs together.

Deliverable: a signed-off inventory baseline.

**Phase 2 — Day 8–21 · Shadow, do not automate**
Run the towers manually alongside the Client's current process. Ingest the
backfill. Let Memory accumulate against live events.

The temptation is to switch agents on in week one to show value. Resist it.
An agent that mis-triages in week two costs more trust than it saves hours,
and trust is the thing the whole engagement runs on. The one exception is
**Tower E** — Windows VM restarts and curl validation are deterministic SOP
execution with no model judgement, which is why it carries the highest
confidence in the hours model. Ship it first.

**Phase 3 — Day 22–45 · Baseline and first agents**
Publish the measurement baseline (§4.3) — this is what outcome attachment is
later judged against, so it must be agreed, not asserted. Activate Towers A,
C and G. Run the first bi-monthly cost report (§4.9) on the 1st or 15th.

**Phase 4 — Day 46–90 · Full activation and first review**
Activate Towers B and F. Tower D activates only once item 1 closes. Hold the
first quarterly review: re-baseline the hours model against measured reality
and correct it publicly rather than defending the original estimate.

### 1.4 Onboarding exit criteria

Onboarding is done when all of these are true — not when the calendar says so:

- [ ] 7 projects discovered, reconciled against §4.2, divergences change-ordered
- [ ] Memory backfilled with ≥ 6 months of history
- [ ] BYOK key active and health-checked (see §1.5)
- [ ] SOPs harvested into the remediation library
- [ ] Baseline published and **countersigned by the Client**
- [ ] Escalation chain tested with a live drill, not just documented
- [ ] Tower E running unattended for 2 consecutive weeks
- [ ] Schema governance (item 1) agreed and encoded as a release gate

### 1.5 BYOK is the single largest delivery risk

Every AI capability is contingent on a Client-supplied, Client-maintained LLM
key (§3.2, §4.10). It sits on the Client's side of the RACI, and if it lapses,
all seven agents stop and the engagement silently reverts to the 420-hour
manual baseline while still being billed as automated.

Mitigations, all cheap, none currently in the SOW:

1. **Key health check** — validate on a schedule, alert the squad and the
   Client PoC on failure, surface key state on the Command Center. Treat an
   expired key as a P2, because operationally it is one.
2. **Quota headroom** — a rate-limited key degrades agents silently. Monitor
   remaining quota, not just validity.
3. **Named key owner** on the Client side, in the escalation matrix.
4. **Contractual carve-out** — Searce's tower commitments should be explicitly
   suspended while no valid key is active. Without this, Searce carries an
   obligation whose precondition another party controls.

Item 4 belongs in the SOW before signature. It is a one-clause change and it
is the difference between a risk and a liability.

---

## 2. Releasing better

### 2.1 What the data says

From the 90-day deploy history:

- 11 releases, all inside the 02:00–05:00 window. **Zero window breaches.**
- 2 failures. **Both carried a database schema change.**
- 9 releases without a schema change. **All succeeded.**
- Mean time from release-note approval to deploy: 6 days.

The window discipline is already excellent and needs no fixing. The schema
correlation is the entire problem, and the approval lag — not the window — is
the actual bottleneck.

### 2.2 Be honest about the lever

The standard "release better" answer is smaller, more frequent releases. That
requires changing how the Client's application team builds and tests, and
application code and release management are explicitly out of scope (§4.6).
**Searce cannot raise deployment frequency.** Claiming otherwise sets up a
commitment that cannot be delivered.

What Searce *can* own: **change failure rate**, **window risk**, and
**recovery time**. Target those and say so plainly.

### 2.3 Release classes

Not all releases deserve the same ceremony. Classify at release-note intake:

| Class | Contents | Handling | Human in window |
|---|---|---|---|
| **A** | App image only, no schema, no infra | Fully automated by the Tower D agent | No |
| **B** | Any DB schema change | Rehearsal + gate + named on-call | Yes |
| **C** | Infra, platform, cluster or Istio change | CAB-approved, scheduled separately | Yes |

On the 90-day history, 9 of 11 releases are Class A — that is where the
zero-human-in-window saving comes from, and it is available immediately
without waiting on item 1.

### 2.4 The schema fix: expand / contract

This is the engineering answer to the failure pattern, and it is worth taking
to the Client's application team as a joint proposal rather than a Searce
policy.

Both failures were destructive migrations run in a single release inside a
3-hour window: r47 timed out mid-migration, r44 locked the orders table. A
migration that must complete *and* is not backward-compatible has no safe
abort point — rolling back a half-applied destructive migration is worse than
the outage.

Split every schema change across two releases:

1. **Expand** — additive and backward-compatible only. Add the column, add the
   index concurrently, dual-write. The old code still runs against the new
   schema, so rollback is just redeploying the old image.
2. **Deploy** — application code that uses the new shape.
3. **Contract** — a later release drops the old column, once the new path is
   proven.

No single release is then both mandatory and irreversible. This converts the
Class B risk into three low-risk Class A-shaped steps.

For MySQL specifically: require `ALGORITHM=INPLACE, LOCK=NONE` where the
change supports it, and use `pt-online-schema-change` or `gh-ost` where it
does not. The r44 orders-table lock is exactly what online schema change
exists to prevent.

### 2.5 Pre-flight gate

Automated, runs before the window opens, blocks entry on failure. This is
where the `devops-schema-release-rehearsal` and `devops-maintenance-window`
guardrails seeded in `03-shoppersstop-tenant.sql` fire.

- Release note present, pre-approved, and parsed into a release class
- For Class B: UAT rehearsal evidence against production-shaped data, with
  recorded migration duration
- Rollback path stated and tested
- Post-deploy verification suite defined — including the release-specific
  Magaz pod commands (§4.6), which are currently tribal knowledge in a
  runbook and should be codified as an executable check
- Cluster headroom sufficient (no deploying into an 81% node pool)
- No sale event inside the next 24h
- Deploy window ≥ estimated duration × 2

### 2.6 In-window discipline

- **Abort gate at T+90 min.** A migration still running at 03:30 will not
  finish safely before 05:00. Abort on the clock, not on optimism. Both
  failures were rolled back inside the window — that instinct is right and
  should be a rule rather than a judgement call.
- **Canary before full rollout.** r46 held canary 12 minutes; it succeeded.
  Make it standard for Class A and B.
- **Verification beyond curl.** Current post-restart validation is a curl
  health check (§4.7) — it proves the process is listening, not that checkout
  works. Add a synthetic transaction against the checkout path, since that is
  where the cascade always starts.

### 2.7 Measure it

Standard DORA, restricted to what Searce controls:

| Metric | Current | Target |
|---|---|---|
| Change failure rate | 18% (2/11) | < 10% |
| Failed-deploy recovery | ~47 min | < 30 min |
| Window breaches | 0 | 0 |
| Class A releases run unattended | 0% | > 90% |
| Deployment frequency | 3–4/mo | *Client-owned — track, don't target* |

---

## 3. Better FinOps

### 3.1 The SOW buys reporting; the value is in allocation

§4.9 commits Searce to cost monitoring, bi-monthly reports, CUD/SUD planning,
anomaly detection and right-sizing. That is a solid Level 1–2 FinOps practice
and it is what was sold. It is also not what makes a retailer's CFO care.

**"₹11.2L/month across 7 projects" is not a number Shoppers Stop can act on.**
"₹3.40 of infrastructure per order, up from ₹3.10 last month" is. Moving from
the first to the second is what "better FinOps" means here.

### 3.2 Maturity ladder

**Level 1 — Visibility (SOW baseline).** Cost by project, bi-monthly on the
1st and 15th. Already scoped.

**Level 2 — Allocation.** Tag and map spend to services and business
functions: what does checkout cost, what does catalogue cost, what does the
Windows VM estate cost. Requires a tagging standard that does not exist yet —
propose it in onboarding, because retrofitting tags across 7 live projects is
far more expensive later.

**Level 3 — Unit economics.** Infrastructure cost per order, per session, and
as a percentage of GMV. This is the level where FinOps stops being a cost
report and becomes a business input.

*Hard dependency:* unit economics needs order and GMV counts, which are
business data Searce explicitly cannot access under §4.11. This requires a
narrow, deliberate data-sharing agreement — a daily order-count feed is
enough, and it does not require widening cloud access. Worth asking for; it is
the single highest-value addition to the FinOps scope.

**Level 4 — Cost-aware engineering.** Budget impact surfaced at change time,
seasonal forecasting tied to the sale calendar rather than a linear trend, and
guardrails that stop cost-increasing changes before they ship.

### 3.3 Where the money actually is

Two items carry ~₹1.87L/month — about **17% of the entire run rate**:

| Lever | Saving | Nature | Owner |
|---|---|---:|---|
| 1-year CUD on production GKE node pool | ₹1.02L/mo | Commitment | **Client buys** |
| Retire 3 Windows VMs post-migration | ₹85.2K/mo | Project | Joint |
| Nearline lifecycle on campaign assets | ₹18.5K/mo | Config | Searce, needs retention call |

Everything else on the list is ₹10–30K/month.

The strategic consequence: **better FinOps for Shoppers Stop means driving two
projects to completion, not hunting more optimisations.** A squad that closes
the Windows VM migration on time delivers more FinOps value than one that
finds twenty more orphaned disks. Report against those two lines every cycle
and let the small items accumulate quietly.

### 3.4 The accountability trap

CUD procurement is explicitly out of scope — Searce advises, the Client
purchases (§4.9). So a KPI of "savings delivered" makes Searce accountable for
a decision it cannot make.

Split the metric:

- **Searce owns:** recommendation quality — identified, quantified, evidenced,
  delivered on time.
- **Client owns:** acceptance and purchase.
- **Joint, and the one to report:** *recommendation acceptance rate*, and
  realised savings against accepted recommendations.

An unaccepted ₹1.02L/month CUD recommendation is a Client decision, and the
report should show it as one — visibly, every cycle, until it is actioned or
consciously declined.

### 3.5 Two specific guardrails

**Never right-size production GKE without checking the sale calendar.**
Sale-window headroom is deliberate over-provisioning and is indistinguishable
from waste in any generic report. The 48-hour sale notice (§7.2) is also the
do-not-downsize signal. Seeded as `finops-sale-window-headroom`, enforcement
`block`.

**Forecast against the retail calendar, not a trend line.** The Aug storage
flag was rebaselined against FY24/FY25 festive curves and came back within 4%
— a linear model would have called it an anomaly every year. Seasonality is
the dominant term in a retailer's cost curve.

### 3.6 Evidence the narrative approach works

Two of the three largest cost movements last quarter were **configuration
mistakes, not capacity growth**: campaign creative served from the bucket
instead of the CDN, and UAT running at full scale overnight. A static budget
threshold catches neither — both are within budget, just wasteful. Anomaly
narratives with Memory context caught both. That is the argument for the AI
layer in FinOps, and it is worth making with these two examples specifically.

---

## 4. Attaching to outcomes

### 4.1 Where the SOW is today

§7.1: SLA remedy is **non-financial** — an engineering hours bank or
escalation prioritisation — unless otherwise agreed in writing and approved by
Harish Gurram.

That is a low-risk commercial position and a weak differentiator. Every
managed services vendor offers response-time SLOs. None of it is an *outcome*:
it measures how fast Searce answers, not whether anything got better.

### 4.2 The controllability filter

Before attaching fee to a metric, it must pass three tests:

1. **Controllable** — Searce can materially move it within its scope.
2. **Independently measurable** — not solely from Searce's own telemetry.
3. **Attributable** — a miss can be traced to a cause and an owner.

Applying the filter:

| Candidate metric | Controllable | Verdict |
|---|---|---|
| Sale-window availability of ss.com | Partly — infra yes, app no | **Yes, with app-fault carve-out** |
| Repeat-incident rate | Yes — this is Memory's actual promise | **Yes — the flagship metric** |
| Change failure rate | Partly — gate yes, schema design no | **Yes, Class A only** |
| P1 response SLO | Yes | Yes — already committed |
| MySQL 8.4 delivered before Dec 2026 | Joint (§8 RACI: Client accountable) | **Milestone, shared** |
| Windows VM migration before Dec 2026 | Joint | **Milestone, shared** |
| Realised cost savings | No — Client purchases | **No.** Use acceptance rate |
| Overall uptime | No — app failures dominate | **No** |

### 4.3 The flagship metric: repeat-incident rate

If Operational Memory works, **the same incident should not recur**. That is
the product's actual claim, it is measurable, and no competitor without an
operational memory layer can commit to it.

Proposed definition: *the percentage of P1/P2 incidents in a quarter whose
signature matches a pattern already in Memory and which were not prevented or
auto-resolved.*

Baseline it during the measure-only period, then commit to a downward
trajectory. This is the metric to lead with commercially — it is the one that
only Searce-with-Intellicore can offer.

### 4.4 A staged commercial model

**Stage 1 — Measure only (Q1–Q2, to ~31 Mar 2027).**
Instrument everything, publish monthly, attach no fee. Memory has no history
at day one and the hours model is unvalidated; committing money against an
unmeasured baseline is how outcome contracts go wrong for both sides. Exit
criterion: two consecutive quarters of stable measurement both parties accept.

**Stage 2 — At-risk pool (from Q3).**
Put **10–15% of the monthly fee** at risk against four or five metrics that
passed the §4.2 filter. Start at 10%. Symmetry matters: an equivalent upside
for exceeding target, or it is just a discount mechanism with extra reporting.

Indicative scorecard:

| Metric | Weight | Notes |
|---|---:|---|
| Repeat-incident rate | 30% | The flagship |
| Sale-window availability | 30% | Infra-attributable only |
| Class A change failure rate | 20% | Excludes schema-bearing releases |
| P1 response SLO adherence | 10% | Already committed in §7.1 |
| FinOps recommendation quality | 10% | Delivered + evidenced, not accepted |

**Stage 3 — Gain-share on FinOps (from Q3, runs alongside).**
Share of *verified realised* savings on accepted recommendations, measured
against the agreed baseline from billing export. Caps and a floor both ways.
This is clean because realisation is objectively visible in the bill.

**Milestones, handled separately.** The MySQL 8.4 upgrade and the Windows VM
migration are date-certain (Dec 2026) and jointly owned per the §8 RACI.
Treat them as milestone payments with shared-delay provisions, not as
scorecard metrics — a joint obligation does not belong in a Searce-only
penalty.

### 4.5 Exclusions, stated up front

An outcome contract without clean exclusions becomes a dispute. Exclude:

- Application-layer faults — Magento, SAP Hybris, app code, Client-authored
  release notes (§3.2, §4.6)
- Client-caused delays, including unapproved changes sitting in the approval
  workflow (§3.2)
- **BYOK key lapse or quota exhaustion** — the agents cannot run, so the
  commitments cannot bind
- GCP provider outages — governed by Google's own SLA (§7.1)
- Schema-bearing releases until item 1 closes
- Any month where a §9 open item remains unresolved past its due date *and*
  materially blocks the metric
- Force majeure, per the MSA

### 4.6 The measurement conflict — raise this before it is raised at you

**Searce would be reporting on Searce's own SLA using Searce's own platform.**
Intellicore CMP is both the delivery tool and the measurement instrument. The
first time a scorecard result is disputed, that becomes the whole argument.

Fix it before signing, not after:

- **Dynatrace is the Client's** (§4.2) and is already in the estate. Use it as
  the independent availability source. This is the cheapest and strongest
  answer — the tie-breaker is already installed.
- Derive cost outcomes from **GCP billing export**, which is Google's record,
  not Searce's.
- Make scorecard telemetry **queryable by the Client**, and publish the
  calculation method, not just the result.
- Reserve an agreed third-party tie-break for contested quarters.

### 4.7 What to propose to Shoppers Stop

> For the first two quarters we measure and publish, with no money attached,
> until both sides agree the baseline is real. From Q3 we put 10% of the
> monthly fee at risk against four metrics — led by repeat-incident rate,
> because if our Operational Memory works, the same thing should not break
> twice. Availability is measured on your Dynatrace, not our platform. And we
> share in the cloud savings we find, once they show up in your Google bill.

That is a commitment no vendor without an operational memory layer can make,
it is measured on the Client's own instrument, and Searce only carries risk on
things Searce can actually move.

---

## 5. Open decisions for Nikhil

1. **Confirm the tier.** The tenant record infers `elite`. The SOW never says.
2. **Pull §9 item 3 (access) forward to 25 Sep.** It is the critical path and
   is currently due on the start date with zero slack.
3. **Add a BYOK suspension clause** before signature (§1.5). One clause.
4. **Ask for the order-count feed.** It unlocks Level 3 FinOps and does not
   require widening cloud access (§3.2).
5. **Decide whether outcome-based pricing goes into SOW v1.0 or a later
   amendment.** Recommendation: put the *measure-only* commitment in v1.0 and
   the at-risk pool in a Q2 amendment, once there is a baseline to attach to.
6. **Take expand/contract to the Client's app team** as a joint proposal
   (§2.4). It is the actual fix for the only failure mode in the release data.
