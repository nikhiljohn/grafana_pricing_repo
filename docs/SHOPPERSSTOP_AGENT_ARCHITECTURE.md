# Shoppers Stop — Agent Architecture & Claude API Sizing

How Intellicore CMP runs the eCommerce engagement end to end: the agent
fleet, the FreshService ITSM integration, and what the Claude layer costs.

**Companions:** `SHOPPERSSTOP_TOWER_AUTOMATION.md` (hours model),
`SHOPPERSSTOP_DELIVERY_DESIGN.md` (onboarding, release, FinOps, outcomes).

**Code:** `backend/app/agents/registry.py` is the source of truth for the
fleet. This document explains it; the registry defines it. Re-run
`python -m app.agents.cost_model` after any change.

---

## 1. The operating model

> Intellicore holds the detail and hands the human team exactly what to
> run. Every automation is *suggested* by Intellicore CMP. Claude sits
> behind that, never in front of the infrastructure.

This is not a cautious choice — it is what the contract already requires.
Under SOW §4.11 Searce holds Project Viewer and Tech Support Editor, with
no access to application data, source code or business data. Under §3.2
every Searce-initiated change needs Client approval. An agent that mutated
customer infrastructure would be operating outside the access model
Shoppers Stop signed.

So the unit of output is a **work packet**, not an applied change:

| Field | Why it is there |
|---|---|
| `summary` | One sentence, readable at 03:00 |
| `sow_priority` | P1–P4 per §7.1, which sets the SLA clock |
| `confidence` | Below 70, the packet is flagged for diagnosis review |
| `memory_context` | What happened before here — or an explicit "no prior occurrence" |
| `sop_steps` | Ordered, runnable commands with expected results |
| `rollback` | **Required.** A step list without one is not executable |
| `requires_client_approval` | True whenever the action changes state (§3.2) |

The schema is enforced with structured outputs, so the FreshService writer
and the UI never defensively parse model prose.

One rule is load-bearing: **an agent that finds no precedent must say so.**
A fabricated pattern is worse than no pattern, because the whole product
claim rests on Memory being trustworthy.

---

## 2. The fleet — 16 agents

All seven towers are covered. `Tier` determines volume profile and
therefore cost.

### Streaming — carry the L1 load

| Agent | Tower | Trigger | Calls/mo |
|---|---|---|---:|
| Alert Triage | A | Every Grafana/Dynatrace alert, 7 projects | 1,800 |
| GKE Health | B | Pod restarts, node pressure, Istio events | 900 |
| Database Health | C | Connection/storage/slow-query signals, 5 instances | 200 |
| Cost Anomaly | G | Billing deltas beyond the seasonal model | 60 |
| Security Finding Triage | F | Each CSPM scan — all 65+ checks in one call | 30 |

Security Triage ranks the **whole** finding set in a single call on
purpose. Per-finding calls would cost more *and* lose the ability to
reason about relative blast radius — which is exactly what moved the
Keycloak CVE from 7th to 1st past six higher-CVSS findings sitting in
non-production.

### Scheduled — predictable, batchable

| Agent | Tower | Trigger | Calls/mo |
|---|---|---|---:|
| Windows VM SOP | E | Weekly restarts + nightly archival | 34 |
| Deployment Pre-flight | D | Each release, before the window opens | 12 |
| Memory Curator | Cross | Nightly over resolved FreshService tickets | 30 |
| FinOps Digest | G | 1st and 15th (§4.9) | 2 |
| Wellness / CAB Pack | Gov | Monthly | 1 |

### On-demand — rare, deep, multi-turn

| Agent | Tower | Trigger | Calls/mo |
|---|---|---|---:|
| SOP Advisor | Cross | "What do I run for this ticket?" | 200 |
| Change Risk Scorer | D | Every change request | 60 |
| Incident Commander | Cross | Any P1, or escalating P2 | 24 |
| MySQL 8.4 Dependency Mapper | C | Per schema change + the upgrade programme | 20 |
| Pre-Sale Readiness | Cross | On the Client's 48h sale notice (§7.2) | 10 |
| Compliance Reporter | F | On request | 4 |

**Total: 3,387 calls/month.**

Two agents deserve emphasis. **Memory Curator** is the flywheel — without
it Memory only ever contains what we seeded and never learns from the
squad's own resolutions. **Incident Commander** is the only agent a human
talks to during an outage; do not downgrade its model to save $3.

---

## 3. "How many Claude APIs?"

