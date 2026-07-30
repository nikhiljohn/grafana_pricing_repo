"use client";

import { useState } from "react";

const stats = [
  { label: "TOTAL ASSESSED", value: "60", sub: "instances", color: "text-slate-800", bg: "bg-white" },
  { label: "COMPLIANT", value: "13.3%", sub: "8 of 60", color: "text-emerald-600", bg: "bg-white" },
  { label: "REQUIRES ACTION", value: "0", sub: "N-2 or critical", color: "text-red-500", bg: "bg-white" },
  { label: "MISSING PATCHES", value: "2", sub: "across all assets", color: "text-amber-600", bg: "bg-white" },
  { label: "REBOOT NEEDED", value: "1", sub: "after patching", color: "text-blue-500", bg: "bg-white" },
  { label: "LAST SYNC", value: "~2 months ago", sub: "data age", color: "text-slate-500", bg: "bg-white" },
];

const gapDistribution = [
  { label: "Critical", count: 0, pct: 0, color: "bg-red-500" },
  { label: "N-2", count: 0, pct: 0, color: "bg-orange-500" },
  { label: "N-1", count: 1, pct: 2, color: "bg-purple-500" },
  { label: "Compliant", count: 8, pct: 13, color: "bg-emerald-500" },
  { label: "Unknown", count: 51, pct: 85, color: "bg-gray-400" },
];

const severityFilters = [
  "All",
  "Critical",
  "N-2",
  "N-1",
  "Never scanned",
  "Compliant",
] as const;

type SeverityFilter = (typeof severityFilters)[number];

export default function PatchManagerPage() {
  const [activeTab, setActiveTab] = useState<"non-compliant" | "patch-jobs">("non-compliant");
  const [activeSeverity, setActiveSeverity] = useState<SeverityFilter>("All");
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen text-slate-800 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Patch Manager</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Patch compliance &middot; Version gap detection &middot; Approval-gated remediation
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 ring-1 ring-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              1 job pending approval
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-blue-500 focus:outline-none">
            <option>Organization</option>
          </select>
          <button className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync patch data
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-6 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-200`}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Patch Version Gap Distribution */}
      <div className="rounded-xl bg-white p-5 border border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Patch Version Gap Distribution</h2>

        {/* Stacked bar */}
        <div className="flex h-8 w-full overflow-hidden rounded-lg">
          {gapDistribution.map((g) => (
            <div
              key={g.label}
              className={`${g.color} transition-all`}
              style={{ width: `${Math.max(g.pct, g.pct === 0 ? 0 : 2)}%` }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-6 text-xs text-slate-500">
          {gapDistribution.map((g) => (
            <div key={g.label} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${g.color}`} />
              <span>
                {g.label} {g.count} ({g.pct}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("non-compliant")}
          className={`pb-3 text-sm font-medium transition ${
            activeTab === "non-compliant"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Non-Compliant Resources
          <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-600">
            60
          </span>
        </button>
        <button
          onClick={() => setActiveTab("patch-jobs")}
          className={`pb-3 text-sm font-medium transition ${
            activeTab === "patch-jobs"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Patch Jobs
          <span className="ml-2 text-xs font-medium text-emerald-600">1 pending</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {severityFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveSeverity(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeSeverity === f
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 focus:border-blue-500 focus:outline-none">
          <option>All accounts</option>
        </select>
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 focus:border-blue-500 focus:outline-none">
          <option>All projects</option>
        </select>
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 focus:border-blue-500 focus:outline-none">
          <option>All OS</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Gap Severity</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Resource</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">OS</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Region</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Missing</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Last Scanned</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr className="bg-white hover:bg-slate-50 transition">
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 ring-1 ring-blue-200">
                  N-1 Behind
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-800">test-instance</div>
                <div className="text-xs text-slate-500">Instance &middot; AWS</div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500 max-w-[220px]">
                Microsoft Windows Server 2025 Datacenter 10.0.26100
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">ap-south-1a</td>
              <td className="px-4 py-3">
                <span className="text-xs font-medium text-red-500">2 critical</span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">3 months ago</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-amber-600">Reboot needed</span>
                  <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition">
                    Schedule
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
