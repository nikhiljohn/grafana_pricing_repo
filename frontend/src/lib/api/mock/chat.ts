/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Memory Chat seed responses                       */
/*  Canned answers used when there's no live backend to ask (see       */
/*  lib/api/chat.ts, which tries the real /memory/chat endpoint first   */
/*  and falls back to this module). Keyed by tenant so the AIOps        */
/*  "Query Infrastructure" chat actually changes with the org switcher  */
/*  instead of showing the same sample conversation for every customer. */
/* ------------------------------------------------------------------ */

export interface MockChatTurn {
  match: RegExp;
  answer: string;
  confidence: string | null;
  suggestedFix: string | null;
}

const NETCORE: MockChatTurn[] = [
  {
    match: /chang(e|ed)/i,
    answer:
      "31 VMs stable, 2 GKE node pools auto-scaled and recovered in 6-9 min. FinOps: BigQuery spend spiked +340% on the nightly ETL job. DevOps: 112 deployments, 1 rollback (Terraform state lock, resolved in 3 min).",
    confidence: null,
    suggestedFix: null,
  },
  {
    match: /cost/i,
    answer:
      "The active BigQuery cost anomaly — +340% in the last 4 hours, about $42 excess this run. It matches the Jul 15 ETL spike: an unoptimized JOIN scanning the full 2TB analytics.events table after a partition filter was removed.",
    confidence: "88% same root cause",
    suggestedFix: "Re-apply the partition filter used on Jul 15 to the nightly ETL DAG.",
  },
  {
    match: /finding|fix first/i,
    answer:
      "3 GKE service accounts still use the default compute service account (CIS 5.1) — already fixed on 2 of 5 clusters. That's your fastest win; everything else this week is low severity.",
    confidence: "74% pattern match",
    suggestedFix: "Scope a custom service account per workload on the remaining 3 clusters.",
  },
  {
    match: /deploy(ment)? pattern/i,
    answer:
      "Friday deployments have led to a weekend P2 incident 4 times in the last 154 days — a 23% higher failure rate than any other day. GKE deployments themselves have a 0% failure rate across 34 consecutive releases; the risk is timing, not the pipeline.",
    confidence: null,
    suggestedFix: null,
  },
];

const AARTI: MockChatTurn[] = [
  {
    match: /chang(e|ed)/i,
    answer:
      "18 EC2 instances stable, all within the compliance-mandated ap-south-1 region. Cloud Security: 5 security groups still allow SSH from the internet (CIS 5.2), flagged 2h ago. No cost anomalies.",
    confidence: null,
    suggestedFix: null,
  },
  {
    match: /cost/i,
    answer:
      "You don't have an active cost anomaly — FinOps is healthy this month at $22K, +3% MoM. Your real risk right now is compliance, not cost: the open SSH finding, with Q3 audit prep underway.",
    confidence: null,
    suggestedFix: null,
  },
  {
    match: /finding|fix first/i,
    answer:
      "5 security groups allowing SSH from 0.0.0.0/0 (CIS 5.2). The identical finding was auto-remediated across 3 Aarti accounts on Jul 12 — restrict to the VPN CIDR.",
    confidence: "96% auto-fix confidence",
    suggestedFix: "Restrict the 5 open security groups to VPN CIDR 10.0.0.0/8 — the same fix applied 12 times before.",
  },
  {
    match: /deploy(ment)? pattern/i,
    answer:
      "22 deployments this month, 0 failures. IAM changes correlate with about 35% of your security findings within 48 hours — that's the pattern worth watching, not deployment failures.",
    confidence: null,
    suggestedFix: null,
  },
];

