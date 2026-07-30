"use client";

import { useState } from "react";

type FinOpsTab = "cost-intelligence" | "optimization-memory" | "anomalies" | "forecasting";

const TAB_LABELS: Record<FinOpsTab, string> = {
  "cost-intelligence": "Cost Intelligence",
  "optimization-memory": "Optimization Memory",
  anomalies: "Anomalies",
  forecasting: "Forecasting",
};

/* ------------------------------------------------------------------ */
/*  Sparkline helper — 6-month inline SVG                              */
/* ------------------------------------------------------------------ */
function Sparkline({ data, color = "#3b82f6" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="inline-block align-middle">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Monthly bar chart data                                             */
/* ------------------------------------------------------------------ */
const monthlyTrend = [
  { month: "Feb", cost: 480 },
  { month: "Mar", cost: 520 },
  { month: "Apr", cost: 510 },
  { month: "May", cost: 560 },
  { month: "Jun", cost: 590 },
  { month: "Jul", cost: 637 },
];

/* ------------------------------------------------------------------ */
/*  Cost by Pillar data                                                */
/* ------------------------------------------------------------------ */
const pillars = [
  {
    name: "CloudOps",
    cost: 368,
    breakdown: "Compute $280, Networking $58, Storage $30",
    sparkData: [290, 310, 320, 340, 355, 368],
    sparkColor: "#3b82f6",
    memory:
      "Committed use discounts saved $67/mo on project A since applying in May. Compute costs stabilized after right-sizing in April.",
  },
  {
    name: "FinOps overhead",
    cost: 0,
    breakdown: "Platform cost absorbed in MRR",
    sparkData: [0, 0, 0, 0, 0, 0],
    sparkColor: "#94a3b8",
    memory: "No direct cost. FinOps tooling and analysis overhead is included in Searce managed services MRR.",
  },
  {
    name: "SecOps",
    cost: 42,
    breakdown: "SCC Premium, Wiz",
    sparkData: [40, 41, 42, 42, 42, 42],
    sparkColor: "#10b981",
    memory: "Stable, no anomalies. SCC Premium enabled since Feb. Wiz license fixed cost, renews in Q1.",
  },
  {
    name: "DevOps",
    cost: 86,
    breakdown: "Cloud Build, Artifact Registry, Functions",
    sparkData: [95, 98, 96, 94, 98, 86],
    sparkColor: "#8b5cf6",
    memory:
      "Switched to 2nd gen Functions in June, saved $12/mo on cold starts. Build minutes stable after caching improvements.",
  },
  {
    name: "AIOps",
    cost: 28,
    breakdown: "Vertex AI, BigQuery ML",
    sparkData: [18, 20, 22, 24, 25, 28],
    sparkColor: "#f59e0b",
    memory:
      "Active anomaly on BigQuery (see above). Vertex AI spend growing with increased model training runs. Review reserved slots by Q4.",
  },
];

/* ------------------------------------------------------------------ */
/*  Optimization recommendations                                       */
/* ------------------------------------------------------------------ */
const optimizations = [
  {
    recommendation: "Committed use discount on Compute Engine",
    appliedDate: "May 12",
    savings: "$67/mo",
    status: "applied" as const,
    memory: "ROI breakeven reached in 3 weeks. 1-year CUD on n2-standard-8 for project-a production workloads.",
  },
  {
    recommendation: "Switch Cloud Functions to 2nd gen",
    appliedDate: "Jun 3",
    savings: "$12/mo",
    status: "applied" as const,
    memory:
      "Cold start p99 also improved 2.1s to 340ms. Migrated 14 functions across 3 services with zero downtime.",
  },
  {
    recommendation: "Delete 3 unattached persistent disks",
    appliedDate: "Jun 15",
    savings: "$18/mo",
    status: "applied" as const,
    memory:
      "Disks were orphaned after VM migration in May. 2x 200GB SSD + 1x 500GB standard. No snapshots referenced them.",
  },
  {
    recommendation: "Right-size clens-dev to e2-standard-4",
    appliedDate: "Jul 27",
    savings: "$8/mo",
    status: "applied" as const,
    memory:
      "Applied after CPU spike incident on Jul 25. Peak usage was only 22% on previous e2-standard-8. Downsized with zero performance impact.",
  },
  {
    recommendation: "Apply partition filter to BigQuery ETL",
    appliedDate: null,
    savings: "est. $42/mo",
    status: "pending" as const,
    memory:
      "Same fix resolved Jul 15 spike. Current ETL pipeline scans full 2TB table on each run. Adding partition filter would reduce scan to ~45GB.",
  },
  {
    recommendation: "Cloud SQL committed use discount",
    appliedDate: null,
    savings: "est. $22/mo",
    status: "available" as const,
    memory:
      "Requires 1-yr commitment, payback in 4 months. db-custom-4-16384 instance running 24/7 for 11 months. Usage pattern is stable.",
  },
  {
    recommendation: "Lifecycle policies on 14 Storage buckets",
    appliedDate: null,
    savings: "est. $12/mo",
    status: "available" as const,
    memory:
      "Standard class with <1 access/month identified for Nearline. 8 of 14 buckets are compliance-required hot storage (excluded). 6 eligible buckets total 1.8TB.",
  },
];

/* ------------------------------------------------------------------ */
/*  Anomalies                                                          */
/* ------------------------------------------------------------------ */
const anomalies = [
  {
    title: "BigQuery cost spike: +340% in last 4 hours",
    severity: "active" as const,
    timeAgo: "4 hours ago",
    service: "BigQuery",
    extra: "$42 estimated overspend",
    memory:
      "This matches the ETL spike pattern from Jul 15 (30d ago). That incident cost $42 extra and was caused by an unoptimized JOIN on the 2TB analytics.events table. The query scanned the full table instead of using the _PARTITIONDATE filter. Resolution on Jul 15: Added partition filter and optimized JOIN, reducing scan from 2TB to 45GB. Processing time dropped from 8min to 22sec.",
    confidence: "88% same root cause",
    suggestedFix: "Apply same partition filter to current query pipeline. The offending query is in the nightly ETL DAG (airflow-prod/dags/etl_analytics.py, line 142).",
    timeline: [
      "Jul 30 02:00 — ETL DAG triggered (normal schedule)",
      "Jul 30 02:04 — BigQuery scan exceeded 1TB threshold",
      "Jul 30 02:12 — Cost anomaly detected by Intellicore",
      "Jul 30 02:15 — Pattern matched to Jul 15 incident (88% confidence)",
    ],
  },
  {
    title: "Compute Engine egress +85% WoW",
    severity: "resolved" as const,
    timeAgo: "5 days ago",
    service: "Compute Engine",
    extra: "Resolved in 2h",
    memory:
      "Cross-region replication job was running without compression between us-central1 and europe-west1. The backup sync for project-b was transferring ~180GB/day uncompressed. Resolution: Added gzip compression to the replication pipeline, reducing transfer to ~35GB/day. Egress normalized within 2 hours of applying the fix. Ongoing monitoring confirms stable egress since.",
    confidence: null,
    suggestedFix: null,
    timeline: [
      "Jul 25 08:00 — Egress anomaly detected (+85% vs 7-day avg)",
      "Jul 25 08:30 — Root cause identified: uncompressed cross-region replication",
      "Jul 25 09:15 — Compression applied to replication pipeline",
      "Jul 25 10:00 — Egress normalized, anomaly resolved",
    ],
  },
  {
    title: "Cloud Storage class mismatch",
    severity: "false-positive" as const,
    timeAgo: "14 days ago",
    service: "Cloud Storage",
    extra: "Partial action taken",
    memory:
      "Flagged 14 Standard class buckets with <1 access/month as candidates for Nearline. Analysis showed 8 of 14 are compliance-required hot storage (SOC2 audit logs, PCI transaction records) that must remain in Standard class per policy. Adjusted recommendation: 6 buckets moved to Nearline ($12/mo saved), 8 kept as Standard with documented justification. Updated detection rules to exclude compliance-tagged buckets.",
    confidence: null,
    suggestedFix: null,
    timeline: [
      "Jul 16 — 14 buckets flagged for storage class mismatch",
      "Jul 17 — Analysis revealed 8 compliance-required buckets",
      "Jul 18 — 6 eligible buckets moved to Nearline",
      "Jul 18 — Detection rules updated to exclude compliance tags",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Forecasting data                                                   */
/* ------------------------------------------------------------------ */
const forecast = [
  {
    month: "Aug",
    cost: 680,
    note: "Assumes BigQuery anomaly resolved and partition filter applied. Compute stable with existing CUDs.",
  },
  {
    month: "Sep",
    cost: 650,
    note: "CUD savings fully amortized + Cloud SQL CUD applied. Functions optimization running full month.",
  },
  {
    month: "Oct",
    cost: 620,
    note: "All available recommendations applied. Storage lifecycle policies in effect for full billing cycle.",
  },
];

const riskFactors = [
  "BigQuery usage trending +15% MoM from increased ML training data. May need reserved slots by Q4 if trend continues.",
  "Vertex AI spend growing with new model experiments. Current on-demand pricing acceptable below $50/mo, review if exceeded.",
  "Cloud SQL instance approaching 80% storage capacity. May need disk resize by Sep (one-time cost, no ongoing increase).",
];

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */
export default function FinOpsIntelligencePage() {
  const [tab, setTab] = useState<FinOpsTab>("cost-intelligence");

  const maxCost = Math.max(...monthlyTrend.map((m) => m.cost));

  /* annotation positions for the bar chart */
  const annotations: Record<string, { label: string; color: string }> = {
    May: { label: "CUD applied", color: "#10b981" },
    Jun: { label: "Functions optimized", color: "#8b5cf6" },
    Jul: { label: "BigQuery anomaly", color: "#f59e0b" },
  };

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* ===== Header ===== */}
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">FinOps Intelligence</h1>
              <p className="text-sm text-slate-500">
                Cost optimization with operational memory — every anomaly has context, every recommendation has history
              </p>
            </div>
          </div>
          <select className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-emerald-500 focus:outline-none">
            <option>searce-sandbox</option>
            <option>production-org</option>
          </select>
        </div>
      </div>

      {/* ===== Intelligence Score ===== */}
      <div className="border-b border-slate-200 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">FinOps Health:</span>
            <span className="rounded-full bg-amber-100 px-3 py-0.5 text-sm font-semibold text-amber-700">78 / 100</span>
          </div>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-sm text-amber-600">Cost anomaly active: BigQuery +340%</span>
        </div>
      </div>

      {/* ===== Stats Row ===== */}
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="grid grid-cols-5 gap-4">
          {/* Current Month */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Current Month</div>
            <div className="text-2xl font-semibold text-slate-800">$637</div>
            <div className="mt-1 text-xs text-amber-600">+8% MoM</div>
          </div>
          {/* Forecasted */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Forecasted</div>
            <div className="text-2xl font-semibold text-slate-800">$702</div>
            <div className="mt-1 text-xs text-slate-500">based on current trajectory + anomaly</div>
          </div>
          {/* Savings Applied */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Savings Applied</div>
            <div className="text-2xl font-semibold text-emerald-600">$105/mo</div>
            <div className="mt-1 text-xs text-slate-500">from 7 recommendations this quarter</div>
          </div>
          {/* Savings Available */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Savings Available</div>
            <div className="text-2xl font-semibold text-blue-600">$210/mo</div>
            <div className="mt-1 text-xs text-slate-500">5 unactioned recommendations</div>
          </div>
          {/* Budget Usage */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Budget Usage</div>
            <div className="text-2xl font-semibold text-slate-800">85%</div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-amber-500" style={{ width: "85%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== Tabs ===== */}
      <div className="border-b border-slate-200 px-6">
        <div className="flex gap-0">
          {(Object.keys(TAB_LABELS) as FinOpsTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                tab === t ? "border-b-2 border-emerald-500 text-emerald-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Tab Content ===== */}
      <div className="px-6 py-6">
        {/* ============================================================ */}
        {/*  COST INTELLIGENCE TAB                                        */}
        {/* ============================================================ */}
        {tab === "cost-intelligence" && (
          <div className="space-y-6">
            {/* --- Active Anomaly Card --- */}
            <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm font-semibold text-amber-700">ACTIVE ANOMALY</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-800">
                BigQuery cost spike: +340% in last 4 hours
              </h3>
              <div className="mb-3 rounded-lg bg-white/70 p-4 text-sm text-slate-700 leading-relaxed">
                <span className="font-medium text-slate-800">Memory:</span> This matches the ETL spike pattern from
                Jul 15 (30d ago). That incident cost $42 extra and was caused by an unoptimized JOIN on the 2TB{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs font-mono">analytics.events</code> table.
                Resolution: Added partition filter and optimized JOIN, reducing scan from 2TB to 45GB.
              </div>
              <div className="mb-4 flex items-center gap-4">
                <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                  Confidence: 88% same root cause
                </span>
                <span className="text-sm text-slate-600">
                  Suggested fix: Apply same partition filter to current query pipeline
                </span>
              </div>
              <div className="flex gap-3">
                <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                  Apply Fix
                </button>
                <button className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                  Investigate
                </button>
              </div>
            </div>

            {/* --- Cost by Pillar --- */}
            <div>
              <h2 className="mb-4 text-base font-semibold text-slate-800">Cost by Pillar</h2>
              <div className="space-y-0 rounded-xl border border-slate-200 divide-y divide-slate-200">
                {pillars.map((p) => (
                  <div key={p.name} className="flex items-start gap-4 px-5 py-4">
                    <div className="w-32 flex-shrink-0">
                      <div className="text-sm font-medium text-slate-800">{p.name}</div>
                      <div className="text-lg font-semibold text-slate-800">
                        ${p.cost}
                        <span className="text-xs font-normal text-slate-400">/mo</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 pt-1">
                      <Sparkline data={p.sparkData} color={p.sparkColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-500 mb-1">{p.breakdown}</div>
                      <div className="text-sm text-slate-600 leading-relaxed">
                        <span className="font-medium text-slate-700">Memory:</span> {p.memory}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* --- Cost Trend Chart --- */}
            <div>
              <h2 className="mb-4 text-base font-semibold text-slate-800">Cost Trend</h2>
              <div className="rounded-xl border border-slate-200 p-5">
                <div className="flex items-end gap-3" style={{ height: 200 }}>
                  {monthlyTrend.map((m) => {
                    const barH = (m.cost / maxCost) * 160;
                    const annotation = annotations[m.month];
                    return (
                      <div key={m.month} className="flex flex-1 flex-col items-center">
                        {/* Annotation arrow */}
                        {annotation && (
                          <div className="mb-1 flex flex-col items-center">
                            <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: annotation.color }}>
                              {annotation.label}
                            </span>
                            <svg width="8" height="10" className="mt-0.5">
                              <path d="M4 0 L4 7 L1 4 M4 7 L7 4" stroke={annotation.color} fill="none" strokeWidth={1.5} />
                            </svg>
                          </div>
                        )}
                        {/* Bar */}
                        <div className="flex flex-col items-center justify-end" style={{ height: 160 }}>
                          <span className="mb-1 text-xs font-medium text-slate-600">${m.cost}</span>
                          <div
                            className="w-10 rounded-t-md bg-emerald-500"
                            style={{ height: barH }}
                          />
                        </div>
                        <span className="mt-2 text-xs text-slate-500">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  OPTIMIZATION MEMORY TAB                                      */}
        {/* ============================================================ */}
        {tab === "optimization-memory" && (
          <div>
            <h2 className="mb-4 text-base font-semibold text-slate-800">Optimization History</h2>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Recommendation</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Applied Date</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Savings/mo</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Memory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {optimizations.map((o, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{o.recommendation}</td>
                      <td className="px-4 py-3 text-slate-600">{o.appliedDate ?? "—"}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{o.savings}</td>
                      <td className="px-4 py-3">
                        {o.status === "applied" && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            Applied
                          </span>
                        )}
                        {o.status === "pending" && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                            Pending
                          </span>
                        )}
                        {o.status === "available" && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs">
                        <span className="text-xs leading-relaxed">{o.memory}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Bottom summary */}
            <div className="mt-4 flex items-center gap-6 rounded-lg bg-slate-50 px-5 py-3">
              <div className="text-sm text-slate-600">
                Total savings applied:{" "}
                <span className="font-semibold text-emerald-600">$105/mo</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="text-sm text-slate-600">
                Additional available:{" "}
                <span className="font-semibold text-blue-600">$105/mo</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  ANOMALIES TAB                                                */}
        {/* ============================================================ */}
        {tab === "anomalies" && (
          <div className="space-y-5">
            {anomalies.map((a, i) => {
              const borderColor =
                a.severity === "active"
                  ? "border-red-400"
                  : a.severity === "resolved"
                  ? "border-emerald-400"
                  : "border-slate-300";
              const bgColor =
                a.severity === "active"
                  ? "bg-red-50"
                  : a.severity === "resolved"
                  ? "bg-emerald-50"
                  : "bg-slate-50";
              const badgeColor =
                a.severity === "active"
                  ? "bg-red-100 text-red-700"
                  : a.severity === "resolved"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-600";
              const badgeLabel =
                a.severity === "active"
                  ? "ACTIVE"
                  : a.severity === "resolved"
                  ? "RESOLVED"
                  : "FALSE POSITIVE";

              return (
                <div key={i} className={`rounded-xl border-2 ${borderColor} ${bgColor} p-5`}>
                  {/* Header row */}
                  <div className="mb-3 flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeColor}`}>
                      {badgeLabel}
                    </span>
                    <span className="text-xs text-slate-500">{a.timeAgo}</span>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs text-slate-500">{a.service}</span>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs text-slate-500">{a.extra}</span>
                  </div>

                  <h3 className="mb-3 text-base font-semibold text-slate-800">{a.title}</h3>

                  {/* Memory block */}
                  <div className="mb-4 rounded-lg bg-white/70 p-4 text-sm text-slate-700 leading-relaxed">
                    <span className="font-medium text-slate-800">Memory:</span> {a.memory}
                  </div>

                  {/* Confidence + suggested fix (active only) */}
                  {a.confidence && (
                    <div className="mb-3 flex items-center gap-3">
                      <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                        Confidence: {a.confidence}
                      </span>
                    </div>
                  )}
                  {a.suggestedFix && (
                    <div className="mb-4 text-sm text-slate-600">
                      <span className="font-medium text-slate-700">Suggested fix:</span> {a.suggestedFix}
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="rounded-lg bg-white/50 p-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Timeline</div>
                    <div className="space-y-1.5">
                      {a.timeline.map((entry, j) => (
                        <div key={j} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                          <span>{entry}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons for active anomaly */}
                  {a.severity === "active" && (
                    <div className="mt-4 flex gap-3">
                      <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                        Apply Fix
                      </button>
                      <button className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                        Investigate
                      </button>
                      <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                        Mark False Positive
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/*  FORECASTING TAB                                              */}
        {/* ============================================================ */}
        {tab === "forecasting" && (
          <div className="space-y-6">
            {/* Projection cards */}
            <div>
              <h2 className="mb-4 text-base font-semibold text-slate-800">Next 3 Months Projection</h2>
              <div className="grid grid-cols-3 gap-4">
                {forecast.map((f) => (
                  <div key={f.month} className="rounded-xl border border-slate-200 p-5">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">{f.month} 2025</div>
                    <div className="text-2xl font-semibold text-slate-800">${f.cost}</div>
                    <div className="mt-2 text-xs text-slate-500 leading-relaxed">{f.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projected savings */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div>
                  <div className="text-sm font-semibold text-emerald-800">
                    If all available optimizations are applied, projected annual savings: $1,260
                  </div>
                  <div className="mt-1 text-xs text-emerald-600">
                    Based on $105/mo current savings + $105/mo available savings applied from Aug onward
                  </div>
                </div>
              </div>
            </div>

            {/* Forecast visualization */}
            <div>
              <h2 className="mb-4 text-base font-semibold text-slate-800">Forecast Trajectory</h2>
              <div className="rounded-xl border border-slate-200 p-5">
                <div className="flex items-end gap-3" style={{ height: 200 }}>
                  {[...monthlyTrend, ...forecast.map((f) => ({ month: f.month, cost: f.cost }))].map((m, idx) => {
                    const allCosts = [...monthlyTrend.map((x) => x.cost), ...forecast.map((x) => x.cost)];
                    const localMax = Math.max(...allCosts);
                    const barH = (m.cost / localMax) * 160;
                    const isForecast = idx >= monthlyTrend.length;
                    return (
                      <div key={m.month} className="flex flex-1 flex-col items-center">
                        <div className="flex flex-col items-center justify-end" style={{ height: 160 }}>
                          <span className="mb-1 text-xs font-medium text-slate-600">${m.cost}</span>
                          <div
                            className={`w-8 rounded-t-md ${isForecast ? "bg-emerald-300 border border-dashed border-emerald-500" : "bg-emerald-500"}`}
                            style={{ height: barH }}
                          />
                        </div>
                        <span className={`mt-2 text-xs ${isForecast ? "text-emerald-600 font-medium" : "text-slate-500"}`}>
                          {m.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                    Actual
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm border border-dashed border-emerald-500 bg-emerald-300" />
                    Projected
                  </div>
                </div>
              </div>
            </div>

            {/* Risk factors */}
            <div>
              <h2 className="mb-4 text-base font-semibold text-slate-800">Risk Factors</h2>
              <div className="space-y-3">
                {riskFactors.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm text-slate-700 leading-relaxed">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
