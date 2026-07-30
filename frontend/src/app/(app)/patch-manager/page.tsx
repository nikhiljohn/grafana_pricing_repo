"use client";

import { useState } from "react";

const stats = [
  { label: "TOTAL ASSESSED", value: "60", sub: "instances", color: "text-gray-300", bg: "bg-gray-800" },
  { label: "COMPLIANT", value: "13.3%", sub: "8 of 60", color: "text-emerald-400", bg: "bg-gray-800" },
  { label: "REQUIRES ACTION", value: "0", sub: "N-2 or critical", color: "text-red-400", bg: "bg-gray-800" },
  { label: "MISSING PATCHES", value: "2", sub: "across all assets", color: "text-yellow-400", bg: "bg-gray-800" },
  { label: "REBOOT NEEDED", value: "1", sub: "after patching", color: "text-blue-400", bg: "bg-gray-800" },
  { label: "LAST SYNC", value: "~2 months ago", sub: "data age", color: "text-gray-400", bg: "bg-gray-800" },
];

const gapDistribution = [
  { label: "Critical", count: 0, pct: 0, color: "bg-red-500" },
  { label: "N-2", count: 0, pct: 0, color: "bg-orange-500" },
  { label: "N-1", count: 1, pct: 2, color: "bg-purple-500" },
  { label: "Compliant", count: 8, pct: 13, color: "bg-emerald-500" },
  { label: "Unknown", count: 51, pct: 85, color: "bg-gray-500" },
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
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Patch Manager</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Patch compliance &middot; Version gap detection &middot; Approval-gated remediation
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-medium text-yellow-400 ring-1 ring-yellow-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              1 job pending approval
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none">
            <option>Organization</option>
          </select>
          <button className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 ring-1 ring-gray-700 hover:bg-gray-700 transition">
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
          <div key={s.label} className={`${s.bg} rounded-xl p-4 ring-1 ring-gray-700/60`}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Patch Version Gap Distribution */}
      <div className="rounded-xl bg-gray-800 p-5 ring-1 ring-gray-700/60">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Patch Version Gap Distribution</h2>

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
        <div className="mt-3 flex items-center gap-6 text-xs text-gray-400">
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
      <div className="flex items-center gap-6 border-b border-gray-800">
        <button
          onClick={() => setActiveTab("non-compliant")}
          className={`pb-3 text-sm font-medium transition ${
            activeTab === "non-compliant"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Non-Compliant Resources
          <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-700 px-1.5 text-[11px] font-semibold text-gray-300">
            60
          </span>
        </button>
        <button
          onClick={() => setActiveTab("patch-jobs")}
          className={`pb-3 text-sm font-medium transition ${
            activeTab === "patch-jobs"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Patch Jobs
          <span className="ml-2 text-xs font-medium text-emerald-400">1 pending</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-lg border border-gray-700 bg-gray-800 py-2 pl-9 pr-3 text-sm text-gray-300 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center rounded-lg border border-gray-700 bg-gray-800 p-0.5">
          {severityFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveSeverity(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeSeverity === f
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <select className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 focus:border-blue-500 focus:outline-none">
          <option>All accounts</option>
        </select>
        <select className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 focus:border-blue-500 focus:outline-none">
          <option>All projects</option>
        </select>
        <select className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 focus:border-blue-500 focus:outline-none">
          <option>All OS</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl ring-1 ring-gray-700/60">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/60">
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Gap Severity</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Resource</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">OS</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Region</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Missing</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Last Scanned</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            <tr className="bg-gray-900/40 hover:bg-gray-800/40 transition">
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-500/30">
                  N-1 Behind
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-200">test-instance</div>
                <div className="text-xs text-gray-500">Instance &middot; AWS</div>
              </td>
              <td className="px-4 py-3 text-xs text-gray-400 max-w-[220px]">
                Microsoft Windows Server 2025 Datacenter 10.0.26100
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">ap-south-1a</td>
              <td className="px-4 py-3">
                <span className="text-xs font-medium text-red-400">2 critical</span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">3 months ago</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-yellow-400">Reboot needed</span>
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
