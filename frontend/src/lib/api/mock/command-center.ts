/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Command Center seed data (per-customer)          */
/*  Keyed first by org name, then by endpoint path.                    */
/*  apiFetch() is bypassed on the Command Center page — the page does  */
/*  a direct lookup using the org-switcher state.                      */
/* ------------------------------------------------------------------ */

export type CustomerKey =
  | "All Organizations"
  | "Netcore"
  | "Aarti Industries"
  | "ShoppersStop"
  | "DesignX"
  | "PayNimbus"
  | "Kiranakart"
  | "MediSetu"
  | "ShipEasy";

export interface OpsScore {
  pillar: string;
  score: number | null;
  status: "healthy" | "warning" | "critical" | "active";
  note: string;
}

export interface AttentionItem {
  severity: "red" | "amber" | "blue";
  pillar: string;
  title: string;
  memory: string;
}

export interface ChangeItem {
  pillar: string;
  detail: string;
}

export interface MemoryPatternRow {
  pattern: string;
  firstSeen: string;
  occurrences: number;
  lastResolution: string;
  confidence: number;
}

export interface CsreActivityItem {
  label: string;
  value: string;
}

export interface CustomerSnapshot {
  scores: OpsScore[];
  attention: AttentionItem[];
  changes: ChangeItem[];
  patterns: MemoryPatternRow[];
  workingWell: string[];
  csreActivity: CsreActivityItem[];
  timeline: number[];
  incidentSummary: string;
}

/* ── All Organizations (aggregate view) ──────────────────────────── */
const allOrgs: CustomerSnapshot = {
  scores: [
    { pillar: "CloudOps", score: 91, status: "healthy", note: "" },
    { pillar: "FinOps", score: 76, status: "warning", note: "2 cost anomalies active" },
    { pillar: "Cloud Security", score: 84, status: "warning", note: "14 open critical findings" },
    { pillar: "DevOps", score: 94, status: "healthy", note: "" },
    { pillar: "AIOps", score: null, status: "active", note: "5 agents running" },
  ],
  attention: [
    {
      severity: "red",
      pillar: "Cloud Security",
      title: "Aarti Industries — 5 security groups allow SSH from internet (CIS 5.2)",
      memory:
        "Memory: identical finding auto-remediated across 3 Aarti accounts on Jul 12 → restrict to VPN CIDR 10.0.0.0/8. Auto-fix confidence 96%. One-click remediation ready — audit-critical for their pharma compliance.",
    },
    {
      severity: "amber",
      pillar: "FinOps",
      title: "Netcore — BigQuery cost spike +340% in last 4h",
      memory:
        "Memory: matches the Jul 15 ETL spike pattern (unoptimized JOIN on a 2TB table, missing partition filter). Root cause + fix already known — flagged in 12 min, not days. Same fix cut $42/run last time.",
    },
    {
      severity: "amber",
      pillar: "CloudOps",
      title: "ShoppersStop — production GKE node pool at 81% memory before the festive window",
      memory:
        "Memory: the ss.com cascade always starts at the checkout route, and reactive autoscale runs 6–8 min too slow. Pre-scaling 2 nodes ahead of the push contained it 4 times out of 4. Recommendation raised, awaiting Client approval.",
    },
    {
      severity: "blue",
      pillar: "DevOps",
      title: "DesignX — deploy-bot granted project Editor (risky IAM change)",
      memory:
        "Memory: on May 9 an Editor grant to a CI bot led to a privilege-escalation finding. Pre-deploy guardrail flagged this change and suggested a custom least-privilege role before it shipped.",
    },
    {
      severity: "amber",
      pillar: "Cloud Security",
      title: "PayNimbus — admin access key unused for 94 days",
      memory:
        "Memory: prior key-rotation remediation on 2 fintech accounts. Recommend rotate + scope-down; PCI-DSS evidence auto-attached to the ticket.",
    },
  ],
  changes: [
    { pillar: "CloudOps", detail: "61 resources across 8 accounts. 3 auto-scaled, 1 incident resolved (ShipEasy Redis)." },
    { pillar: "FinOps", detail: "₹18.4L total spend this month. 2 anomalies active (Netcore BigQuery, MediSetu GKE)." },
    { pillar: "Cloud Security", detail: "427 total findings across all accounts. 14 critical. Posture improved 2pts for Kiranakart." },
    { pillar: "DevOps", detail: "112 deployments across 8 customers. 2 failures (PayNimbus staging). Patch compliance 73% fleet-wide." },
    { pillar: "AIOps", detail: "2,341 tokens used today. 5 auto-remediations triggered, 4 successful." },
  ],
  patterns: [
    { pattern: "CPU spike before auto-scale", firstSeen: "45d ago", occurrences: 11, lastResolution: "Right-size + load balance", confidence: 94 },
    { pattern: "BigQuery ETL cost spike", firstSeen: "30d ago", occurrences: 5, lastResolution: "Query optimization", confidence: 88 },
    { pattern: "SSH security group creation", firstSeen: "60d ago", occurrences: 17, lastResolution: "Auto-remediation script", confidence: 96 },
    { pattern: "Connection pool exhaustion", firstSeen: "21d ago", occurrences: 3, lastResolution: "Pool size increase", confidence: 82 },
    { pattern: "Friday deployment failures", firstSeen: "90d ago", occurrences: 8, lastResolution: "Pre-deploy validation", confidence: 91 },
  ],
  workingWell: [
    "Kiranakart — order-service CPU predicted to breach at dinner peak; AIOps agent auto-scaled 6 min early. Zero downtime.",
    "MediSetu — idle GKE node pools + oversized Cloud SQL right-sized. 18% GCP savings, compliance retained.",
    "ShipEasy — dispatch latency root-caused in seconds: Memory correlated Redis connection-pool exhaustion; pool increased.",
    "MTTR improved 22% vs last month (13 min avg) across the managed book.",
    "5 auto-remediations succeeded without human intervention this week.",
  ],
  csreActivity: [
    { label: "Last review", value: "2h ago — Netcore & Aarti by Searce CSRE" },
    { label: "Next scheduled review", value: "Tomorrow 10:00 AM IST — ShoppersStop festive readiness" },
    { label: "Open tickets", value: "6 across 5 accounts" },
    { label: "Recommendations applied this month", value: "14 across 8 accounts" },
    { label: "Estimated savings from recommendations", value: "₹7.8L/mo across the book" },
  ],
  timeline: [0, 0, 1, 1, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 2, 0, 0, 0, 1],
  incidentSummary: "5 incidents in 30d · 99.91% uptime · 72 min total downtime",
};