const SHOPSTOP: MockChatTurn[] = [
  {
    match: /chang(e|ed)/i,
    answer:
      "64 VMs stable, checkout-service pre-scaled to 3x ahead of the sale window. The SAP HANA workload passed its quarterly performance review. One new signal: checkout-service egress is anomalous (3.3σ) — a different signature than the known Jun 2 false positive.",
    confidence: null,
    suggestedFix: null,
  },
  {
    match: /cost/i,
    answer:
      "Pre-sale compute scaling, which typically adds 10-15% to spend for about 5 days — expected, not anomalous. Nothing else is trending unexpectedly, including the SAP tier.",
    confidence: null,
    suggestedFix: null,
  },
  {
    match: /finding|fix first/i,
    answer:
      "The checkout-service egress anomaly ahead of the sale window. It looks similar to a Jun 2 false positive (a backup job) but the signature differs enough that Memory is treating it as likely real.",
    confidence: "78% likely real, not a false positive",
    suggestedFix: "Investigate the egress source before the sale window opens — don't auto-suppress like the Jun 2 case.",
  },
  {
    match: /deploy(ment)? pattern/i,
    answer:
      "0% deployment failure rate across the last 19 Cloud Run releases. Deploy freezes 48h before sale events have kept the incident rate at 0% for 3 consecutive sale windows.",
    confidence: null,
    suggestedFix: null,
  },
];

const DESIGNX: MockChatTurn[] = [
  {
    match: /chang(e|ed)/i,
    answer:
      "12 VMs stable, all serverless-first workloads within thresholds. DevOps: deploy-bot was granted project Editor — the pre-deploy guardrail caught it and suggested a least-privilege role before it shipped.",
    confidence: null,
    suggestedFix: null,
  },
  {
    match: /cost/i,
    answer:
      "No active cost anomaly — FinOps is flat at $10K/mo. Your only open item this week is the IAM guardrail catch on deploy-bot, which has no cost impact.",
    confidence: null,
    suggestedFix: null,
  },
  {
    match: /finding|fix first/i,
    answer:
      "deploy-bot's Editor grant. On May 9, the same pattern led to a privilege-escalation finding — the guardrail now catches it before it ships, 3 times so far this quarter.",
    confidence: "87% pattern match",
    suggestedFix: "Apply the least-privilege role the guardrail already generated for deploy-bot.",
  },
  {
    match: /deploy(ment)? pattern/i,
    answer:
      "28 consecutive Cloud Run deployments with zero failures. Canary deploys plus automated smoke tests are the highest-leverage guardrail for this workload shape.",
    confidence: null,
    suggestedFix: null,
  },
];

const DMART: MockChatTurn[] = [
  {
    match: /chang(e|ed)/i,
    answer:
      "GKE node pool auto-scaled 3x for flash-sale traffic; 2 hcl-commerce-checkout pods restarted after being OOMKilled. A Helm rollout to hcl-commerce-catalog is pending approval.",
    confidence: null,
    suggestedFix: null,
  },
  {
    match: /cost/i,
    answer:
      "Node pool spend after the last 2 flash-sale windows — pools stayed scaled up for 4 extra days before scaling back. An automated 48h post-sale scale-down is already saving about $860/mo, but it isn't applied to every node pool yet.",
    confidence: null,
    suggestedFix: null,
  },
  {
    match: /finding|fix first/i,
    answer:
      "hcl-commerce-checkout pods being OOMKilled under flash-sale load. This is the 3rd time in 70 days — JVM heap keeps exceeding the pod's 2Gi memory limit.",
    confidence: "91% same root cause",
    suggestedFix: "Raise the checkout pod memory limit and tune the JVM -Xmx flag together — the same fix applied last time.",
  },
  {
    match: /deploy(ment)? pattern/i,
    answer:
      "40+ GKE deploys/week with a 96% success rate — 1 Helm rollback this week after a search-service latency regression, resolved in 6 minutes.",
    confidence: null,
    suggestedFix: null,
  },
];

const BY_TENANT: Record<string, MockChatTurn[]> = {
  netcore: NETCORE,
  aarti: AARTI,
  shopstop: SHOPSTOP,
  designx: DESIGNX,
  dmart: DMART,
};

const FALLBACK =
  "I don't have enough graph evidence to answer that specific question yet. Try one of the suggested questions above, or connect a real account so Memory can build a graph from your own events.";

export function mockAskMemory(
  question: string,
  tenantId: string,
): { answer: string; confidence: string | null; suggestedFix: string | null } {
  const turns = BY_TENANT[tenantId] ?? NETCORE;
  const hit = turns.find((t) => t.match.test(question));
  if (hit) {
    return { answer: hit.answer, confidence: hit.confidence, suggestedFix: hit.suggestedFix };
  }
  return { answer: FALLBACK, confidence: null, suggestedFix: null };
}
