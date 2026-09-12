/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Memory seed data                                */
/*  Tenant: Shoppers Stop — eCommerce workloads.                      */
/*                                                                     */
/*  Operational Memory is the product's differentiator: every alert,   */
/*  anomaly and finding is contextualised by what happened before on   */
/*  THIS estate and how it was resolved. These entries are the         */
/*  recurring incident shapes of an Indian retail eCommerce platform   */
/*  — cascading failure on ss.com, sale-day capacity, Magento schema   */
/*  releases, and the Windows VM estate on its way out.                */
/*                                                                     */
/*  Served by apiFetch() when no backend is configured.                */
/* ------------------------------------------------------------------ */

const data: Record<string, unknown> = {
  "/memory/entries": [
    {
      id: 1,
      daysAgo: "2d ago",
      pillar: "CloudOps",
      confidence: 93,
      title: "Cascading failure on checkout under push-notification burst",
      context:
        "A marketing push drove a traffic spike into ss-ecom-prod-cluster. Istio ingress returned 503s on the checkout route as the node pool saturated at 81% memory, and the Magento pods began evicting before autoscaling caught up.",
      learning:
        "The cascade always starts at the checkout route, not the homepage. Pre-scaling the node pool 2 nodes ahead of a push — rather than reacting to it — contains it. Reactive autoscale is 6–8 min too slow for ss.com.",
      applied: 4,
    },
    {
      id: 2,
      daysAgo: "4d ago",
      pillar: "CloudOps",
      confidence: 88,
      title: "Magento connection-pool growth is linear, not spiky",
      context:
        "ss-magento-db-01 reached 460 of 500 connections. Idle Magento connections were being held open by a reporting query that never released them.",
      learning:
        "Connections climb ~14%/week between releases and reset on deploy. That makes it predictable: project the line and raise a P3 nine days out rather than waiting for the 03:00 P1. Raising max_connections treats the symptom.",
      applied: 3,
    },
    {
      id: 3,
      daysAgo: "6d ago",
      pillar: "CloudOps",
      confidence: 79,
      title: "Windows VM memory creep after campaign pushes",
      context:
        "ss-prod-ecom-api held 88% memory for six hours after a campaign push. A restart cleared it; no infrastructure fault was found.",
      learning:
        "The leak is application-side and out of Searce scope [SOW §4.7]. The operational answer is to bring the scheduled restart forward into the window rather than to escalate. This retires entirely with the Dec 2026 GKE migration.",
      applied: 5,
    },
    {
      id: 4,
      daysAgo: "9d ago",
      pillar: "CloudOps",
      confidence: 95,
      title: "Autopilot evictions are not incidents",
      context:
        "Catalogue workload pods were evicted on ss-web-autopilot and rescheduled within 90 seconds with no user impact.",
      learning:
        "GKE Autopilot self-repairs faster than a human can open the ticket. Log for pattern tracking, never page. This single rule removed a recurring source of overnight L1 noise.",
      applied: 11,
    },
    {
      id: 5,
      daysAgo: "12d ago",
      pillar: "CloudOps",
      confidence: 91,
      title: "Egress spikes from the catalogue feed export are benign",
      context:
        "ss-nitrogen-lb-prod showed a 3.1σ egress anomaly. The source subnet traced to the scheduled catalogue feed export, not the payment path.",
      learning:
        "Distinguish by source subnet, not magnitude. Export-subnet egress is benign; payment-subnet egress at the same sigma is a genuine P1. Magnitude alone produces false positives on this estate.",
      applied: 4,
    },
    {
      id: 6,
      daysAgo: "15d ago",
      pillar: "DevOps",
      confidence: 86,
      title: "Releases carrying schema changes are the ones that roll back",
      context:
        "magento-release-r47 timed out during schema migration at 02:52 and was rolled back inside the window. r44 failed the same way in July when a migration locked the orders table.",
      learning:
        "Both 90-day deploy failures carried a schema change; the nine releases without one all succeeded. Schema-bearing releases need a UAT rehearsal and a longer window slot. Governance for this is still an open SOW item (§9 item 1).",
      applied: 2,
    },
    {
      id: 7,
      daysAgo: "18d ago",
      pillar: "CloudOps",
      confidence: 84,
      title: "Backup integrity failures are usually archival lock contention",
      context:
        "The backup integrity check on ss-ops-db-01 failed on first attempt, then succeeded on re-run. Root cause was the weekly archival job holding locks concurrently.",
      learning:
        "Sequence the archival job 20 minutes ahead of the integrity check rather than running both at 02:00. A failed first attempt that passes on re-run is a scheduling collision, not a corrupt backup — do not escalate it as one.",
      applied: 2,
    },
    {
      id: 8,
      daysAgo: "21d ago",
      pillar: "FinOps",
      confidence: 84,
      title: "Campaign creative served from the bucket, not the CDN",
      context:
        "Storage egress rose 214% before the festive campaign. The campaign CMS template held direct bucket URLs, so every image request billed as egress instead of hitting the CDN.",
      learning:
        "Same template, same line, every campaign. Check the CMS asset URLs as a pre-campaign step — the fix cut egress 78% within two hours both times it was applied.",
      applied: 2,
    },
    {
      id: 9,
      daysAgo: "26d ago",
      pillar: "Cloud Security",
      confidence: 89,
      title: "Rank findings by exploitability on this estate, not CVSS",
      context:
        "Six findings carried higher CVSS than the Keycloak 22.0.1 CVE, but all six were in non-production. Keycloak sits on the live ss.com authentication path.",
      learning:
        "Raw CVSS ordering sends the engineer to non-production first. Rank by blast radius against the production serving path — that reordering is most of the value of AI triage over a plain CSPM list.",
      applied: 6,
    },
    {
      id: 10,
      daysAgo: "29d ago",
      pillar: "FinOps",
      confidence: 92,
      title: "Sale-window headroom looks like waste to a right-sizing report",
      context:
        "A generic right-sizing pass flagged the production node pool as over-provisioned. The headroom was deliberately held for the festive sale window.",
      learning:
        "Never action a right-sizing recommendation against production GKE without checking the sale calendar. The SOW requires 48h notice of sale events [§7.2] — that notice is also the signal not to downsize.",
      applied: 3,
    },
  ],

  "/memory/patterns": [
    {
      name: "Checkout cascade under traffic burst",
      occurrences: 4,
      autoResolved: 25,
      avgTime: "22 min",
      trend: "Improving",
      bars: [2, 1, 1, 0, 0, 0],
    },
    {
      name: "Magento connection-pool growth",
      occurrences: 3,
      autoResolved: 67,
      avgTime: "31 min",
      trend: "Improving",
      bars: [1, 1, 0, 1, 0, 0],
    },
    {
      name: "Autopilot pod eviction (benign)",
      occurrences: 11,
      autoResolved: 100,
      avgTime: "2 min",
      trend: "Stable",
      bars: [2, 2, 1, 2, 2, 2],
    },
    {
      name: "Catalogue export egress false positive",
      occurrences: 4,
      autoResolved: 100,
      avgTime: "5 min",
      trend: "Stable",
      bars: [1, 0, 1, 1, 0, 1],
    },
    {
      name: "Schema-bearing release rollback",
      occurrences: 2,
      autoResolved: 0,
      avgTime: "47 min",
      trend: "New",
      bars: [0, 0, 1, 0, 0, 1],
    },
    {
      name: "Windows VM memory creep",
      occurrences: 5,
      autoResolved: 80,
      avgTime: "12 min",
      trend: "Stable",
      bars: [1, 1, 1, 0, 1, 1],
    },
    {
      name: "Pre-campaign storage egress spike",
      occurrences: 2,
      autoResolved: 50,
      avgTime: "2 h",
      trend: "New",
      bars: [0, 0, 0, 1, 0, 1],
    },
  ],

  "/memory/remediation-library": [
    {
      fix: "Pre-scale prod node pool ahead of push/sale",
      confidence: 93,
      timesApplied: 4,
      successRate: "100%",
      lastApplied: "3h ago",
      pillar: "CloudOps",
    },
    {
      fix: "Reap idle Magento connections",
      confidence: 88,
      timesApplied: 3,
      successRate: "100%",
      lastApplied: "4d ago",
      pillar: "CloudOps",
    },
    {
      fix: "Bring Windows VM restart forward into window",
      confidence: 79,
      timesApplied: 5,
      successRate: "100%",
      lastApplied: "6d ago",
      pillar: "CloudOps",
    },
    {
      fix: "Rebaseline egress threshold by source subnet",
      confidence: 91,
      timesApplied: 4,
      successRate: "100%",
      lastApplied: "12d ago",
      pillar: "CloudOps",
    },
    {
      fix: "Repoint campaign assets at CDN origin",
      confidence: 84,
      timesApplied: 2,
      successRate: "100%",
      lastApplied: "21d ago",
      pillar: "FinOps",
    },
    {
      fix: "Renew + rotate TLS secret via Istio",
      confidence: 97,
      timesApplied: 5,
      successRate: "100%",
      lastApplied: "8d ago",
      pillar: "Cloud Security",
    },
    {
      fix: "Sequence archival ahead of integrity check",
      confidence: 84,
      timesApplied: 2,
      successRate: "100%",
      lastApplied: "18d ago",
      pillar: "CloudOps",
    },
    {
      fix: "Scale UAT to zero outside business hours",
      confidence: 90,
      timesApplied: 1,
      successRate: "100%",
      lastApplied: "9d ago",
      pillar: "FinOps",
    },
  ],

  "/memory/learnings": [
    {
      insight:
        "Every deploy failure in 90 days carried a database schema change; all 9 releases without one succeeded. Schema governance is the highest-leverage open item on this account (SOW §9 item 1).",
      crossPillar: "DevOps × Database",
    },
    {
      insight:
        "The ss.com cascade always begins at the checkout route. Watching checkout latency gives 6–8 minutes of warning that watching homepage or cluster-level metrics does not.",
      crossPillar: "CloudOps × AIOps",
    },
    {
      insight:
        "Ranking security findings by blast radius against the production serving path, rather than by CVSS, moved the genuinely urgent finding from 7th to 1st in the queue.",
      crossPillar: "Cloud Security × AIOps",
    },
    {
      insight:
        "Two of the three largest cost movements this quarter were configuration mistakes, not capacity growth — bucket-served campaign assets and UAT running overnight. Anomaly narratives found both; a static budget alert would have found neither.",
      crossPillar: "FinOps × CloudOps",
    },
    {
      insight:
        "Deliberate over-provisioning for sale windows is indistinguishable from waste without the sale calendar. Every right-sizing recommendation against production GKE must be checked against the 48h sale notice.",
      crossPillar: "FinOps × delivery process",
    },
    {
      insight:
        "MTTR on a repeat pattern is 22% lower than on first occurrence. The 5 patterns already seen twice on this estate are the ones the squad now resolves inside SLA without escalating.",
      crossPillar: "meta-learning",
    },
  ],
};

export default data;