/* ── Netcore ─────────────────────────────────────────────────────── */
const netcore: CustomerSnapshot = {
  scores: [
    { pillar: "CloudOps", score: 97, status: "healthy", note: "" },
    { pillar: "FinOps", score: 61, status: "warning", note: "BigQuery ETL spike +340%" },
    { pillar: "Cloud Security", score: 91, status: "healthy", note: "" },
    { pillar: "DevOps", score: 98, status: "healthy", note: "" },
    { pillar: "AIOps", score: null, status: "active", note: "2 agents running" },
  ],
  attention: [
    {
      severity: "red",
      pillar: "FinOps",
      title: "BigQuery cost spike +340% in the last 4 hours — ETL job on analytics-prod",
      memory:
        "Memory: matches the Jul 15 spike exactly — unoptimized JOIN on a 2TB table without a partition filter. Root cause already known. Same fix cut $42/run. Auto-remediation confidence: 88%. One-click optimization queued.",
    },
    {
      severity: "amber",
      pillar: "FinOps",
      title: "Dataflow pipeline backlog growing — 3.2M unprocessed events",
      memory:
        "Memory: on Aug 3 a similar backlog was caused by a Pub/Sub retention misconfiguration. Confidence 74% — check retention settings before scaling workers.",
    },
    {
      severity: "blue",
      pillar: "CloudOps",
      title: "New GKE node pool requested — email-service team",
      memory:
        "Memory: email-service requested a new pool 3 times in the past 90 days. Prior analysis shows vertical scaling solved 2 of 3 cases at 60% lower cost. Suggest right-size review before approval.",
    },
  ],
  changes: [
    { pillar: "CloudOps", detail: "12 GKE pods stable, 0 restarts. 2 Cloud SQL read replicas added this week." },
    { pillar: "FinOps", detail: "₹3.1L spend MTD. BigQuery now 34% of total — anomaly flag active. CUD coverage at 67%." },
    { pillar: "Cloud Security", detail: "No new critical findings. Last pen-test remediation closed 8d ago." },
    { pillar: "DevOps", detail: "31 deployments this week, 0 failures. Release pipeline p95 latency: 4.2 min." },
    { pillar: "AIOps", detail: "481 tokens today. 1 auto-remediation (Dataflow backlog alert suppressed — false positive confirmed)." },
  ],
  patterns: [
    { pattern: "BigQuery ETL cost spike", firstSeen: "30d ago", occurrences: 3, lastResolution: "Add partition filter to JOIN", confidence: 88 },
    { pattern: "Pub/Sub retention drift", firstSeen: "47d ago", occurrences: 2, lastResolution: "Reset retention to 7d", confidence: 74 },
    { pattern: "GKE node pool churn", firstSeen: "60d ago", occurrences: 3, lastResolution: "Vertical scaling instead", confidence: 81 },
    { pattern: "CUD expiry cost bump", firstSeen: "90d ago", occurrences: 1, lastResolution: "Renew 1-yr commitment early", confidence: 79 },
  ],
  workingWell: [
    "Cloud Run services auto-scaled smoothly across the last 3 traffic surges — zero cold-start latency impact.",
    "CUD coverage improved from 51% → 67% this quarter after Memory-recommended renewal. Saves ₹48K/mo.",
    "Security posture score: 91 — highest in the book. Last SCC finding resolved in 6 hours.",
    "DevOps pipeline fully automated — 31 deploys this week with zero human gates needed.",
  ],
  csreActivity: [
    { label: "Last review", value: "2h ago — Cost anomaly triage with CSRE FinOps lead" },
    { label: "Next scheduled review", value: "Friday 3:00 PM IST — Monthly cost optimisation review" },
    { label: "Open tickets", value: "1 (BigQuery ETL optimization — in progress)" },
    { label: "Recommendations applied this month", value: "3 (CUD renewal, Dataflow scaling, SCC remediations)" },
    { label: "Estimated savings from recommendations", value: "₹1.2L/mo" },
  ],
  timeline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0],
  incidentSummary: "1 incident in 30d · 99.98% uptime · 8 min total downtime",
};

