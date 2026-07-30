"use client";

import { useState } from "react";

const costData = [
  { service: "Compute Engine", provider: "GCP", cost: 161, change: 12, trend: "up" },
  { service: "Cloud Storage", provider: "GCP", cost: 145, change: -3, trend: "down" },
  { service: "Cloud Functions", provider: "GCP", cost: 86, change: 8, trend: "up" },
  { service: "Cloud SQL", provider: "GCP", cost: 68, change: 0, trend: "flat" },
  { service: "Cloud Run", provider: "GCP", cost: 48, change: -5, trend: "down" },
  { service: "EC2", provider: "AWS", cost: 42, change: 2, trend: "up" },
  { service: "S3", provider: "AWS", cost: 35, change: -1, trend: "down" },
  { service: "BigQuery", provider: "GCP", cost: 28, change: 15, trend: "up" },
  { service: "Pub/Sub", provider: "GCP", cost: 12, change: 0, trend: "flat" },
  { service: "Artifact Registry", provider: "GCP", cost: 8, change: 1, trend: "up" },
];

const monthlyTrend = [
  { month: "Feb", cost: 480 },
  { month: "Mar", cost: 520 },
  { month: "Apr", cost: 510 },
  { month: "May", cost: 560 },
  { month: "Jun", cost: 590 },
  { month: "Jul", cost: 637 },
];

const recommendations = [
  { title: "Right-size idle Compute Engine instances", savings: 45, severity: "high", category: "Compute" },
  { title: "Delete unattached persistent disks (3 found)", savings: 18, severity: "medium", category: "Storage" },
  { title: "Switch Cloud SQL to committed use discount", savings: 22, severity: "high", category: "Database" },
  { title: "Enable lifecycle policies on Cloud Storage buckets", savings: 12, severity: "low", category: "Storage" },
  { title: "Migrate Cloud Functions to 2nd gen for lower cold starts", savings: 8, severity: "low", category: "Compute" },
];

export default function CostAnalysisPage() {
  const [timeRange, setTimeRange] = useState("6m");
  const [tab, setTab] = useState<"breakdown" | "recommendations" | "anomalies">("breakdown");

  const totalCost = costData.reduce((s, r) => s + r.cost, 0);
  const totalSavings = recommendations.reduce((s, r) => s + r.savings, 0);
  const maxCost = Math.max(...monthlyTrend.map((m) => m.cost));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Cost Analysis</h1>
            <p className="text-sm text-slate-500">Cloud spend breakdown, trends, and optimization recommendations</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option>All Organizations</option>
          </select>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            {["1m", "3m", "6m", "1y"].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 text-xs font-medium ${
                  timeRange === r ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Month</div>
          <div className="text-3xl font-semibold text-slate-800">${totalCost}</div>
          <div className="text-xs text-emerald-600 mt-1">+8% vs last month</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Forecasted</div>
          <div className="text-3xl font-semibold text-blue-600">$702</div>
          <div className="text-xs text-slate-400 mt-1">Based on current trajectory</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Potential Savings</div>
          <div className="text-3xl font-semibold text-emerald-600">${totalSavings}</div>
          <div className="text-xs text-slate-400 mt-1">{recommendations.length} recommendations</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Budget Usage</div>
          <div className="text-3xl font-semibold text-amber-600">85%</div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
            <div className="bg-amber-500 h-2 rounded-full" style={{ width: "85%" }} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Cost Trend</h2>
          <span className="text-xs text-slate-400">Last 6 months</span>
        </div>
        <div className="flex items-end gap-4 h-40">
          {monthlyTrend.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-slate-600 font-medium">${m.cost}</span>
              <div
                className="w-full bg-blue-500 rounded-t-md transition-all"
                style={{ height: `${(m.cost / maxCost) * 100}%` }}
              />
              <span className="text-xs text-slate-400">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(["breakdown", "recommendations", "anomalies"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-md font-medium capitalize ${
              tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "recommendations" ? `Recommendations (${recommendations.length})` : t}
          </button>
        ))}
      </div>

      {tab === "breakdown" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Service</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Provider</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Monthly Cost</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">% of Total</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Change</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody>
              {costData.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{row.service}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        row.provider === "GCP"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {row.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">${row.cost}</td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {((row.cost / totalCost) * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        row.change > 0
                          ? "text-red-600"
                          : row.change < 0
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }
                    >
                      {row.change > 0 ? "+" : ""}
                      {row.change}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-16 h-4 flex items-center">
                      <svg viewBox="0 0 60 20" className="w-full h-full">
                        {row.trend === "up" && (
                          <polyline
                            points="0,18 15,14 30,10 45,8 60,2"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="2"
                          />
                        )}
                        {row.trend === "down" && (
                          <polyline
                            points="0,2 15,6 30,10 45,14 60,18"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2"
                          />
                        )}
                        {row.trend === "flat" && (
                          <polyline
                            points="0,10 15,11 30,10 45,9 60,10"
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth="2"
                          />
                        )}
                      </svg>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "recommendations" && (
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className={`bg-white border rounded-xl p-4 flex items-center gap-4 ${
                rec.severity === "high"
                  ? "border-l-4 border-l-red-500 border-slate-200"
                  : rec.severity === "medium"
                  ? "border-l-4 border-l-amber-500 border-slate-200"
                  : "border-l-4 border-l-blue-400 border-slate-200"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                      rec.severity === "high"
                        ? "bg-red-100 text-red-700"
                        : rec.severity === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {rec.severity}
                  </span>
                  <span className="text-xs text-slate-400">{rec.category}</span>
                </div>
                <p className="text-sm text-slate-700">{rec.title}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-emerald-600">${rec.savings}/mo</div>
                <div className="text-xs text-slate-400">estimated savings</div>
              </div>
              <button className="text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50">
                Apply
              </button>
            </div>
          ))}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-sm text-emerald-700 font-medium">
              Total potential monthly savings: <span className="text-lg font-semibold">${totalSavings}</span>
            </div>
          </div>
        </div>
      )}

      {tab === "anomalies" && (
        <div className="space-y-3">
          <div className="bg-white border border-l-4 border-l-red-500 border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded">ANOMALY</span>
              <span className="text-xs text-slate-400">Detected 2h ago</span>
            </div>
            <p className="text-sm text-slate-700 font-medium">BigQuery cost spike: +340% in last 4 hours</p>
            <p className="text-xs text-slate-500 mt-1">
              Unusual query volume from project Sea-GCP-Sbox. Estimated excess cost: $42.
              Root cause: unoptimized JOIN on 2TB table triggered by scheduled pipeline.
            </p>
          </div>
          <div className="bg-white border border-l-4 border-l-amber-500 border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">ANOMALY</span>
              <span className="text-xs text-slate-400">Detected 1d ago</span>
            </div>
            <p className="text-sm text-slate-700 font-medium">Compute Engine egress up 85% week-over-week</p>
            <p className="text-xs text-slate-500 mt-1">
              Cross-region data transfer from us-central1 to asia-south1 increased significantly.
              Likely cause: new replication job added without compression.
            </p>
          </div>
          <div className="bg-white border border-l-4 border-l-blue-400 border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">INFO</span>
              <span className="text-xs text-slate-400">Detected 3d ago</span>
            </div>
            <p className="text-sm text-slate-700 font-medium">Cloud Storage class mismatch detected</p>
            <p className="text-xs text-slate-500 mt-1">
              14 buckets using Standard class with &lt;1 access/month. Moving to Nearline could save ~$12/mo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
