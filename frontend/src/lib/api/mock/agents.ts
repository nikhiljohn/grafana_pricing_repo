/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Agent Operations seed data                      */
/*  Tenant: Shoppers Stop — eCommerce workloads.                      */
/*                                                                     */
/*  Mirrors backend/app/agents/registry.py. When NEXT_PUBLIC_DATA_     */
/*  SOURCE=api the same shapes are served live from that registry by   */
/*  GET /agents/* — so this file is the demo-mode twin, not a second   */
/*  source of truth. Change the registry first, then mirror here.      */
/*                                                                     */
/*  Operating model: Intellicore ADVISES, humans EXECUTE. Every agent  */
/*  emits a work packet — diagnosis, exact commands, rollback — that a */
/*  Searce engineer runs by hand. Nothing here mutates the estate.     */
/* ------------------------------------------------------------------ */

export interface AgentRow {
  key: string;
  name: string;
  tower: string;
  tier: "streaming" | "scheduled" | "on_demand";
  status: "active" | "investigating" | "idle";
  trigger: string;
  produces: string;
  monthlyCalls: number;
  model: string;
  effort: string;
  lastAction: string;
  confidence: number;
  sowClause: string;
}

export interface SopStep {
  step: number;
  action: string;
  command: string;
  expected: string;
}

export interface WorkPacket {
  id: string;
  agentKey: string;
  agentName: string;
  subject: string;
  summary: string;
  sowPriority: "P1" | "P2" | "P3" | "P4";
  confidence: number;
  memoryContext: string;
  recommendedAction: "execute_sop" | "escalate" | "suppress" | "observe";
  sopSteps: SopStep[];
  rollback: string;
  requiresClientApproval: boolean;
  /** FreshService ticket id — 0 when the agent suppressed the signal. */
  ticketId: number;
  ticketStatus: "Open" | "Pending" | "Resolved" | "Suppressed";
  raisedAt: string;
}

