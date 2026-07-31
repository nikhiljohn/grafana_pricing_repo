/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Command Center seed data                        */
/*  Served by apiFetch() when no backend is configured.  Keyed by the  */
/*  endpoint path each page requests via useApiData().                 */
/* ------------------------------------------------------------------ */

const data: Record<string, unknown> = {
  "/command-center/scores": [
    { pillar: "CloudOps", score: 94, status: "healthy", note: "" },
    { pillar: "FinOps", score: 78, status: "warning", note: "cost anomaly detected" },
    { pillar: "SecOps", score: 89, status: "healthy", note: "" },
    { pillar: "DevOps", score: 96, status: "healthy", note: "" },
    { pillar: "AIOps", score: null, status: "active", note: "3 agents running" },
  ],

  "/command-center/attention": [
    {
      severity: "red",
      pillar: "SecOps",
      title: "5 security groups allow SSH from internet (CIS 5.2)",
      memory:
        "Similar finding resolved across 3 accounts last month → remediation script available",
    },
    {
      severity: "amber",
      pillar: "FinOps",
      title: "BigQuery cost spike +340% in last 4h",
      memory:
        "Matches Jul 15 ETL spike pattern. Root cause last time: unoptimized JOIN on 2TB table. Suggested fix: apply same query optimization",
    },
    {
      severity: "amber",
      pillar: "CloudOps",
      title: "Bastion-Host network egress anomalous (3.3σ)",
      memory:
        "Last occurrence was a false positive from backup job. Confidence: 72% false positive",
    },
    {
      severity: "blue",
      pillar: "DevOps",
      title: "4 orchestration requests pending approval",
      memory:
        "Oldest: 2h (CL-36: GCP VM provision, est. $45/mo, low risk)",
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
      pillar: "SecOps",
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
    "22/23 VMs within thresholds for 30d",
    "All databases encrypted, automated backups active",
    "Zero security findings on serverless workloads",
    "MTTR improved 22% vs last month (13 min avg)",
    "3 auto-remediations succeeded without human intervention",
  ],

  "/command-center/csre-activity": [
    { label: "Last review", value: "2h ago by Searce CSRE" },
    { label: "Next scheduled review", value: "Tomorrow 10:00 AM IST" },
    { label: "Open tickets", value: "2 (1 remediation, 1 cost optimization)" },
    { label: "Recommendations applied this month", value: "7" },
    { label: "Estimated savings from recommendations", value: "$105/mo" },
  ],

  // 30-day timeline: 0 = green (clear), 1 = amber (minor), 2 = red (incident)
  "/command-center/timeline": [
    0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    2, 0, 0, 0, 0,
  ],
};

export default data;
