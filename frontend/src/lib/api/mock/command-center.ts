/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Command Center seed data                        */
/*  Served by apiFetch() when no backend is configured.  Keyed by the  */
/*  endpoint path each page requests via useApiData().                 */
/* ------------------------------------------------------------------ */

const data: Record<string, unknown> = {
  "/command-center/scores": [
    { pillar: "CloudOps", score: 94, status: "healthy", note: "" },
    { pillar: "FinOps", score: 78, status: "warning", note: "cost anomaly detected" },
    { pillar: "Cloud Security", score: 89, status: "healthy", note: "" },
    { pillar: "DevOps", score: 96, status: "healthy", note: "" },
    { pillar: "AIOps", score: null, status: "active", note: "3 agents running" },
  ],

  "/command-center/attention": [
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
      title: "ShoppersStop — checkout-service egress anomalous (3.3σ) ahead of sale",
      memory:
        "Memory: a similar 3.3σ egress on Jun 2 was a false positive (backup job, 72% conf). This signature differs — likely real. Flagged before the sale window to prevent a checkout outage.",
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

  "/command-center/changes": [
    {
      pillar: "CloudOps",
      detail:
        "23 VMs stable, 1 auto-scaled (clens-dev CPU spike → e2-standard-4, resolved 8 min)",
    },
    {
      pillar: "FinOps",
      detail:
        "$637 current month spend, +8% MoM. BigQuery anomaly flagged.",
    },
    {
      pillar: "Cloud Security",
      detail:
        "342 findings, 12 are recurrences of resolved patterns. Posture score: 89 → 87 (2 new SSH groups)",
    },
    {
      pillar: "DevOps",
      detail:
        "47 deployments, 0 failures. Patch compliance: 78% (3 critical pending)",
    },
    {
      pillar: "AIOps",
      detail:
        "847 tokens used, 3 auto-remediations triggered, 2 successful",
    },
  ],

  "/command-center/memory-patterns": [
    {
      pattern: "CPU spike before auto-scale",
      firstSeen: "45d ago",
      occurrences: 7,
      lastResolution: "Right-size + load balance",
      confidence: 94,
    },
    {
      pattern: "BigQuery ETL cost spike",
      firstSeen: "30d ago",
      occurrences: 3,
      lastResolution: "Query optimization",
      confidence: 88,
    },
    {
      pattern: "SSH security group creation",
      firstSeen: "60d ago",
      occurrences: 12,
      lastResolution: "Auto-remediation script",
      confidence: 96,
    },
    {
      pattern: "Connection pool exhaustion",
      firstSeen: "21d ago",
      occurrences: 2,
      lastResolution: "Pool size increase",
      confidence: 82,
    },
    {
      pattern: "Friday deployment failures",
      firstSeen: "90d ago",
      occurrences: 5,
      lastResolution: "Pre-deploy validation",
      confidence: 91,
    },
  ],

  "/command-center/working-well": [
    "Kiranakart — order-service CPU predicted to breach at dinner peak; AIOps agent auto-scaled 6 min early. Zero downtime (94% confidence).",
    "MediSetu — idle GKE node pools + oversized Cloud SQL right-sized from Memory. 18% GCP savings, compliance retained.",
    "ShipEasy — dispatch latency root-caused in seconds: Memory correlated a Redis connection-pool exhaustion pattern; pool increased.",
    "MTTR improved 22% vs last month (13 min avg) across the managed book.",
    "3 auto-remediations succeeded without human intervention this week.",
  ],

  "/command-center/csre-activity": [
    { label: "Last review", value: "2h ago — Netcore & Aarti by Searce CSRE" },
    { label: "Next scheduled review", value: "Tomorrow 10:00 AM IST — ShoppersStop pre-sale readiness" },
    { label: "Open tickets", value: "2 (Aarti SSH remediation, Netcore cost optimization)" },
    { label: "Recommendations applied this month", value: "7 across 6 accounts" },
    { label: "Estimated savings from recommendations", value: "₹4.2L/mo across the book" },
  ],

  // 30-day timeline: 0 = green (clear), 1 = amber (minor), 2 = red (incident)
  "/command-center/timeline": [
    0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    2, 0, 0, 0, 0,
  ],
};

export default data;
