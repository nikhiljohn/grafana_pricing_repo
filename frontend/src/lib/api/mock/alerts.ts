/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Alerts seed data                                */
/*  Tenant: Shoppers Stop — eCommerce workloads.                      */
/*                                                                     */
/*  Alerts arrive from Grafana and Dynatrace and are raised into the   */
/*  Client's ITSM on threshold breach [SOW §3.1, §4.6]. Priorities     */
/*  follow the SLA in SOW §7.1 — P1 15 min / < 4 hr, P2 30 min /       */
/*  < 8 hr, P3 30 min / < 24 hr, P4 4 hr / best effort.                */
/*                                                                     */
/*  Everything below has already passed Tower A triage: the alerts     */
/*  the agent classified as benign were closed without paging and do   */
/*  not appear here.                                                   */
/* ------------------------------------------------------------------ */

const data = {
  "/alerts": [
    {
      id: "1",
      title: "P2 · Cloud Storage egress +214% over 36h",
      status: "ACTIVE",
      description:
        "ss-ecom-assets egress is 214% above the 7-day baseline. Festive campaign creative is being served directly from the bucket instead of the CDN origin. Memory: identical pattern before the Aug campaign, resolved by repointing the CMS asset URLs (78% reduction within 2h). Projected overspend ≈ ₹48K this cycle.",
      baseline: "₹74,000/mo",
      current: "₹2,32,000/mo",
      increase: "+214%",
      date: "Sep 12, 2026 04:10:22",
      type: "COST_SPIKE",
    },
    {
      id: "2",
      title: "P2 · GKE node pool memory 81% before sale window",
      status: "ACTIVE",
      description:
        "ss-ecom-prod-cluster node pool is at 81% memory with 2 nodes of autoscale headroom, ahead of the festive window. Memory: the ss.com cascade begins at the checkout route and reactive autoscale runs 6–8 min too slow. Recommended pre-scale 9 → 11 nodes; awaiting Client approval per SOW §3.2.",
      baseline: "62% memory",
      current: "81% memory",
      increase: "+19 pts",
      date: "Sep 12, 2026 02:48:05",
      type: "CAPACITY",
    },
    {
      id: "3",
      title: "P3 · ss-magento-db-01 connections projected to hit max in 9 days",
      status: "ACTIVE",
      description:
        "Connections at 361/500 and growing ~14%/week between releases. Memory: this is linear and predictable on this instance — raised proactively as P3 so it lands in a maintenance window rather than as a 03:00 P1. Prior reactive occurrence took 31 min to clear.",
      baseline: "318 connections",
      current: "361 connections",
      increase: "+14%/wk",
      date: "Sep 11, 2026 09:15:40",
      type: "CAPACITY",
    },
    {
      id: "4",
      title: "P2 · Keycloak 22.0.1 authentication-bypass CVEs",
      status: "ACKNOWLEDGED",
      description:
        "Keycloak sits on the live ss.com authentication path. Ranked above 6 higher-CVSS findings because those are in non-production. Upgrade assistance is in scope [SOW §4.8]; the replacement auth service decision is still open [SOW §9 item 8] and should not gate patching a live CVE.",
      baseline: "n/a",
      current: "22.0.1",
      increase: "Active CVEs",
      date: "Sep 12, 2026 06:22:11",
      type: "SECURITY",
    },
    {
      id: "5",
      title: "P3 · TLS certificate for ss.com expires in 24 days",
      status: "ACKNOWLEDGED",
      description:
        "istio-system/ss-com-tls approaching expiry. Managed as a Kubernetes secret via Istio [SOW §4.4]. Memory: renewal has been routine 5/5 times at 6 min each — low risk, but a silent expiry takes ss.com down entirely.",
      baseline: "90 days",
      current: "24 days",
      increase: "—",
      date: "Sep 10, 2026 11:02:37",
      type: "SECURITY",
    },
    {
      id: "6",
      title: "P1 · Istio ingress 503s on checkout route",
      status: "RESOLVED",
      description:
        "Checkout route returned 503s during a push-notification burst as the node pool saturated. Node pool scaled 7 → 9 and the Istio destination-rule pool size raised. Cascade contained before ss.com user impact. Response 9 min, resolution 22 min — both inside the P1 SLO.",
      baseline: "0 errors",
      current: "503s on checkout",
      increase: "Resolved in 22 min",
      date: "Sep 10, 2026 21:14:09",
      type: "AVAILABILITY",
    },
    {
      id: "7",
      title: "P3 · Backup integrity check failed on first attempt",
      status: "RESOLVED",
      description:
        "ss-ops-db-01 integrity check failed, then passed on re-run. Root cause was the weekly archival job holding locks concurrently. Archival moved 20 min earlier in the window. Memory: a first-attempt failure that passes on re-run is a scheduling collision, not a corrupt backup.",
      baseline: "Pass",
      current: "Pass (re-run)",
      increase: "Resolved in 44 min",
      date: "Aug 25, 2026 02:51:18",
      type: "BACKUP",
    },
  ],
};

export default data;