**One.** The Messages API. Every agent is a prompt shape and a token
profile over the same endpoint — there is no per-agent API to procure,
provision or rate-limit separately.

What actually varies is call volume and model tier:

| Configuration | USD/mo | INR/mo |
|---|---:|---:|
| All 16 agents on `claude-opus-5` | **$161** | ~₹14,200 |
| Streaming on Sonnet 5, reasoning on Opus 5 | $91 | ~₹8,000 |
| All on `claude-sonnet-5` | $65 | ~₹5,700 |
| All on `claude-haiku-4-5` | $32 | ~₹2,800 |

Cost by agent, on the default all-Opus fleet:

| Agent | Calls | $/call | USD/mo |
|---|---:|---:|---:|
| Alert Triage | 1,800 | 0.033 | 59.31 |
| GKE Health | 900 | 0.037 | 33.25 |
| SOP Advisor | 200 | 0.093 | 18.60 |
| Database Health | 200 | 0.045 | 8.89 |
| MySQL Dependency Mapper | 20 | 0.375 | 7.50 |
| Security Triage | 30 | 0.200 | 5.98 |
| Change Risk Scorer | 60 | 0.098 | 5.88 |
| Memory Curator | 30 | 0.180 | 5.41 |
| *(remaining 8)* | 347 | — | 16.46 |
| **Total** | **3,387** | | **161.28** |

### Put that in proportion

The AI layer costs roughly **₹14,200/month** against a **₹11.2L/month**
cloud bill — about **1.3% of cloud spend** — and it is modelled to save
~152 engineer-hours/month.

**Recommendation: run everything on `claude-opus-5`.** The gap between
Opus and the mixed tier is ~$70/month. On an engagement of this size that
is not a number worth trading judgement quality for, and the two agents
that would move to a cheaper model (Alert Triage, GKE Health) are exactly
the ones deciding what wakes a human at 03:00. The cheaper tiers are
modelled in `cost_model.py` so the choice stays available and explicit —
but it is a commercial decision to take deliberately, not a default.

### Prompt caching is doing most of the work

Each agent's system prefix — SOP library plus estate context, ~12K tokens
— is marked cacheable, with the per-call signal placed *after* the
breakpoint. Cache reads bill at 0.1× input, writes at 1.25×.

At a 95% hit rate on the streaming agents this is roughly a **5× saving**
on the fleet bill. It is also fragile: interpolating a timestamp, a ticket
ID, or anything per-request into the prefix silently invalidates it and
multiplies the cost.

The runtime logs a warning whenever `cache_read_input_tokens` comes back
zero on an agent with a large prefix. **Treat that warning as a
production incident**, not a debug line — it means the bill just jumped
and nothing else will tell you.

### BYOK

Every call bills to the Client's own key (§3.2, §4.10). The figures above
are what Shoppers Stop pays Anthropic, not what Searce pays. That makes
the cost conversation straightforward — and it makes key health an
operational concern, because a lapsed key stops all 16 agents. See
`SHOPPERSSTOP_DELIVERY_DESIGN.md` §1.5.

---

## 4. FreshService as the system of record

Intellicore does not own ticket state. FreshService does — it is what the
squad and the Client actually look at.

```
  Grafana / Dynatrace / CSPM / billing export
                 │
                 ▼
        Agent (Claude, advisory)
                 │
                 ▼
          Work packet  ──────►  FreshService ticket
                 │                  (priority, SOP, rollback)
                 │                          │
                 │                   human executes
                 │                          │
                 │                   resolution notes
                 │                          │
                 ▼                          ▼
            Neo4j Memory  ◄────────  Memory Curator (nightly)
```

**Priority mapping.** SOW §7.1 uses P1–P4; FreshService uses a 4-point
scale. The mapping lives in exactly one place
(`freshservice_client.SOW_TO_FS_PRIORITY`) and is covered by a bijection
test — an off-by-one here silently puts a ticket on the wrong SLA clock,
which is a contractual problem, not a cosmetic one.

| SOW | FreshService | Response | Resolution |
|---|---|---|---|
| P1 Critical | 4 Urgent | 15 min | < 4 hr |
| P2 Major | 3 High | 30 min | < 8 hr |
| P3 Moderate | 2 Medium | 30 min | < 24 hr |
| P4 Low | 1 Low | 4 hr | 5 business days |

