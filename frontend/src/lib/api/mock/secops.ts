/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Cloud Security seed data                        */
/*  Tenant: Shoppers Stop — eCommerce workloads.                      */
/*  Tower F — Cloud Security [SOW §4.8].                              */
/*                                                                     */
/*  Findings reflect the estate the SOW actually puts in scope:        */
/*  Cloud Armor / WAF, IAM + Cloud KMS governance, Kubernetes secrets  */
/*  via Istio, container image compliance, and the Keycloak upgrade    */
/*  Searce is contracted to assist with. Nothing here is AWS — DNS on  */
/*  Route 53 is explicitly out of scope [SOW §4.3].                    */
/*                                                                     */
/*  Compliance frameworks are the subset Intellicore CMP reports on    */
/*  [SOW §4.10]. Certification itself is out of scope [SOW §4.8].      */
/* ------------------------------------------------------------------ */

const data: Record<string, unknown> = {
  "/secops/findings": [
    {
      id: 1,
      severity: "critical",
      title: "Keycloak 22.0.1 has known authentication-bypass CVEs",
      resource: "keycloak (ss-ecom-prod-cluster)",
      account: "ss-ecom-prod-gke",
      cisCheck: "CIS GKE 5.6",
      memorySeenCount: 0,
      memoryLastResolution: "",
      memoryConfidence: 0,
      memoryNote:
        "Named in SOW §4.8 as an in-scope upgrade, and §9 item 8 flags the replacement auth service as unconfirmed. Upgrade now rather than waiting on the replacement decision — the CVE is live either way.",
      actions: ["Investigate"],
    },
    {
      id: 2,
      severity: "critical",
      title: "ss-ops-db-01 has no HA replica and PITR disabled",
      resource: "ss-ops-db-01",
      account: "ss-ecom-prod-winapi",
      cisCheck: "CIS GCP 6.7",
      memorySeenCount: 2,
      memoryLastResolution: "Enabled regional HA + 7-day PITR",
      memoryConfidence: 91,
      memoryNote:
        "This instance serves all 5 production Windows VM services. SOW §4.5 commits Searce to point-in-time restoration; that commitment cannot be met while PITR is off. Note PITR adds CloudSQL disk cost.",
      actions: ["Auto-Fix", "Investigate"],
    },
    {
      id: 3,
      severity: "high",
      title: "Cloud Armor rate-limit rule absent on checkout path",
      resource: "ss-nitrogen-lb-prod",
      account: "ss-ecom-prod-network",
      cisCheck: "CIS GCP 3.9",
      memorySeenCount: 3,
      memoryLastResolution: "Added per-IP rate limit 120 req/min on checkout",
      memoryConfidence: 88,
      memoryNote:
        "Applied on 3 prior retail sale events. ss.com is prone to cascading failure [SOW §7.2] — an unthrottled checkout path is the usual first domino under a push-notification burst.",
      actions: ["Auto-Fix", "Investigate"],
    },
    {
      id: 4,
      severity: "high",
      title: "Service account key for jenkins-deploy unrotated for 217 days",
      resource: "jenkins-deploy@ss-ecom-cicd",
      account: "ss-ecom-cicd",
      cisCheck: "CIS GCP 1.4",
      memorySeenCount: 6,
      memoryLastResolution: "Rotated key + moved to Workload Identity",
      memoryConfidence: 93,
      memoryNote:
        "Identity hygiene is explicitly in scope [SOW §4.8]. Workload Identity removes the key entirely; Jenkins pipeline access control is Searce-managed [SOW §4.6].",
      actions: ["Auto-Fix", "Investigate"],
    },
    {
      id: 5,
      severity: "medium",
      title: "3 container images in prod cluster have critical CVEs",
      resource: "ss-ecom-prod-cluster",
      account: "ss-ecom-prod-gke",
      cisCheck: "CIS GKE 5.1",
      memorySeenCount: 4,
      memoryLastResolution: "Rebuilt from patched base image",
      memoryConfidence: 79,
      memoryNote:
        "Container security and image scanning are in scope [SOW §4.4]. The rebuild itself is an application-team action — Searce raises and tracks, app team ships.",
      actions: ["Investigate"],
    },
    {
      id: 6,
      severity: "medium",
      title: "TLS secret for ss.com expires in 24 days",
      resource: "istio-system/ss-com-tls",
      account: "ss-ecom-prod-gke",
      cisCheck: "CIS GKE 5.4",
      memorySeenCount: 5,
      memoryLastResolution: "Renewed + rotated Kubernetes secret",
      memoryConfidence: 97,
      memoryNote:
        "SSL certificates are managed as Kubernetes secrets via Istio [SOW §4.4]. Renewal has been routine 5/5 times; low risk, but a silent expiry takes ss.com down entirely.",
      actions: ["Auto-Fix"],
    },
    {
      id: 7,
      severity: "low",
      title: "VPC flow logs disabled on non-production VPC",
      resource: "ss-ecom-uat-1-vpc",
      account: "ss-ecom-uat-1",
      cisCheck: "CIS GCP 3.8",
      memorySeenCount: 2,
      memoryLastResolution: "Enabled with 30-day retention",
      memoryConfidence: 85,
      memoryNote: "Non-production. Enabling adds a small logging cost — raise at the next CAB rather than auto-fixing.",
      actions: ["Investigate"],
    },
  ],

  "/secops/iam": [
    {
      name: "jenkins-deploy@ss-ecom-cicd",
      type: "Service Account",
      risk: "High",
      riskColor: "text-rose-600 bg-rose-50",
      lastActive: "3h ago",
      memory: "Key unrotated 217d and holds project Editor. Memory: 6 similar cases closed via Workload Identity + custom role.",
    },
    {
      name: "ms.prodsupport@searce.com",
      type: "Searce Operator",
      risk: "Low",
      riskColor: "text-green-600 bg-green-50",
      lastActive: "18 min ago",
      memory: "Viewer + Tech Support Editor, exactly as scoped in SOW §4.11. No application or business data access.",
    },
    {
      name: "ms.cloudengineer@searce.com",
      type: "Searce Operator",
      risk: "Low",
      riskColor: "text-green-600 bg-green-50",
      lastActive: "42 min ago",
      memory: "Project Viewer only, per SOW §4.11. Read-only on logs, events and configuration.",
    },
    {
      name: "magento-app@ss-ecom-prod-gke",
      type: "Service Account",
      risk: "Medium",
      riskColor: "text-amber-600 bg-amber-50",
      lastActive: "2 min ago",
      memory: "Holds cloudsql.admin but only ever calls cloudsql.instances.connect. Least-privilege custom role available.",
    },
    {
      name: "ss-catalog-sync@ss-ecom-prod-gke",
      type: "Service Account",
      risk: "Low",
      riskColor: "text-green-600 bg-green-50",
      lastActive: "6 min ago",
      memory: "Appropriately scoped to storage.objectViewer + pubsub.publisher.",
    },
    {
      name: "contractor-uat@shoppersstop.com",
      type: "User",
      risk: "Medium",
      riskColor: "text-amber-600 bg-amber-50",
      lastActive: "71d ago",
      memory: "Stale identity in UAT. Memory: inactive accounts disabled at 90d. 19 days from that threshold.",
    },
  ],

  "/secops/compliance": [
    { name: "CIS GCP Benchmark v2.0", pct: 87, passing: 57, failing: 8, notAssessed: 0, total: 65 },
    { name: "PCI-DSS v4.0", pct: 82, passing: 214, failing: 32, notAssessed: 15, total: 261 },
    { name: "ISO 27001", pct: 90, passing: 103, failing: 11, notAssessed: 0, total: 114 },
    { name: "NIST CSF", pct: 85, passing: 89, failing: 12, notAssessed: 7, total: 108 },
  ],

  "/secops/remediations": [
    { date: "Sep 9", finding: "Cloud Armor WAF rules stale for sale traffic", action: "Refreshed rule set + 3 scraper ASNs blocked", result: "Resolved", time: "14 min" },
    { date: "Sep 4", finding: "TLS secret rotation (ss-uat.com)", action: "Renewed + rotated K8s secret via Istio", result: "Resolved, no downtime", time: "6 min" },
    { date: "Aug 28", finding: "Over-privileged SA (ss-price-feed)", action: "Custom least-privilege role applied", result: "Resolved", time: "22 min" },
    { date: "Aug 19", finding: "Stale identities in UAT (4 users)", action: "Disabled after Client review", result: "Resolved", time: "31 min" },
    { date: "Aug 11", finding: "Container image CVEs (2 images)", action: "Raised to app team, rebuilt from patched base", result: "Resolved by Client", time: "3 days" },
  ],
};

export default data;