const AGENTS: AgentRow[] = [
  {
    key: "alert_triage",
    name: "Alert Triage Agent",
    tower: "A — Cloud Infrastructure",
    tier: "streaming",
    status: "active",
    trigger: "Every Grafana / Dynatrace alert across all 7 projects",
    produces: "FreshService ticket with proposed priority, Memory match and the SOP to run",
    monthlyCalls: 1800,
    model: "claude-opus-5",
    effort: "medium",
    lastAction: "Classified LB egress spike as a catalogue feed export — closed without paging",
    confidence: 89,
    sowClause: "§4.3",
  },
  {
    key: "gke_health",
    name: "GKE Health Agent",
    tower: "B — GKE & Cloud Run",
    tier: "streaming",
    status: "active",
    trigger: "Pod restarts, node pressure, autoscaling and Istio events",
    produces: "Logged non-event, or an escalation naming the cascading-failure signature",
    monthlyCalls: 900,
    model: "claude-opus-5",
    effort: "medium",
    lastAction: "Autopilot pod eviction rescheduled in 90s — logged, no human action",
    confidence: 91,
    sowClause: "§4.4",
  },
  {
    key: "db_health",
    name: "Database Health Agent",
    tower: "C — Database (CloudSQL)",
    tier: "streaming",
    status: "active",
    trigger: "Connection, replication, storage and slow-query signals on 5 instances",
    produces: "Early-warning ticket with the projected breach date and the remediation SOP",
    monthlyCalls: 200,
    model: "claude-opus-5",
    effort: "high",
    lastAction: "Projected ss-magento-db-01 connections to reach max in 9 days — P3 raised",
    confidence: 94,
    sowClause: "§4.5",
  },
  {
    key: "security_triage",
    name: "Security Finding Triage Agent",
    tower: "F — Cloud Security",
    tier: "streaming",
    status: "investigating",
    trigger: "Each CSPM scan — ranks all 65+ checks in one call",
    produces: "Top-N findings ranked by exploitability against this estate, with exact remediation",
    monthlyCalls: 30,
    model: "claude-opus-5",
    effort: "xhigh",
    lastAction: "Ranked Keycloak CVE above 6 higher-CVSS findings — live auth path",
    confidence: 86,
    sowClause: "§4.8",
  },
  {
    key: "cost_anomaly",
    name: "Cost Anomaly Agent",
    tower: "G — FinOps",
    tier: "streaming",
    status: "active",
    trigger: "Billing export deltas beyond the seasonal model",
    produces: "Anomaly narrative with root cause hypothesis, prior occurrence and fix",
    monthlyCalls: 60,
    model: "claude-opus-5",
    effort: "high",
    lastAction: "Storage egress +214% traced to campaign assets bypassing the CDN",
    confidence: 84,
    sowClause: "§4.9",
  },
  {
    key: "windows_vm_sop",
    name: "Windows VM SOP Agent",
    tower: "E — Windows VM",
    tier: "scheduled",
    status: "active",
    trigger: "Weekly restart window + nightly card-archival script",
    produces: "Pre-flight checklist, then a post-run validation verdict per VM",
    monthlyCalls: 34,
    model: "claude-opus-5",
    effort: "low",
    lastAction: "5 VMs restarted + curl checks green by 02:41",
    confidence: 97,
    sowClause: "§4.7",
  },
  {
    key: "deploy_preflight",
    name: "Deployment Pre-flight Agent",
    tower: "D — DevOps & CI/CD",
    tier: "scheduled",
    status: "active",
    trigger: "Each release, before the 02:00-05:00 window opens",
    produces: "Release class (A/B/C), go/no-go, the Magaz command set and the rollback plan",
    monthlyCalls: 12,
    model: "claude-opus-5",
    effort: "xhigh",
    lastAction: "magento-release-r48 classified Class A — deployed with 0 errors",
    confidence: 87,
    sowClause: "§4.6",
  },
  {
    key: "memory_curator",
    name: "Memory Curator",
    tower: "Cross-cutting",
    tier: "scheduled",
    status: "active",
    trigger: "Nightly, over the day's resolved FreshService tickets",
    produces: "New or updated Memory entries, linked back to the source ticket",
    monthlyCalls: 30,
    model: "claude-opus-5",
    effort: "xhigh",
    lastAction: "Curated 6 resolved tickets into 2 new patterns, 4 reinforcements",
    confidence: 92,
    sowClause: "§4.10",
  },
  {
    key: "finops_digest",
    name: "FinOps Digest Agent",
    tower: "G — FinOps",
    tier: "scheduled",
    status: "active",
    trigger: "1st and 15th of each month",
    produces: "Draft bi-monthly cost report with narratives and right-sizing recommendations",
    monthlyCalls: 2,
    model: "claude-opus-5",
    effort: "xhigh",
    lastAction: "Drafted the 15 Sep report; storage egress anomaly flagged as lead item",
    confidence: 90,
    sowClause: "§4.9",
  },
  {
    key: "wellness_review",
    name: "Monthly Wellness / CAB Pack",
    tower: "Governance",
    tier: "scheduled",
    status: "idle",
    trigger: "Monthly, ahead of the wellness review",
    produces: "SLA adherence, incident trends, repeat-incident rate, open risks",
    monthlyCalls: 1,
    model: "claude-opus-5",
    effort: "xhigh",
    lastAction: "Next run 1 Oct",
    confidence: 88,
    sowClause: "§3.1",
  },
  {
    key: "sop_advisor",
    name: "SOP Advisor",
    tower: "Cross-cutting",
    tier: "on_demand",
    status: "active",
    trigger: "An engineer opens a ticket and asks what to run",
    produces: "The exact runbook for this ticket, parameterised to the affected resource",
    monthlyCalls: 200,
    model: "claude-opus-5",
    effort: "high",
    lastAction: "Returned the Redis pre-warm runbook for SS-4469",
    confidence: 90,
    sowClause: "§4.10",
  },
  {
    key: "change_risk_scorer",
    name: "Change Risk Scorer",
    tower: "D — DevOps",
    tier: "on_demand",
    status: "active",
    trigger: "Every change request raised in FreshService",
    produces: "Risk score with the Memory precedent, and the guardrails it trips",
    monthlyCalls: 60,
    model: "claude-opus-5",
    effort: "high",
    lastAction: "SS-4468 (PITR enable) scored Medium — cost impact needs Client sign-off",
    confidence: 88,
    sowClause: "§4.6",
  },
  {
    key: "incident_commander",
    name: "Incident Commander",
    tower: "Cross-cutting",
    tier: "on_demand",
    status: "idle",
    trigger: "Any P1, or a P2 that escalates",
    produces: "Running incident timeline, correlated Memory, next step, and a drafted RCA",
    monthlyCalls: 24,
    model: "claude-opus-5",
    effort: "xhigh",
    lastAction: "Last engaged 2d ago — checkout cascade, RCA drafted",
    confidence: 93,
    sowClause: "§7.1",
  },
  {
    key: "schema_dependency_map",
    name: "MySQL 8.4 Dependency Mapper",
    tower: "C — Database",
    tier: "on_demand",
    status: "active",
    trigger: "Per schema change, and for the 8.4 upgrade programme",
    produces: "Which services break if this schema changes, plus the expand/contract plan",
    monthlyCalls: 20,
    model: "claude-opus-5",
    effort: "xhigh",
    lastAction: "Mapped orders-table dependencies across Magento, SSO, Keycloak and CMS",
    confidence: 85,
    sowClause: "§4.5",
  },
  {
    key: "presale_readiness",
    name: "Pre-Sale Readiness Agent",
    tower: "Cross-cutting",
    tier: "on_demand",
    status: "active",
    trigger: "On the Client's 48h sale-event notice",
    produces: "Go/no-go: node headroom vs expected load, DB headroom, blast-radius findings",
    monthlyCalls: 10,
    model: "claude-opus-5",
    effort: "xhigh",
    lastAction: "Festive assessment: CONDITIONAL GO — pre-scale required",
    confidence: 89,
    sowClause: "§7.2",
  },
  {
    key: "compliance_reporter",
    name: "Compliance Reporter",
    tower: "F — Cloud Security",
    tier: "on_demand",
    status: "idle",
    trigger: "On request — PCI-DSS, ISO 27001, CIS, NIST CSF",
    produces: "Framework report with live findings as evidence",
    monthlyCalls: 4,
    model: "claude-opus-5",
    effort: "xhigh",
    lastAction: "PCI-DSS v4.0 report generated 4d ago",
    confidence: 91,
    sowClause: "§4.8",
  },
];

