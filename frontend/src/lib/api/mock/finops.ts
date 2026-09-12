/* ------------------------------------------------------------------ */
/*  Intellicore CMP — FinOps seed data                                */
/*  Tenant: Shoppers Stop — eCommerce workloads.                      */
/*  Tower G — FinOps & Cost Management [SOW §4.9].                    */
/*                                                                     */
/*  All amounts are INR, matching the SOW's invoicing currency         */
/*  [SOW §10.2]. Figures are illustrative — the SOW pricing table      */
/*  (§10.1) is still TBD.                                             */
/*                                                                     */
/*  Cost lines total ≈ ₹11.2L/month and reconcile with the asset       */
/*  inventory in ./assets.ts. Reports are produced on the 1st and      */
/*  15th of each month [SOW §3.1, §4.9].                              */
/* ------------------------------------------------------------------ */

const data: Record<string, unknown> = {
  /** Run rate across all 7 GCP projects, in INR. */
  "/finops/monthly-trend": [
    { month: "Apr", cost: 982000 },
    { month: "May", cost: 1014000 },
    { month: "Jun", cost: 1071000 },
    { month: "Jul", cost: 1043000 },
    { month: "Aug", cost: 1098000 },
    { month: "Sep", cost: 1121200 },
  ],

  "/finops/costs": [
    {
      name: "GKE & Cloud Run",
      cost: 568200,
      breakdown: "Prod cluster ₹4.12L, non-prod ₹96K, Autopilot ₹38K, Cloud Run ₹22.2K",
      sparkData: [487000, 502000, 531000, 519000, 549000, 568200],
      sparkColor: "#6366f1",
      memory:
        "Largest single line, and growing with node-pool headroom held for sale events. A 1-year CUD on the production node pool is the biggest untaken saving — usage has been stable for 6 months.",
    },
    {
      name: "Databases (Cloud SQL)",
      cost: 231000,
      breakdown: "Magento ×4 ₹1.90L, operational ₹41K",
      sparkData: [223000, 226000, 228000, 228000, 230000, 231000],
      sparkColor: "#3b82f6",
      memory:
        "Flat and predictable. Note the 8.4 upgrade before Dec 2026 [SOW §4.5] is a migration cost, not a run-rate change — budget the engineering hours, not the licence.",
    },
    {
      name: "Compute / Windows VMs",
      cost: 165000,
      breakdown: "5 Windows VMs ₹1.42L, Jenkins ₹18.2K, jump host ₹4.8K",
      sparkData: [165000, 165000, 165000, 165000, 165000, 165000],
      sparkColor: "#f59e0b",
      memory:
        "Windows licensing makes these the most expensive compute per vCPU in the estate. The Dec 2026 GKE migration [SOW §4.7] retires 3 of 5 — roughly ₹85K/mo — which is the single largest planned saving in the engagement.",
    },
    {
      name: "Storage & CDN",
      cost: 74000,
      breakdown: "Campaign + product imagery, Standard class",
      sparkData: [61000, 64000, 69000, 66000, 71000, 74000],
      sparkColor: "#10b981",
      memory:
        "Rises ahead of every campaign as creative is staged, then stays up because nothing lifecycles it out. Prior retail accounts recovered 20–30% with a Nearline rule on assets older than 90 days.",
    },
    {
      name: "Cache (Redis)",
      cost: 52000,
      breakdown: "Memorystore 16 GB HA",
      sparkData: [52000, 52000, 52000, 52000, 52000, 52000],
      sparkColor: "#ef4444",
      memory:
        "Fixed. Sized for sale-day peak rather than steady state — correct trade-off for ss.com, since a cache miss storm is the documented first step in the cascading-failure pattern.",
    },
    {
      name: "Networking & Edge",
      cost: 31000,
      breakdown: "Nitrogen LB + Cloud Armor, 3 VPCs",
      sparkData: [28000, 29000, 30000, 29000, 30000, 31000],
      sparkColor: "#8b5cf6",
      memory:
        "Tracks traffic. Cloud Armor rule count has no material cost impact — do not trade security rules for ₹1–2K.",
    },
  ],

  "/finops/optimizations": [
    {
      recommendation: "1-year CUD on production GKE node pool",
      appliedDate: null,
      savings: "est. ₹1.02L/mo",
      status: "available" as const,
      memory:
        "Usage stable for 6 months at or above the commit floor. CUD planning is in scope [SOW §4.9]; the purchase itself is Client-executed — Searce does not negotiate or procure commitments [SOW §4.9, out-of-scope].",
    },
    {
      recommendation: "Retire 3 Windows VMs post-GKE migration",
      appliedDate: null,
      savings: "est. ₹85.2K/mo",
      status: "pending" as const,
      memory:
        "Contingent on the Dec 2026 migration [SOW §4.7]. Target end-state is 2–3 VMs retained. Saving lands the month after cutover, not at project start.",
    },
    {
      recommendation: "Nearline lifecycle on campaign assets > 90 days",
      appliedDate: null,
      savings: "est. ₹18.5K/mo",
      status: "available" as const,
      memory:
        "1.4 TB of expired campaign creative in Standard class. Needs a Client call on retention for legal/brand reasons before it can be applied — lifecycle policy management is in scope [SOW §4.3].",
    },
    {
      recommendation: "Right-size non-production cluster off-hours",
      appliedDate: "Aug 22",
      savings: "₹31K/mo",
      status: "applied" as const,
      memory:
        "UAT scaled to zero between 21:00 and 07:00 IST. No impact on the UAT test window, which runs inside business hours. Two UAT environments in scope [SOW §4.2].",
    },
    {
      recommendation: "Delete 6 orphaned persistent disks",
      appliedDate: "Aug 8",
      savings: "₹9.4K/mo",
      status: "applied" as const,
      memory:
        "Left behind by earlier VM rebuilds in ss-ecom-dev. No snapshot referenced them. Verified with the Client before deletion.",
    },
    {
      recommendation: "Sustained use discount review across 7 projects",
      appliedDate: "Jul 30",
      savings: "₹12.8K/mo",
      status: "applied" as const,
      memory:
        "SUD applies automatically but only where workloads are not fragmented across too many small instances. Consolidating 4 small dev VMs into 2 moved them over the SUD threshold.",
    },
  ],

  "/finops/anomalies": [
    {
      title: "Cloud Storage egress +214% over 36 hours",
      severity: "active" as const,
      timeAgo: "6 hours ago",
      service: "Cloud Storage",
      extra: "≈ ₹48K projected overspend this cycle",
      memory:
        "Campaign creative for the festive sale is being served directly from the ss-ecom-assets bucket rather than through the CDN, so every image request bills as egress. Memory: the identical pattern appeared before the Aug campaign and was resolved by pointing the campaign CMS at the CDN origin instead of the bucket URL. That fix cut egress 78% within two hours.",
      confidence: "84% same root cause",
      suggestedFix:
        "Repoint campaign asset URLs at the CDN origin. The CMS template still holds direct bucket links — same template, same line as the Aug incident.",
      timeline: [
        "Sep 10 18:00 — Festive campaign creative uploaded to ss-ecom-assets",
        "Sep 11 09:20 — Egress crossed 2σ above 7-day baseline",
        "Sep 12 04:10 — Intellicore raised cost anomaly; pattern matched to Aug campaign (84%)",
        "Sep 12 04:12 — Ticket raised to Client CMS owner via ITSM",
      ],
    },
    {
      title: "Non-production cluster ran at full scale overnight",
      severity: "resolved" as const,
      timeAgo: "9 days ago",
      service: "GKE",
      extra: "Resolved, ₹31K/mo recurring saving",
      memory:
        "UAT node pools were never scaled down outside test hours. Applied a scheduled scale-to-zero between 21:00 and 07:00 IST after confirming with the Client that UAT testing runs in business hours only. Saving is recurring rather than one-off.",
      confidence: null,
      suggestedFix: null,
      timeline: [
        "Sep 2 — Idle-capacity pattern detected across 14 consecutive nights",
        "Sep 3 — Client confirmed UAT is business-hours only",
        "Sep 3 — Scheduled scale-to-zero applied",
        "Sep 4 — Saving verified against next billing export",
      ],
    },
    {
      title: "Cloud SQL storage growth flagged on ss-magento-db-01",
      severity: "false-positive" as const,
      timeAgo: "17 days ago",
      service: "Cloud SQL",
      extra: "No action — expected growth",
      memory:
        "Flagged as runaway growth at 780 GB of 1024 GB. Investigation showed it tracks catalogue expansion ahead of the festive season and matches the same curve as the previous two years. Detection rebaselined against seasonal catalogue load rather than a flat threshold. Disk headroom still needs a resize decision before December — raised separately as a P3.",
      confidence: null,
      suggestedFix: null,
      timeline: [
        "Aug 26 — Storage growth crossed flat threshold",
        "Aug 27 — Compared against FY24 and FY25 festive curves — within 4%",
        "Aug 27 — Threshold rebaselined to seasonal model",
        "Aug 28 — Separate P3 raised for pre-December disk resize",
      ],
    },
  ],

  "/finops/forecast": [
    {
      month: "Oct",
      cost: 1187000,
      note: "Festive sale traffic peaks. Assumes egress anomaly fixed and node-pool headroom held through the sale window — do not right-size during a sale.",
    },
    {
      month: "Nov",
      cost: 1142000,
      note: "Post-festive normalisation. Nearline lifecycle assumed applied from mid-month once Client confirms retention.",
    },
    {
      month: "Dec",
      cost: 1058000,
      note: "First month reflecting the Windows VM retirement, if the GKE migration lands on the December target [SOW §4.7]. Slips to Jan if it does not.",
    },
  ],

  "/finops/risk-factors": [
    "The Dec 2026 Windows VM migration carries ₹85K/mo of forecast saving. If it slips, the FY forecast slips with it — this is the single largest dependency in the cost model.",
    "ss-magento-db-01 is at 76% of provisioned storage and growing with the catalogue. A resize is needed before December; it is a one-time step change, not a rate change.",
    "GKE node-pool headroom held for sale events is deliberate over-provisioning. It looks like waste in any generic right-sizing report — do not action it without checking the sale calendar [SOW §7.2 requires 48h notice of sale events].",
    "PITR on ss-ops-db-01 is currently disabled. Enabling it to meet the §4.5 restore commitment will add CloudSQL disk cost — small, but it should not arrive as a surprise on the 15th report.",
  ],
};

export default data;