/* ── Aarti Industries ─────────────────────────────────────────────── */
const aarti: CustomerSnapshot = {
  scores: [
    { pillar: "CloudOps", score: 88, status: "healthy", note: "" },
    { pillar: "FinOps", score: 82, status: "healthy", note: "" },
    { pillar: "Cloud Security", score: 52, status: "critical", note: "5 critical CIS violations" },
    { pillar: "DevOps", score: 79, status: "warning", note: "patch compliance 61%" },
    { pillar: "AIOps", score: null, status: "active", note: "1 agent running" },
  ],
  attention: [
    {
      severity: "red",
      pillar: "Cloud Security",
      title: "5 security groups allow SSH from the internet — pharma audit risk (CIS 5.2)",
      memory:
        "Memory: identical finding auto-remediated across 3 Aarti accounts on Jul 12 → restrict to VPN CIDR 10.0.0.0/8. Auto-fix confidence 96%. Audit-critical — pharma compliance review scheduled next month. One-click remediation ready.",
    },
    {
      severity: "red",
      pillar: "Cloud Security",
      title: "S3 bucket 'aarti-mfg-raw' is publicly accessible — contains production schemas",
      memory:
        "Memory: first occurrence — no prior pattern match. Immediate action recommended. Block public access + enable bucket policy check in SCC.",
    },
    {
      severity: "amber",
      pillar: "DevOps",
      title: "31 VMs more than 30 days behind on OS patches — including 4 in the ERP subnet",
      memory:
        "Memory: Aarti patch compliance dipped to 58% in March before remediation. ERP subnet VMs require maintenance window co-ordination with their IT team — last window was Apr 14.",
    },
  ],
  changes: [
    { pillar: "CloudOps", detail: "19 VMs stable. 1 GCS transfer job failed overnight — retry succeeded." },
    { pillar: "FinOps", detail: "₹2.4L spend MTD. On track. Storage costs up 9% (raw data archive growth expected)." },
    { pillar: "Cloud Security", detail: "SCC posture dropped from 68 → 52. 5 new SSH group findings. 1 public bucket." },
    { pillar: "DevOps", detail: "14 deployments, 1 failure (ERP staging — config drift). Patch compliance 61%." },
    { pillar: "AIOps", detail: "217 tokens today. Security posture alert triggered and routed to CSRE." },
  ],
  patterns: [
    { pattern: "SSH security group creation", firstSeen: "60d ago", occurrences: 8, lastResolution: "Auto-remediation to VPN CIDR", confidence: 96 },
    { pattern: "Patch compliance drift", firstSeen: "45d ago", occurrences: 4, lastResolution: "Maintenance window + auto-patch", confidence: 87 },
    { pattern: "GCS transfer failure", firstSeen: "22d ago", occurrences: 3, lastResolution: "Retry with exponential backoff", confidence: 78 },
    { pattern: "ERP config drift on deploy", firstSeen: "30d ago", occurrences: 2, lastResolution: "Drift detection + config lock", confidence: 83 },
  ],
  workingWell: [
    "GCS to BigQuery transfer pipeline rebuilt — 3 successful nightly runs with zero data loss.",
    "CloudOps score stable at 88 — VM fleet healthy despite security posture dip.",
    "FinOps on track — storage growth expected and within budget.",
    "CSRE raised security alert proactively — 3 days before Aarti's internal audit cycle.",
  ],
  csreActivity: [
    { label: "Last review", value: "4h ago — Security incident triage (SSH + public bucket)" },
    { label: "Next scheduled review", value: "Tomorrow 9:00 AM IST — Emergency security remediation session" },
    { label: "Open tickets", value: "3 (SSH groups x5, public bucket, patch backlog)" },
    { label: "Recommendations applied this month", value: "2 (GCS retry policy, CUD for compute)" },
    { label: "Estimated savings from recommendations", value: "₹42K/mo" },
  ],
  timeline: [0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 2],
  incidentSummary: "4 incidents in 30d · 99.82% uptime · 37 min total downtime",
};

/* ── ShoppersStop ────────────────────────────────────────────────── */
/*
 * Live tenant. Every item traces to the eCommerce Cloud Managed
 * Services SOW (v1.0, effective 1 Oct 2026): 7 GCP projects, 3 GKE
 * clusters, 5 Cloud SQL MySQL instances and 5 Windows VMs across
 * seven service towers. Detail lives in ./shoppersstop-env.ts.
 */