const WORK_PACKETS: WorkPacket[] = [
  {
    id: "wp-1",
    agentKey: "security_triage",
    agentName: "Security Finding Triage Agent",
    subject: "Keycloak 22.0.1 authentication-bypass CVEs on the live ss.com auth path",
    summary:
      "Keycloak on the production cluster carries known authentication-bypass CVEs and sits on the live ss.com login path.",
    sowPriority: "P2",
    confidence: 86,
    memoryContext:
      "Ranked above 6 higher-CVSS findings because those sit in non-production. SOW §4.8 puts Keycloak upgrade assistance in scope; §9 item 8 leaves the replacement auth service unconfirmed — that decision should not gate patching a live CVE.",
    recommendedAction: "escalate",
    sopSteps: [
      {
        step: 1,
        action: "Confirm the running Keycloak image digest",
        command:
          "kubectl -n sso get deploy keycloak -o jsonpath='{.spec.template.spec.containers[0].image}'",
        expected: "Returns a 22.0.x tag confirming the vulnerable version",
      },
      {
        step: 2,
        action: "Rehearse the upgrade in UAT first",
        command: "kubectl -n sso set image deploy/keycloak keycloak=quay.io/keycloak/keycloak:26.0 --context=uat",
        expected: "UAT realm imports cleanly and SSO login succeeds end to end",
      },
      {
        step: 3,
        action: "Raise a CAB change for the production window",
        command: "# FreshService > Changes > New — attach UAT evidence from step 2",
        expected: "Change approved for the 02:00-05:00 window",
      },
    ],
    rollback:
      "kubectl -n sso rollout undo deploy/keycloak — realm config is backed up ahead of the change; sessions drop but re-auth succeeds on the prior version.",
    requiresClientApproval: true,
    ticketId: 4475,
    ticketStatus: "Open",
    raisedAt: "3h ago",
  },
  {
    id: "wp-2",
    agentKey: "gke_health",
    agentName: "GKE Health Agent",
    subject: "Production node pool at 81% memory with the festive window approaching",
    summary:
      "ss-ecom-prod-cluster node pool is at 81% memory with two nodes of autoscale headroom, ahead of a declared sale event.",
    sowPriority: "P2",
    confidence: 93,
    memoryContext:
      "The ss.com cascade always starts at the checkout route, and reactive autoscale runs 6–8 minutes too slow. Pre-scaling 2 nodes ahead of the push contained it 4 times out of 4.",
    recommendedAction: "execute_sop",
    sopSteps: [
      {
        step: 1,
        action: "Confirm current node count and utilisation",
        command: "kubectl top nodes --context=ss-ecom-prod-cluster",
        expected: "9 nodes, memory around 81%",
      },
      {
        step: 2,
        action: "Pre-scale the node pool ahead of the sale window",
        command:
          "gcloud container clusters resize ss-ecom-prod-cluster --node-pool=default-pool --num-nodes=11 --zone=asia-south1-a",
        expected: "11 nodes Ready within 4 minutes; memory drops to ~66%",
      },
      {
        step: 3,
        action: "Verify checkout latency is unchanged",
        command: "curl -s -o /dev/null -w '%{time_total}' https://ss.com/checkout/health",
        expected: "Under 400ms, consistent with the pre-change baseline",
      },
    ],
    rollback:
      "Resize back to 9 nodes after the sale window closes. No data risk — this is a capacity change only.",
    requiresClientApproval: true,
    ticketId: 4474,
    ticketStatus: "Pending",
    raisedAt: "6h ago",
  },
  {
    id: "wp-3",
    agentKey: "db_health",
    agentName: "Database Health Agent",
    subject: "ss-magento-db-01 connections projected to reach max in 9 days",
    summary:
      "Connections at 361/500 and growing ~14%/week between releases. Raised now as P3 so it lands in a maintenance window.",
    sowPriority: "P3",
    confidence: 94,
    memoryContext:
      "This growth is linear and predictable on this instance. The prior reactive occurrence took 31 minutes to clear at 03:00. Raising early converts a P1 into planned work.",
    recommendedAction: "execute_sop",
    sopSteps: [
      {
        step: 1,
        action: "Identify sessions idle beyond 10 minutes",
        command:
          "SELECT id, user, host, time, state FROM information_schema.processlist WHERE command='Sleep' AND time > 600;",
        expected: "Returns the long-lived Magento reporting connections",
      },
      {
        step: 2,
        action: "Reap the idle sessions inside the maintenance window",
        command: "CALL mysql.rds_kill(<id>);  -- repeat per id from step 1",
        expected: "Connection count drops below 300",
      },
    ],
    rollback:
      "None required — killing idle sessions is non-destructive; the application reconnects automatically. Do not raise max_connections as a substitute: that treats the symptom and the app-side leak stays open.",
    requiresClientApproval: false,
    ticketId: 4473,
    ticketStatus: "Open",
    raisedAt: "1d ago",
  },
  {
    id: "wp-4",
    agentKey: "alert_triage",
    agentName: "Alert Triage Agent",
    subject: "ss-nitrogen-lb-prod egress 3.1σ above baseline",
    summary: "Egress spike matched the scheduled catalogue feed export. Closed without paging.",
    sowPriority: "P4",
    confidence: 91,
    memoryContext:
      "Signature matched the catalogue export seen 4 times in 90 days, all benign. Source subnet matched the export job, not the payment path. Threshold rebaselined rather than re-alerting.",
    recommendedAction: "suppress",
    sopSteps: [],
    rollback: "",
    requiresClientApproval: false,
    ticketId: 0,
    ticketStatus: "Suppressed",
    raisedAt: "12h ago",
  },
];

/** Fleet-level sizing. Mirrors app/agents/cost_model.py. */
const FLEET_SUMMARY = {
  agentCount: AGENTS.length,
  monthlyCalls: AGENTS.reduce((sum, a) => sum + a.monthlyCalls, 0),
  apiSurfaces: 1,
  monthlyUsd: 161.28,
  monthlyInr: 14193,
  cloudSpendShare: "1.3% of cloud spend",
  models: [
    { name: "All agents on claude-opus-5 (current)", usd: 161.28, selected: true },
    { name: "Streaming on Sonnet 5, reasoning on Opus 5", usd: 94.55, selected: false },
    { name: "All agents on claude-sonnet-5", usd: 64.51, selected: false },
    { name: "All agents on claude-haiku-4-5", usd: 32.26, selected: false },
  ],
};

const data: Record<string, unknown> = {
  "/agents": AGENTS,
  "/agents/work-packets": WORK_PACKETS,
  "/agents/fleet-summary": FLEET_SUMMARY,
};

export default data;