**The return leg is the point.** `collect_curation_batch` pulls resolved
tickets nightly, and deliberately skips any whose resolution notes are
missing or trivially short. A ticket closed with "done" records that
something happened, not what was learned — ingesting it inflates the
pattern count without improving a single future recommendation.

**Suppression is a first-class outcome.** When an agent recommends
`suppress`, no ticket is filed. That is the entire value of triage on this
estate: 11 benign Autopilot evictions in 90 days that never needed to page
anyone.

### Security

The webhook receives attacker-influenced text — anyone who can raise a
FreshService ticket controls the subject and description, and those
strings reach an agent prompt. Two consequences:

- The endpoint authenticates with a shared secret compared in constant
  time, and **fails closed when unset**. An unset secret must never mean
  allow-everyone; that is how a staging default becomes a production hole.
- Ticket text is treated as data, never instruction. The runtime's system
  prompt is the operator channel; ticket content goes in the user turn.

### SOW correction needed

§3.1 names the ITSM integration target as "Grafana/Dynatrace". Those are
monitoring and APM tools, not an ITSM. FreshService is the actual system.
**The clause should be corrected before signature** so the integration
obligation names the right system — otherwise Searce is contractually
committed to integrating with something that cannot hold a ticket.

---

## 5. Environments

CI already defines both, in `.gitlab-ci.yml`:

| Environment | Branch | Job | Guard |
|---|---|---|---|
| `staging` | `staging` | `deploy:staging` | `resource_group: staging` |
| `production` | `main` | `deploy:production` | `resource_group: production`, `interruptible: false` |

Deploys ship a tarball to the VM over an IAP tunnel with a health check
and auto-rollback. The VM never pulls from GitLab, so it needs no deploy
token and no route into the Searce perimeter.

**Protected branches and protected variables are one decision.** A
protected CI variable is invisible to a pipeline on an unprotected branch.
Protected variables plus an unprotected `staging` means `deploy:staging`
runs with an empty `GCP_SA_KEY` and dies at `gcloud auth` — looking
exactly like a bad service account. `bootstrap-staging.sh` protects the
branch for this reason.

### Order of operations

1. `bash deploy/gcp/bootstrap-staging.sh` — **from a VPN machine.** Creates
   and protects the branch, creates the environment, sets the variables,
   and reports runner availability.
2. `ENVIRONMENT=staging … bash deploy/gcp/provision-customer.sh` — stands
   up the GCP staging VM. Needs gcloud, not a GitLab token.
3. Re-run step 1 with `STAGING_VM_NAME` / `STAGING_VM_ZONE` /
   `STAGING_DOMAIN` set, so CI points at the new VM.
4. Push to `staging`. `deploy:staging` fires.
5. Point the FreshService webhook at
   `https://${STAGING_DOMAIN}/api/freshservice/webhook` with header
   `X-Intellicore-Signature: ${FRESHSERVICE_WEBHOOK_SECRET}`.

Production is the same flow against `main`, after staging has been
exercised.

### The blocker that outranks all of this

**There is still no GitLab runner** (`HANDOFF.md` §3). Without one every
pipeline queues forever, and neither environment deploys. The runner needs
to reach `gitlab.searce.com` *and* Google's APIs, which the deploy VM
cannot do — it sits outside the perimeter. `bootstrap-staging.sh` reports
this rather than letting you discover it by watching a pipeline hang.

---

## 6. What is built vs. what is designed

Being explicit, because this document describes both.

**Built and tested** (32 tests, lint clean):

- Agent registry, all 16 agents, all 7 towers
- Cost model, with the arithmetic under test
- Claude runtime — SDK, adaptive thinking, prefix caching, structured
  output, refusal handling
- FreshService client — tickets, notes, priority mapping, resolved-ticket
  polling
- Memory bridge — work packet rendering, filing, suppression, curation filter
- Webhook receiver — constant-time auth, fails closed
- `bootstrap-staging.sh`, with its preflight guards exercised

**Designed, not yet wired:**

- The Curator's Neo4j write path (`collect_curation_batch` returns the
  batch; ingestion reuses `graph_writer`)
- Per-agent scheduling (no scheduler runs these yet)
- The SOP library itself — it depends on SOW §9 item 5, due 1 Oct
- Live FreshService credentials, which need a Client-side account

**Cannot be done from here:**

- Creating anything on `gitlab.searce.com` — 403 from outside the
  perimeter. Hence `bootstrap-staging.sh`.
- Provisioning GCP VMs — needs an authenticated gcloud.
