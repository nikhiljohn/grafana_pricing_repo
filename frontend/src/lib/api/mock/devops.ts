/* ------------------------------------------------------------------ */
/*  Intellicore CMP — DevOps domain seed data                         */
/*  Tenant: Shoppers Stop — eCommerce workloads.                      */
/*  Tower D — DevOps & CI/CD Pipeline Management [SOW §4.6].          */
/*                                                                     */
/*  Shoppers Stop deploys 3–4× per month (more during sale periods)    */
/*  through Jenkins at gcphulk.ssecom.tech, strictly inside the        */
/*  02:00–05:00 IST maintenance window, against pre-approved release   */
/*  notes supplied by the Client [SOW §3.2, §4.6].                     */
/*                                                                     */
/*  Note the scope line: Searce executes deployments and              */
/*  release-specific post-deploy tasks (the Magaz pod commands).       */
/*  Application code changes, merge conflicts and net-new              */
/*  microservices are the Client's [SOW §4.6, out-of-scope].           */
/* ------------------------------------------------------------------ */

const data: Record<string, unknown> = {
  "/devops/changes": [
    {
      time: "3h ago",
      resource: "ss-ecom-prod-cluster",
      resourceType: "GKE",
      changeType: "Node pool scaled 7 → 9",
      risk: "Low",
      memory:
        "Memory: manual pre-sale scaling, the documented protocol for traffic spikes [SOW §4.4]. Same action taken before the last 3 sale events with no incident.",
    },
    {
      time: "9h ago",
      resource: "istio-system/ss-com-tls",
      resourceType: "Kubernetes Secret",
      changeType: "TLS secret read by ingress gateway",
      risk: "Low",
      memory:
        "Memory: routine. Certificate expires in 24 days — renewal already raised as a Cloud Security finding.",
    },
    {
      time: "1d ago",
      resource: "jenkins-deploy",
      resourceType: "IAM",
      changeType: "Service account key used from new IP",
      risk: "MEDIUM",
      memory:
        "Memory: the key is 217 days old and holds project Editor. This is the second finding on the same identity — rotate to Workload Identity rather than reissuing the key.",
    },
    {
      time: "2d ago",
      resource: "ss-magento-db-01",
      resourceType: "Cloud SQL",
      changeType: "max_connections raised 400 → 500",
      risk: "MEDIUM",
      memory:
        "Memory: applied during the connection-pool incident. Raising the ceiling treats the symptom — the application-side leak is still open with the Client app team.",
    },
    {
      time: "4d ago",
      resource: "ss-nitrogen-lb-prod",
      resourceType: "Cloud Armor",
      changeType: "WAF rule set updated",
      risk: "Low",
      memory:
        "Memory: festive-season threat signatures added. 3 scraper ASNs blocked. Identical change made before the Aug campaign with no false positives.",
    },
    {
      time: "6d ago",
      resource: "ss-ecom-nonprod-cluster",
      resourceType: "GKE",
      changeType: "Scheduled scale-to-zero applied (21:00–07:00)",
      risk: "Low",
      memory:
        "Memory: FinOps optimisation, ₹31K/mo recurring. Confirmed with the Client that UAT runs business hours only.",
    },
  ],

  "/devops/orchestration": [
    {
      ticket: "SS-4471",
      request: "Create Jenkins pipeline for promotion-engine service",
      resource: "ss-ecom-cicd",
      provider: "GCP",
      estCost: "₹0",
      risk: "Low",
      status: "Awaiting Client reference pipeline",
      memory:
        "In scope — new pipelines are built from an existing reference [SOW §4.6]. Blocked on SOW §9 item 4: Jenkins configuration details still to be shared by Subhasish Mishra.",
    },
    {
      ticket: "SS-4468",
      request: "Enable PITR + regional HA on ss-ops-db-01",
      resource: "ss-ops-db-01",
      provider: "GCP",
      estCost: "+₹14K/mo",
      risk: "Medium",
      status: "Pending Client approval",
      memory:
        "Required to meet the point-in-time restore commitment in SOW §4.5. PITR adds CloudSQL disk cost, which the SOW calls out explicitly — needs Client sign-off, not a silent apply.",
    },
    {
      ticket: "SS-4455",
      request: "Provision UAT node pool for MySQL 8.4 upgrade rehearsal",
      resource: "ss-ecom-nonprod-cluster",
      provider: "GCP",
      estCost: "+₹22K one-off",
      risk: "Low",
      status: "Approved — scheduled",
      memory:
        "The 8.4 upgrade must land before December 2026 [SOW §4.5]. Rehearsing in UAT first is how the last two major-version upgrades avoided a production rollback.",
    },
    {
      ticket: "SS-4442",
      request: "Rotate jenkins-deploy to Workload Identity",
      resource: "ss-ecom-cicd",
      provider: "GCP",
      estCost: "₹0",
      risk: "Medium",
      status: "Approved — scheduled in window",
      memory:
        "Removes the static key entirely. Jenkins access control is Searce-managed [SOW §4.6], so this is in scope without an application change.",
    },
  ],

  "/devops/patches": [
    {
      resource: "ss-magento-db-01",
      type: "Cloud SQL",
      currentVer: "MySQL 8.0.37",
      targetVer: "MySQL 8.4",
      severity: "High",
      daysBehind: "EOSS Dec 2026",
      memory:
        "Contractual deadline, not a recommendation [SOW §4.5]. Execution is joint: Searce plans and executes, Client app team is accountable for sign-off [SOW §8 RACI].",
    },
    {
      resource: "ss-magento-db-02 · 03 · 04",
      type: "Cloud SQL",
      currentVer: "MySQL 8.0.37",
      targetVer: "MySQL 8.4",
      severity: "High",
      daysBehind: "EOSS Dec 2026",
      memory:
        "Same deadline. These carry SSO, Keycloak and CMS — the dependency mapping matters more than the upgrade itself, since all three touch the auth path.",
    },
    {
      resource: "keycloak",
      type: "Container image",
      currentVer: "22.0.1",
      targetVer: "26.x",
      severity: "Critical",
      daysBehind: "Active CVEs",
      memory:
        "SOW §4.8 commits Searce to upgrade assistance. SOW §9 item 8 leaves the replacement auth service unconfirmed — do not wait on that decision to patch a live CVE.",
    },
    {
      resource: "ss-ecom-prod-cluster",
      type: "GKE",
      currentVer: "1.30.4-gke.1200",
      targetVer: "1.31.x",
      severity: "Medium",
      daysBehind: "1 minor behind",
      memory:
        "Control plane and node upgrades are in scope [SOW §4.4]. Hold until after the festive peak — the cluster is the ss.com serving path.",
    },
    {
      resource: "ss-prod-cf-api · ss-prod-ecom-api · ss-ms",
      type: "Windows VM",
      currentVer: "Windows Server",
      targetVer: "Migrate to GKE",
      severity: "Medium",
      daysBehind: "Target Dec 2026",
      memory:
        "Guest OS patching is explicitly out of scope [SOW §4.7]. The remediation here is the migration, not a patch — and it retires roughly ₹85K/mo of Windows licensing.",
    },
  ],

  "/devops/patterns": [
    "All 11 deployments in the last 90 days ran inside the 02:00–05:00 IST window. Zero window breaches.",
    "Post-deployment Magaz pod restarts are required on 4 of 11 releases and are the most common cause of a deploy running long.",
    "Deploy failures cluster on releases that also carry a DB schema change — 2 of 2 failures in 90d. Schema governance is still an open SOW item (§9 item 1).",
    "Sale-period deploy frequency runs roughly 2× the 3–4/month baseline.",
    "Mean time from release-note approval to deploy start: 6 days. The window is never the bottleneck; approval is.",
  ],

  "/devops/deployments": [
    { time: "Sep 11 02:14", name: "magento-release-r48", target: "GKE (prod)", success: true, summary: "v4.8.2. Magaz pod restart executed per release SOP. 0 errors." },
    { time: "Sep 4 02:20", name: "cms-content-r22", target: "GKE (prod)", success: true, summary: "CMS template update. No schema change. Completed 02:41." },
    { time: "Aug 28 02:05", name: "magento-release-r47", target: "GKE (prod)", success: false, summary: "Schema migration timed out at 02:52. Rolled back inside window. Client app team re-scoped the migration." },
    { time: "Aug 21 02:30", name: "promotion-engine-r14", target: "Windows VM", success: true, summary: "Deployed to ss-promotion-engine. curl health checks green." },
    { time: "Aug 14 02:10", name: "magento-release-r46", target: "GKE (prod)", success: true, summary: "v4.7.9 + Magaz restart. Canary held 12 min before full rollout." },
    { time: "Aug 7 02:25", name: "sso-config-r09", target: "GKE (prod)", success: true, summary: "Keycloak realm config only. No image change." },
    { time: "Jul 31 02:15", name: "magento-release-r45", target: "GKE (prod)", success: true, summary: "v4.7.8. Fastest release this quarter — 22 min end to end." },
    { time: "Jul 24 02:40", name: "catalog-sync-r11", target: "Cloud Run", success: true, summary: "Catalogue feed processor v2.3. Zero-downtime revision swap." },
    { time: "Jul 17 02:05", name: "magento-release-r44", target: "GKE (prod)", success: false, summary: "Schema change locked the orders table. Rolled back 02:48. Root cause handed to app team." },
    { time: "Jul 10 02:20", name: "windows-vm-patch-cycle", target: "Windows VM", success: true, summary: "Weekly restart ×5 + curl validation. All healthy by 02:41." },
  ],

  /** Deploys per weekday over 90 days — everything lands in the window. */
  "/devops/velocity": [
    { day: "Mon", count: 0 },
    { day: "Tue", count: 1 },
    { day: "Wed", count: 2 },
    { day: "Thu", count: 4 },
    { day: "Fri", count: 4 },
    { day: "Sat", count: 0 },
    { day: "Sun", count: 0 },
  ],
};

export default data;