const shoppersStop: CustomerSnapshot = {
  scores: [
    { pillar: "CloudOps", score: 74, status: "warning", note: "node pool 81% before sale window" },
    { pillar: "FinOps", score: 79, status: "warning", note: "storage egress anomaly active" },
    { pillar: "Cloud Security", score: 81, status: "warning", note: "Keycloak CVE on live auth path" },
    { pillar: "DevOps", score: 88, status: "healthy", note: "11 releases, 0 window breaches" },
    { pillar: "AIOps", score: null, status: "active", note: "7 agents — one per tower" },
  ],
  attention: [
    {
      severity: "red",
      pillar: "Cloud Security",
      title: "Keycloak 22.0.1 authentication-bypass CVEs on the live ss.com auth path",
      memory:
        "Memory: ranked above 6 higher-CVSS findings because those sit in non-production. SOW §4.8 puts Keycloak upgrade assistance in scope; §9 item 8 leaves the replacement auth service unconfirmed — that decision should not gate patching a live CVE.",
    },
    {
      severity: "amber",
      pillar: "CloudOps",
      title: "Production node pool at 81% memory with the festive window approaching",
      memory:
        "Memory: the ss.com cascade always starts at the checkout route, and reactive autoscale runs 6–8 minutes too slow. Pre-scaling 2 nodes ahead of the push contained it 4 times out of 4. Recommendation raised, awaiting Client approval per SOW §3.2.",
    },
    {
      severity: "amber",
      pillar: "FinOps",
      title: "Campaign creative served from the bucket instead of the CDN — ≈₹48K overspend",
      memory:
        "Memory: identical to the August campaign. The CMS template still carries direct bucket URLs — same template, same line. Repointing at the CDN origin cut egress 78% within two hours last time.",
    },
    {
      severity: "blue",
      pillar: "CloudOps",
      title: "MySQL 8.0.37 → 8.4 required across all 5 instances before December 2026",
      memory:
        "Memory: a contractual deadline [SOW §4.5], not a recommendation. The dependency map matters more than the upgrade — Magento, SSO, Keycloak and CMS all touch the auth path. UAT rehearsal is scheduled; both 90-day deploy failures carried schema changes.",
    },
  ],
  changes: [
    { pillar: "CloudOps", detail: "Node pool scaled 7 → 9 ahead of the push. Autopilot eviction self-resolved in 90s. 5 Windows VMs restarted per SOP." },
    { pillar: "FinOps", detail: "₹11.2L MTD across 7 projects. Storage egress anomaly active. UAT scale-to-zero now saving ₹31K/mo." },
    { pillar: "Cloud Security", detail: "Keycloak CVE escalated to L2. TLS secret for ss.com expires in 24 days. WAF refreshed for festive signatures." },
    { pillar: "DevOps", detail: "magento-release-r48 deployed 02:14 with Magaz restart, 0 errors. All 11 releases inside the 02:00–05:00 window." },
    { pillar: "AIOps", detail: "7 agents active, 214 items auto-resolved at L1 this month. 148 engineer-hours saved against baseline." },
  ],
  patterns: [
    { pattern: "Autopilot pod eviction (benign)", firstSeen: "90d ago", occurrences: 11, lastResolution: "Log only, never page", confidence: 95 },
    { pattern: "Windows VM memory creep", firstSeen: "90d ago", occurrences: 5, lastResolution: "Restart forward into window", confidence: 79 },
    { pattern: "Checkout cascade under burst", firstSeen: "75d ago", occurrences: 4, lastResolution: "Pre-scale node pool", confidence: 93 },
    { pattern: "Catalogue export egress false positive", firstSeen: "60d ago", occurrences: 4, lastResolution: "Rebaseline by source subnet", confidence: 91 },
    { pattern: "Magento connection-pool growth", firstSeen: "60d ago", occurrences: 3, lastResolution: "Reap idle connections", confidence: 88 },
    { pattern: "Schema-bearing release rollback", firstSeen: "56d ago", occurrences: 2, lastResolution: "UAT rehearsal first", confidence: 86 },
  ],
  workingWell: [
    "All 11 releases in 90 days ran inside the 02:00–05:00 window. Zero window breaches.",
    "Autopilot evictions no longer page anyone — 11 occurrences absorbed at L1, removing a recurring source of overnight noise.",
    "The checkout cascade was contained before user impact: 9 min response, 22 min resolution, both inside the P1 SLO.",
    "UAT scale-to-zero and SUD consolidation are now saving ₹43.8K/mo with no impact on the test window.",
  ],
  csreActivity: [
    { label: "Last review", value: "1h ago — Festive readiness check by CSRE CloudOps lead" },
    { label: "Next scheduled review", value: "Monthly wellness / CAB — with Subhasish Mishra (eCommerce Infrastructure Lead)" },
    { label: "Open tickets", value: "4 (Keycloak CVE, node pre-scale, storage egress, PITR on ss-ops-db-01)" },
    { label: "Recommendations applied this month", value: "3 applied, 3 available (₹1.06L/mo unactioned)" },
    { label: "Engineer-hours saved by AI this month", value: "148 hrs against a 420 hr baseline" },
  ],
  timeline: [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
  incidentSummary: "5 incidents in 30d · 99.94% uptime · 1 P1 (22 min), all inside SLO",
};

/* ── DesignX ─────────────────────────────────────────────────────── */
const designX: CustomerSnapshot = {
  scores: [
    { pillar: "CloudOps", score: 96, status: "healthy", note: "" },
    { pillar: "FinOps", score: 91, status: "healthy", note: "" },
    { pillar: "Cloud Security", score: 79, status: "warning", note: "IAM drift detected" },
    { pillar: "DevOps", score: 85, status: "healthy", note: "" },
    { pillar: "AIOps", score: null, status: "active", note: "1 agent running" },
  ],
  attention: [
    {
      severity: "blue",
      pillar: "DevOps",
      title: "deploy-bot granted project Editor role — risky IAM change pre-deploy",
      memory:
        "Memory: on May 9 an Editor grant to a CI bot led to a privilege-escalation finding on a client project. Pre-deploy guardrail flagged this. Recommended: create a custom role with only the 14 permissions deploy-bot actually needs. Template ready.",
    },
    {
      severity: "amber",
      pillar: "Cloud Security",
      title: "3 service accounts with owner-level permissions — not in use for 60+ days",
      memory:
        "Memory: first IAM hygiene scan for DesignX. Common pattern for agency accounts where client projects proliferate. Recommend deactivate + transfer to per-project service accounts. Confidence: 88%.",
    },
  ],
  changes: [
    { pillar: "CloudOps", detail: "7 Cloud Run services stable. 1 new Cloud Functions deployment (client asset pipeline)." },
    { pillar: "FinOps", detail: "₹68K spend MTD. Lowest in the book — efficient serverless-first architecture." },
    { pillar: "Cloud Security", detail: "IAM audit surfaced 3 over-privileged service accounts and 1 deploy-bot scope issue." },
    { pillar: "DevOps", detail: "18 deployments across 4 client projects. 1 deploy-bot IAM flag. Otherwise clean." },
    { pillar: "AIOps", detail: "94 tokens today. IAM risk scoring completed for all service accounts." },
  ],
  patterns: [
    { pattern: "Over-privileged CI bot", firstSeen: "45d ago", occurrences: 2, lastResolution: "Custom least-privilege role", confidence: 88 },
    { pattern: "Stale service accounts", firstSeen: "30d ago", occurrences: 3, lastResolution: "Deactivate + per-project SA", confidence: 85 },
    { pattern: "Client project IAM drift", firstSeen: "60d ago", occurrences: 4, lastResolution: "IAM policy constraint", confidence: 79 },
  ],
  workingWell: [
    "Serverless-first architecture: lowest cost in the book at ₹68K/mo — Cloud Run scales to zero overnight.",
    "Cloud Security posture at 79 and improving — first full IAM audit completed this week.",
    "CloudOps score 96 — no incidents this month.",
    "18 client project deployments with 0 failures — strong DevOps maturity for an agency.",
  ],
  csreActivity: [
    { label: "Last review", value: "Yesterday — Quarterly IAM hygiene audit" },
    { label: "Next scheduled review", value: "Next Monday 11:00 AM IST — IAM remediation walk-through" },
    { label: "Open tickets", value: "2 (deploy-bot role, stale service accounts)" },
    { label: "Recommendations applied this month", value: "3 (Cloud Run config, billing export, IAM constraint)" },
    { label: "Estimated savings from recommendations", value: "₹12K/mo" },
  ],
  timeline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  incidentSummary: "0 incidents in 30d · 100% uptime · 0 min total downtime",
};

/* ── PayNimbus ───────────────────────────────────────────────────── */
const payNimbus: CustomerSnapshot = {
  scores: [
    { pillar: "CloudOps", score: 93, status: "healthy", note: "" },
    { pillar: "FinOps", score: 86, status: "healthy", note: "" },
    { pillar: "Cloud Security", score: 67, status: "warning", note: "PCI-DSS gap detected" },
    { pillar: "DevOps", score: 88, status: "healthy", note: "" },
    { pillar: "AIOps", score: null, status: "active", note: "2 agents running" },
  ],
  attention: [
    {
      severity: "amber",
      pillar: "Cloud Security",
      title: "Admin access key unused for 94 days — PCI-DSS Requirement 8.2.6 violation",
      memory:
        "Memory: same pattern remediated for 2 other fintech accounts in June. Rotate + scope-down to read-only for the service it's attached to. PCI-DSS audit evidence auto-attached to ticket. Compliance deadline: 14 days.",
    },
    {
      severity: "red",
      pillar: "Cloud Security",
      title: "Payment processing subnet exposes port 8080 to 0.0.0.0/0",
      memory:
        "Memory: first occurrence. Fintech-critical. Port 8080 should only be reachable from the load balancer subnet. Immediate remediation required before PCI-DSS assessor visit scheduled for next week.",
    },
    {
      severity: "amber",
      pillar: "DevOps",
      title: "Staging deploy failed 2× — secrets rotation not reflected in config map",
      memory:
        "Memory: this exact pattern occurred on Aug 18 — GCP Secret Manager rotation didn't propagate to the K8s config map automatically. Fix: enable auto-sync with External Secrets Operator. Confidence: 91%.",
    },
  ],
  changes: [
    { pillar: "CloudOps", detail: "Payment APIs 99.99% uptime this month. 3 GKE pod restarts (all benign OOM on ML scoring service)." },
    { pillar: "FinOps", detail: "₹1.6L spend MTD. Stable. ML scoring service is the top cost driver at 31%." },
    { pillar: "Cloud Security", detail: "PCI-DSS gap: 1 port exposure (payment subnet) + 1 stale access key. Assessor visit in 7 days." },
    { pillar: "DevOps", detail: "24 deploys this month. 2 staging failures (secrets sync). Production unaffected." },
    { pillar: "AIOps", detail: "612 tokens today. PCI compliance monitoring agent active — last scan 4h ago." },
  ],
  patterns: [
    { pattern: "Stale access key (fintech)", firstSeen: "90d ago", occurrences: 3, lastResolution: "Rotate + scope-down", confidence: 94 },
    { pattern: "K8s secrets sync failure", firstSeen: "30d ago", occurrences: 2, lastResolution: "External Secrets Operator", confidence: 91 },
    { pattern: "Payment subnet port exposure", firstSeen: "7d ago", occurrences: 1, lastResolution: "Firewall rule correction", confidence: 97 },
    { pattern: "OOM on ML scoring service", firstSeen: "21d ago", occurrences: 3, lastResolution: "Memory limit increase", confidence: 76 },
  ],
  workingWell: [
    "Payment API uptime: 99.99% this month — well within SLA for their fintech customers.",
    "PCI-DSS compliance monitoring agent flagged the port exposure 7 days before the assessor visit.",
    "ML fraud scoring model serving with no production incidents — model refresh pipeline automated.",
    "Cost stable at ₹1.6L despite 40% transaction volume growth — efficient horizontal scaling.",
  ],
  csreActivity: [
    { label: "Last review", value: "3h ago — PCI-DSS pre-assessment remediation triage" },
    { label: "Next scheduled review", value: "In 2 days — PCI remediation completion sign-off" },
    { label: "Open tickets", value: "3 (port exposure, stale key, secrets sync)" },
    { label: "Recommendations applied this month", value: "5 (ML scaling, secrets operator, firewall rules, CUD)" },
    { label: "Estimated savings from recommendations", value: "₹34K/mo" },
  ],
  timeline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  incidentSummary: "2 incidents in 30d · 99.97% uptime · 14 min total downtime",
};

/* ── Kiranakart ──────────────────────────────────────────────────── */
const kiranakart: CustomerSnapshot = {
  scores: [
    { pillar: "CloudOps", score: 98, status: "healthy", note: "" },
    { pillar: "FinOps", score: 84, status: "healthy", note: "" },
    { pillar: "Cloud Security", score: 88, status: "healthy", note: "" },
    { pillar: "DevOps", score: 95, status: "healthy", note: "" },
    { pillar: "AIOps", score: null, status: "active", note: "2 agents running" },
  ],
  attention: [
    {
      severity: "blue",
      pillar: "CloudOps",
      title: "order-service CPU predicted to breach 80% threshold at 7:30 PM dinner peak",
      memory:
        "Memory: this exact pattern has occurred 4× before dinner peaks. AIOps agent pre-scaled 6 min early each time — zero downtime. Confidence: 94%. Agent will act automatically at 7:00 PM unless overridden.",
    },
    {
      severity: "blue",
      pillar: "FinOps",
      title: "Spot VM interruption rate elevated — 3 interruptions in 6h on batch workloads",
      memory:
        "Memory: spot interruption spikes correlate with regional capacity crunches (asia-south1-b). Mitigation: spread across zones a, b, c. Same fix applied Jun 28 — zero batch failures after zone spread.",
    },
  ],
  changes: [
    { pillar: "CloudOps", detail: "23 GKE pods. AIOps pre-scaled order-service at 5:58 PM — dinner peak handled flawlessly." },
    { pillar: "FinOps", detail: "₹1.4L spend MTD. Spot VM savings: ₹38K this month. Interruption mitigation queued." },
    { pillar: "Cloud Security", detail: "Posture score improved 3pts this week — 2 findings remediated from last audit." },
    { pillar: "DevOps", detail: "29 deployments, 0 failures. Canary releases now standard for all order-service changes." },
    { pillar: "AIOps", detail: "743 tokens today. Auto-scale triggered 1×, 1 spot zone-spread recommendation queued." },
  ],
  patterns: [
    { pattern: "Dinner-peak CPU breach (order-service)", firstSeen: "60d ago", occurrences: 4, lastResolution: "AIOps pre-scale at 7 PM", confidence: 94 },
    { pattern: "Spot VM regional capacity crunch", firstSeen: "30d ago", occurrences: 2, lastResolution: "Multi-zone spread", confidence: 87 },
    { pattern: "GKE image pull latency on scale", firstSeen: "45d ago", occurrences: 2, lastResolution: "Regional image mirror", confidence: 82 },
    { pattern: "Canary rollback on order-service", firstSeen: "90d ago", occurrences: 1, lastResolution: "Auto-rollback trigger", confidence: 91 },
  ],
  workingWell: [
    "AIOps pre-scaled order-service 6 min before dinner peak — 4 consecutive zero-downtime peaks.",
    "Spot VMs saving ₹38K/mo — 67% of batch workloads running on spot without SLA impact.",
    "Canary releases standard for order-service: 0 production rollbacks in 60 days.",
    "Cloud Security posture improved 8pts in the last month — 2 findings proactively closed.",
    "Fastest MTTR in the book: 4 min avg — Memory pattern matching resolves most alerts automatically.",
  ],
  csreActivity: [
    { label: "Last review", value: "6h ago — Automated: AIOps dinner-peak pre-scale notification" },
    { label: "Next scheduled review", value: "Thursday 2:00 PM IST — Monthly performance + cost review" },
    { label: "Open tickets", value: "1 (spot zone-spread for batch)" },
    { label: "Recommendations applied this month", value: "5 (spot zone-spread, canary config, image mirror, CUD, security)" },
    { label: "Estimated savings from recommendations", value: "₹62K/mo" },
  ],
  timeline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  incidentSummary: "0 incidents in 30d · 100% uptime · 0 min total downtime",
};

/* ── MediSetu ────────────────────────────────────────────────────── */
const mediSetu: CustomerSnapshot = {
  scores: [
    { pillar: "CloudOps", score: 89, status: "healthy", note: "" },
    { pillar: "FinOps", score: 73, status: "warning", note: "GKE over-provisioned" },
    { pillar: "Cloud Security", score: 91, status: "healthy", note: "" },
    { pillar: "DevOps", score: 86, status: "healthy", note: "" },
    { pillar: "AIOps", score: null, status: "active", note: "1 agent running" },
  ],
  attention: [
    {
      severity: "amber",
      pillar: "FinOps",
      title: "GKE node pools idle 14h/day — over-provisioned for PHR-service traffic patterns",
      memory:
        "Memory: MediSetu's traffic follows a strict 8 AM–10 PM patient access pattern. Scaling to 2 nodes overnight and ramping by 7:45 AM cut idle costs 34% on a comparable healthcare account. Compliance: HIPAA data stays in asia-south1 — no cross-region movement. Confidence: 92%.",
    },
    {
      severity: "blue",
      pillar: "Cloud Security",
      title: "Cloud SQL audit logging disabled on 2 non-PHR databases",
      memory:
        "Memory: HIPAA BAA requires audit trails on all databases that could be accessed by systems handling PHI. Though these are non-PHR DBs, they share VPC with PHR-service. Enable audit logs as a precaution — low cost, high compliance value.",
    },
  ],
  changes: [
    { pillar: "CloudOps", detail: "PHR-service: 99.97% uptime. GKE nodes idle overnight — right-sizing agent recommendation queued." },
    { pillar: "FinOps", detail: "₹2.1L spend MTD. GKE is 41% of total. Right-sizing could save ₹38K/mo." },
    { pillar: "Cloud Security", detail: "HIPAA controls: 97% compliant. 2 DBs missing audit logs — low risk but flagged." },
    { pillar: "DevOps", detail: "16 deployments, 0 failures. PHR-service now deployed via blue-green for zero-downtime." },
    { pillar: "AIOps", detail: "287 tokens today. GKE cost optimisation analysis completed." },
  ],
  patterns: [
    { pattern: "GKE idle-hour over-provisioning", firstSeen: "45d ago", occurrences: 1, lastResolution: "Schedule-based node scaling", confidence: 92 },
    { pattern: "Audit log gap on shared VPC DBs", firstSeen: "7d ago", occurrences: 1, lastResolution: "Enable Cloud SQL audit", confidence: 88 },
    { pattern: "PHR-service cold-start latency", firstSeen: "30d ago", occurrences: 2, lastResolution: "Minimum replica config", confidence: 84 },
  ],
  workingWell: [
    "PHR-service: 99.97% uptime — well above the HIPAA-tier SLA commitment.",
    "HIPAA compliance posture: 97% — highest compliance score in the healthcare vertical.",
    "Blue-green deployments: 16 consecutive zero-downtime releases for PHR-service.",
    "Cloud Security score 91 — CSRE proactively caught the audit log gap before any assessor review.",
  ],
  csreActivity: [
    { label: "Last review", value: "Yesterday — HIPAA compliance quarterly check" },
    { label: "Next scheduled review", value: "Next week — GKE right-sizing implementation session" },
    { label: "Open tickets", value: "2 (GKE right-sizing, audit log enablement)" },
    { label: "Recommendations applied this month", value: "3 (blue-green deploy, Cloud SQL HA, VPC firewall)" },
    { label: "Estimated savings from recommendations", value: "₹38K/mo (GKE right-sizing, pending approval)" },
  ],
  timeline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  incidentSummary: "0 incidents in 30d · 100% uptime · 0 min total downtime",
};

/* ── ShipEasy ────────────────────────────────────────────────────── */
const shipEasy: CustomerSnapshot = {
  scores: [
    { pillar: "CloudOps", score: 82, status: "warning", note: "dispatch latency elevated" },
    { pillar: "FinOps", score: 90, status: "healthy", note: "" },
    { pillar: "Cloud Security", score: 86, status: "healthy", note: "" },
    { pillar: "DevOps", score: 93, status: "healthy", note: "" },
    { pillar: "AIOps", score: null, status: "active", note: "1 agent running" },
  ],
  attention: [
    {
      severity: "amber",
      pillar: "CloudOps",
      title: "dispatch-service p99 latency elevated: 2.8s vs 400ms baseline — Redis pool exhausted",
      memory:
        "Memory: Memory correlated this latency spike with a Redis connection-pool exhaustion pattern from Aug 2. Increasing the pool from 50 → 200 resolved it in 4 minutes. Same fix queued. Confidence: 89%. Auto-remediation pending your approval.",
    },
    {
      severity: "blue",
      pillar: "CloudOps",
      title: "GPS tracking service: 3 pods in CrashLoopBackOff — memory limit too low",
      memory:
        "Memory: GPS tracker pod OOM occurs every time the shipment tracking batch grows beyond 12K active shipments. Memory limit was set 6 months ago when volume was 4K. Recommend: 512Mi → 1Gi limit. Confidence: 93%.",
    },
  ],
  changes: [
    { pillar: "CloudOps", detail: "dispatch-service latency spike at 3:14 PM — Redis pool exhaustion. Fix queued. GPS pods CrashLooping." },
    { pillar: "FinOps", detail: "₹1.1L spend MTD. Lowest per-shipment cost on record: ₹0.023/shipment." },
    { pillar: "Cloud Security", detail: "All 3 last-mile partner API integrations audited. 0 credential leaks found." },
    { pillar: "DevOps", detail: "21 deployments, 0 failures. dispatch-service deploy pipeline now includes load test gate." },
    { pillar: "AIOps", detail: "398 tokens today. Latency root cause identified in 4 min; Memory pattern matched instantly." },
  ],
  patterns: [
    { pattern: "Redis connection-pool exhaustion", firstSeen: "30d ago", occurrences: 2, lastResolution: "Pool size increase 50→200", confidence: 89 },
    { pattern: "GPS pod OOM on volume growth", firstSeen: "21d ago", occurrences: 2, lastResolution: "Memory limit increase", confidence: 93 },
    { pattern: "dispatch p99 latency spike", firstSeen: "30d ago", occurrences: 2, lastResolution: "Redis pool + replica scaling", confidence: 87 },
    { pattern: "Partner API credential rotation gap", firstSeen: "60d ago", occurrences: 1, lastResolution: "Secret Manager rotation", confidence: 84 },
  ],
  workingWell: [
    "Memory correlated the latency spike to a known Redis pattern in 4 minutes — avg MTTR down from 47 min to 6 min.",
    "dispatch-service deploy pipeline: load test gate added — 0 performance regressions shipped in 30 days.",
    "Partner API audit complete — 0 credential leaks across all 3 last-mile integrations.",
    "Cost efficiency at record low: ₹0.023/shipment despite 3× volume growth since onboarding.",
    "Cloud Security score 86 and stable — no new critical findings this month.",
  ],
  csreActivity: [
    { label: "Last review", value: "30 min ago — Active incident: dispatch latency / Redis pool (CSRE on bridge)" },
    { label: "Next scheduled review", value: "Post-incident: today 6:00 PM IST — RCA + remediation sign-off" },
    { label: "Open tickets", value: "2 (Redis pool fix pending approval, GPS memory limit)" },
    { label: "Recommendations applied this month", value: "4 (load test gate, partner audit, Redis monitoring, CUD)" },
    { label: "Estimated savings from recommendations", value: "₹29K/mo" },
  ],
  timeline: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1],
  incidentSummary: "2 incidents in 30d · 99.95% uptime · 22 min total downtime",
};

/* ── Index ───────────────────────────────────────────────────────── */
export const CUSTOMER_DATA: Record<CustomerKey, CustomerSnapshot> = {
  "All Organizations": allOrgs,
  "Netcore": netcore,
  "Aarti Industries": aarti,
  "ShoppersStop": shoppersStop,
  "DesignX": designX,
  "PayNimbus": payNimbus,
  "Kiranakart": kiranakart,
  "MediSetu": mediSetu,
  "ShipEasy": shipEasy,
};

/* ── Legacy flat export (still used by apiFetch for this domain) ── */
const data: Record<string, unknown> = {
  "/command-center/scores": allOrgs.scores,
  "/command-center/attention": allOrgs.attention,
  "/command-center/changes": allOrgs.changes,
  "/command-center/memory-patterns": allOrgs.patterns,
  "/command-center/working-well": allOrgs.workingWell,
  "/command-center/csre-activity": allOrgs.csreActivity,
  "/command-center/timeline": allOrgs.timeline,
};

export default data;
