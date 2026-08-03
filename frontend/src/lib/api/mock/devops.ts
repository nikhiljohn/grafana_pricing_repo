/* ------------------------------------------------------------------ */
/*  Intellicore CMP — DevOps domain seed data                         */
/*  Served by apiFetch('/devops/...') when no backend is configured.   */
/* ------------------------------------------------------------------ */

const data: Record<string, unknown> = {
  "/devops/changes": [
    {
      time: "2h ago",
      resource: "clens-dev",
      resourceType: "VM",
      changeType: "Machine type changed",
      risk: "Low",
      memory:
        "Memory: Auto-scaled after CPU spike. This is a known recovery pattern.",
    },
    {
      time: "4h ago",
      resource: "deploy-bot",
      resourceType: "IAM",
      changeType: "Role binding added",
      risk: "HIGH",
      memory:
        "Memory: IAM changes are flagged. deploy-bot already over-privileged (see SecOps).",
    },
    {
      time: "6h ago",
      resource: "etl-pipeline",
      resourceType: "BigQuery",
      changeType: "Query pattern changed",
      risk: "MEDIUM",
      memory:
        "Memory: New query matches pattern that caused Jul 15 cost spike.",
    },
    {
      time: "8h ago",
      resource: "process-orders",
      resourceType: "Function",
      changeType: "Min instances set to 3",
      risk: "Low",
      memory:
        "Memory: Cold start mitigation from incident 14d ago.",
    },
    {
      time: "12h ago",
      resource: "pgsql",
      resourceType: "Cloud SQL",
      changeType: "Connection pool increased",
      risk: "Low",
      memory:
        "Memory: Post-incident fix for connection exhaustion 7d ago.",
    },
    {
      time: "18h ago",
      resource: "bastion-host",
      resourceType: "VM",
      changeType: "Firewall rule updated",
      risk: "MEDIUM",
      memory:
        "Memory: Egress alert was false positive. Rule adjusted to exclude backup CIDR.",
    },
    {
      time: "1d ago",
      resource: "testhydpdf",
      resourceType: "S3",
      changeType: "Bucket policy modified",
      risk: "HIGH",
      memory:
        "Memory: This bucket has public access finding (CIS 2.1.2). Change needs review.",
    },
  ],

  "/devops/orchestration": [
    {
      ticket: "CL-36",
      request: "Provision VM",
      resource: "e2-standard-2",
      provider: "GCP",
      estCost: "$45/mo",
      risk: "Low",
      status: "Pending approval",
      memory:
        "Memory: Similar VMs provisioned 12 times. Avg approval time: 1.5h",
    },
    {
      ticket: "CL-35",
      request: "Create GCS bucket",
      resource: "Standard",
      provider: "GCP",
      estCost: "$2/mo",
      risk: "Low",
      status: "Pending",
      memory:
        "Memory: Recommend lifecycle policy at creation (FinOps learning)",
    },
    {
      ticket: "CL-34",
      request: "Add IAM role",
      resource: "Editor",
      provider: "GCP",
      estCost: "—",
      risk: "HIGH",
      status: "Pending",
      memory:
        "Memory: Editor role is over-privileged. Suggest custom role (SecOps learning)",
    },
    {
      ticket: "CL-33",
      request: "Scale Cloud Run",
      resource: "10 instances",
      provider: "GCP",
      estCost: "$120/mo",
      risk: "Medium",
      status: "Pending",
      memory:
        "Memory: Current traffic doesn’t justify 10 instances. Suggest autoscaler.",
    },
    {
      ticket: "CL-32",
      request: "Delete old snapshots",
      resource: "—",
      provider: "GCP",
      estCost: "-$8/mo",
      risk: "Low",
      status: "Completed",
      memory:
        "Memory: 14 snapshots deleted, matching FinOps recommendation",
    },
  ],

  "/devops/patches": [
    {
      resource: "clens-dev",
      type: "VM (Ubuntu)",
      currentVer: "22.04.4",
      targetVer: "22.04.5",
      severity: "Critical",
      daysBehind: "12d",
      memory:
        "Memory: Last patched during maintenance window. Requires reboot.",
    },
    {
      resource: "bastion-host",
      type: "VM (Ubuntu)",
      currentVer: "22.04.3",
      targetVer: "22.04.5",
      severity: "Critical",
      daysBehind: "28d",
      memory:
        "Memory: Patch delayed due to egress investigation. Safe to proceed now.",
    },
    {
      resource: "pgsql",
      type: "Cloud SQL",
      currentVer: "POSTGRES_17",
      targetVer: "POSTGRES_18",
      severity: "High",
      daysBehind: "45d",
      memory:
        "Memory: Major version upgrade. Tested on staging 30d ago — no issues.",
    },
    {
      resource: "connectiq",
      type: "VM (Debian)",
      currentVer: "11.9",
      targetVer: "12.0",
      severity: "Medium",
      daysBehind: "60d",
      memory:
        "Memory: Debian 12 upgrade requires app compatibility testing.",
    },
    {
      resource: "monitoring-agent",
      type: "VM",
      currentVer: "22.04.4",
      targetVer: "22.04.5",
      severity: "Low",
      daysBehind: "5d",
      memory:
        "Memory: Non-critical, scheduled for next maintenance window.",
    },
  ],

  "/devops/patterns": [
    "Deployments on Fridays fail 23% more than weekday average (5 incidents in 90d)",
    "Cloud Run deployments have 0% failure rate (28 consecutive successes)",
    "IAM changes correlate with 40% of security findings within 48h",
    "Average rollback time: 4 min. All rollbacks were on VM deployments.",
    "Terraform applies succeed 94% of the time. Failures: state lock conflicts (3x).",
  ],

  "/devops/deployments": [
    { time: "Today 09:14", name: "deploy-frontend", target: "Cloud Run", success: true, summary: "v2.8.1 rolled out. 0 errors in canary." },
    { time: "Today 07:30", name: "terraform-apply", target: "Infra", success: true, summary: "Added monitoring dashboard. No drift detected." },
    { time: "Yesterday 18:45", name: "deploy-api", target: "Cloud Run", success: true, summary: "v3.2.0 with new /orders endpoint. Latency stable." },
    { time: "Yesterday 14:20", name: "patch-bastion", target: "VM", success: false, summary: "Patch failed — egress firewall blocked apt update. Rolled back." },
    { time: "Yesterday 10:00", name: "deploy-etl", target: "Dataflow", success: true, summary: "Pipeline v1.4 — added dedup stage. Throughput +12%." },
    { time: "Jul 28 16:30", name: "scale-cloud-run", target: "Cloud Run", success: true, summary: "Auto-scaled to 8 instances during traffic spike." },
    { time: "Jul 28 11:15", name: "terraform-apply", target: "Infra", success: false, summary: "State lock conflict. Resolved after 3 min retry." },
    { time: "Jul 27 09:00", name: "deploy-ml-model", target: "Vertex AI", success: true, summary: "Model v2.1 deployed. Accuracy 94.2% on validation set." },
    { time: "Jul 26 15:45", name: "deploy-frontend", target: "Cloud Run", success: true, summary: "v2.8.0 hotfix for checkout bug. MTTR: 22 min." },
    { time: "Jul 26 08:30", name: "iam-update", target: "IAM", success: true, summary: "Service account key rotated. Old key revoked." },
  ],

  "/devops/velocity": [
    { day: "Mon", count: 1120 },
    { day: "Tue", count: 980 },
    { day: "Wed", count: 2400 },
    { day: "Thu", count: 1350 },
    { day: "Fri", count: 1100 },
    { day: "Sat", count: 420 },
    { day: "Sun", count: 310 },
  ],
};

export default data;
