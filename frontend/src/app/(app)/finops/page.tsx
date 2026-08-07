"use client";

import { useEffect, useState } from "react";
import { useApiData } from "@/lib/api";
import { ApplyFixModal } from "@/components/ApplyFixModal";

type FinOpsTab = "cost-intelligence" | "optimization-memory" | "anomalies" | "forecasting";

/* ------------------------------------------------------------------ */
/*  Data shapes served by the /finops/* endpoints                     */
/* ------------------------------------------------------------------ */
type MonthlyTrendPoint = { month: string; cost: number };

type PillarCost = {
  name: string;
  cost: number;
  breakdown: string;
  sparkData: number[];
  sparkColor: string;
  memory: string;
};

type OptimizationRow = {
  recommendation: string;
  appliedDate: string | null;
  savings: string;
  status: "applied" | "pending" | "available";
  memory: string;
};

type AnomalyItem = {
  title: string;
  severity: "active" | "resolved" | "false-positive";
  timeAgo: string;
  service: string;
  extra: string;
  memory: string;
  confidence: string | null;
  suggestedFix: string | null;
  timeline: string[];
};

type ForecastPoint = { month: string; cost: number; note: string };

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

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */
export default function FinOpsIntelligencePage() {
  const [tab, setTab] = useState<FinOpsTab>("cost-intelligence");

  const { data: monthlyTrend } = useApiData<MonthlyTrendPoint[]>("/finops/monthly-trend", []);
  const { data: pillars } = useApiData<PillarCost[]>("/finops/costs", []);
  const { data: optimizations } = useApiData<OptimizationRow[]>("/finops/optimizations", []);
  const { data: anomaliesData } = useApiData<AnomalyItem[]>("/finops/anomalies", []);
  const { data: forecast } = useApiData<ForecastPoint[]>("/finops/forecast", []);
  const { data: riskFactors } = useApiData<string[]>("/finops/risk-factors", []);

  // Local, mutable copy so "Apply Fix" actually resolves the anomaly
  // instead of being decorative — resyncs when the org switcher changes.
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  useEffect(() => setAnomalies(anomaliesData), [anomaliesData]);
  const [fixTarget, setFixTarget] = useState<AnomalyItem | null>(null);
  const activeAnomaly = anomalies.find((a) => a.severity === "active");

  function resolveAnomaly(a: AnomalyItem) {
    setAnomalies((cur) =>
      cur.map((x) => (x === a ? { ...x, severity: "resolved" as const, extra: "Resolved just now" } : x)),
    );
  }

  const maxCost = monthlyTrend.length ? Math.max(...monthlyTrend.map((m) => m.cost)) : 0;

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
            {activeAnomaly && (
              <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-sm font-semibold text-amber-700">ACTIVE ANOMALY</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-800">{activeAnomaly.title}</h3>
                <div className="mb-3 rounded-lg bg-white/70 p-4 text-sm text-slate-700 leading-relaxed">
                  <span className="font-medium text-slate-800">Memory:</span> {activeAnomaly.memory}
                </div>
                <div className="mb-4 flex items-center gap-4">
                  {activeAnomaly.confidence && (
                    <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                      Confidence: {activeAnomaly.confidence}
                    </span>
                  )}
                  {activeAnomaly.suggestedFix && (
                    <span className="text-sm text-slate-600">
                      Suggested fix: {activeAnomaly.suggestedFix}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFixTarget(activeAnomaly)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                  >
                    Apply Fix
                  </button>
                </div>
              </div>
            )}
            {!activeAnomaly && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
                No active cost anomaly right now — FinOps is healthy.
              </div>
            )}

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
                      <button
                        onClick={() => setFixTarget(a)}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                      >
                        Apply Fix
                      </button>
                      <button
                        disabled
                        title="Coming in V2 — dedicated investigation view per anomaly"
                        className="rounded-lg border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-blue-300 cursor-not-allowed"
                      >
                        Investigate
                      </button>
                      <button
                        onClick={() =>
                          setAnomalies((cur) =>
                            cur.map((x) => (x === a ? { ...x, severity: "false-positive" as const } : x)),
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
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

      <ApplyFixModal
        open={fixTarget !== null}
        onClose={() => setFixTarget(null)}
        onConfirm={() => {
          if (fixTarget) resolveAnomaly(fixTarget);
        }}
        pillar="FinOps"
        title={fixTarget?.title ?? ""}
        memoryContext={fixTarget?.memory ?? ""}
        confidence={fixTarget?.confidence ?? null}
        fixDescription={fixTarget?.suggestedFix ?? "Applies the cost-optimization fix Memory has already validated for this pattern."}
      />
    </div>
  );
}
