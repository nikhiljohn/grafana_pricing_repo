"use client";

import { useState } from "react";
import { useApiData } from "@/lib/api";

type MainTab = "all" | "patterns" | "remediation" | "learnings";
type PillarFilter = "All" | "CloudOps" | "FinOps" | "Cloud Security" | "DevOps" | "AIOps";

interface MemoryEntry {
  id: number;
  daysAgo: string;
  pillar: "CloudOps" | "FinOps" | "Cloud Security" | "DevOps";
  confidence: number;
  title: string;
  context: string;
  learning: string;
  applied: number;
  appliedNote?: string;
}

interface IncidentPattern {
  name: string;
  occurrences: number;
  autoResolved: number;
  avgTime: string;
  trend: "Improving" | "Stable" | "New";
  bars: number[];
}

interface RemediationRow {
  fix: string;
  confidence: number;
  timesApplied: number;
  successRate: string;
  lastApplied: string;
  pillar: "Cloud Security" | "CloudOps" | "FinOps";
}

interface LearningCard {
  insight: string;
  crossPillar: string;
}

const pillarColors: Record<string, string> = {
  CloudOps: "bg-blue-100 text-blue-700",
  FinOps: "bg-amber-100 text-amber-700",
  "Cloud Security": "bg-red-100 text-red-700",
  DevOps: "bg-purple-100 text-purple-700",
  AIOps: "bg-emerald-100 text-emerald-700",
};

function pillarBadge(pillar: string) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${pillarColors[pillar] ?? "bg-slate-100 text-slate-600"}`}
    >
      {pillar}
    </span>
  );
}

function confidenceColor(c: number) {
  if (c >= 90) return "text-emerald-600";
  if (c >= 80) return "text-blue-600";
  return "text-amber-600";
}

function trendBadge(trend: "Improving" | "Stable" | "New") {
  const map: Record<string, string> = {
    Improving: "bg-emerald-50 text-emerald-700",
    Stable: "bg-slate-100 text-slate-600",
    New: "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[trend]}`}>
      {trend}
    </span>
  );
}

export default function MemoryPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("all");
  const [pillarFilter, setPillarFilter] = useState<PillarFilter>("All");
  const [search, setSearch] = useState("");

  const { data: memoryEntries } = useApiData<MemoryEntry[]>("/memory/entries", []);
  const { data: incidentPatterns } = useApiData<IncidentPattern[]>("/memory/patterns", []);
  const { data: remediationRows } = useApiData<RemediationRow[]>("/memory/remediation-library", []);
  const { data: learnings } = useApiData<LearningCard[]>("/memory/learnings", []);

  const tabs: { key: MainTab; label: string }[] = [
    { key: "all", label: "All Memory" },
    { key: "patterns", label: "Incident Patterns" },
    { key: "remediation", label: "Remediation Library" },
    { key: "learnings", label: "Learnings" },
  ];

  const pillars: PillarFilter[] = ["All", "CloudOps", "FinOps", "Cloud Security", "DevOps", "AIOps"];

  const filteredEntries = memoryEntries.filter((e) => {
    const matchPillar = pillarFilter === "All" || e.pillar === pillarFilter;
    const matchSearch =
      search === "" ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.context.toLowerCase().includes(search.toLowerCase()) ||
      e.learning.toLowerCase().includes(search.toLowerCase());
    return matchPillar && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
              <path d="M9 21h6" />
              <path d="M10 21v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1" />
              <path d="M12 2v3" />
              <path d="M8.5 5.5 10 7" />
              <path d="M15.5 5.5 14 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Memory</h1>
            <p className="text-sm text-slate-500 mt-0.5 max-w-xl">
              Operational intelligence built from every incident, remediation,
              and optimization across your infrastructure
            </p>
          </div>
        </div>
        <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700">
          <option>searce-playground</option>
          <option>searce-prod</option>
          <option>searce-staging</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🧠</span>
            <span className="text-sm font-medium text-slate-500">
              Total Entries
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">156</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔗</span>
            <span className="text-sm font-medium text-slate-500">
              Patterns Detected
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">34</div>
          <div className="text-xs text-slate-400 mt-0.5">
            recurring behaviors across workloads
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🛠️</span>
            <span className="text-sm font-medium text-slate-500">
              Auto-fix Library
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">23</div>
          <div className="text-xs text-slate-400 mt-0.5">
            validated remediation scripts
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">⚡</span>
            <span className="text-sm font-medium text-slate-500">
              Avg Resolution Improvement
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">22%</div>
          <div className="text-xs text-slate-400 mt-0.5">
            faster than first occurrence
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===================== ALL MEMORY ===================== */}
      {activeTab === "all" && (
        <div>
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search memory entries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-lg border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
            />
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {pillars.map((p) => (
              <button
                key={p}
                onClick={() => setPillarFilter(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  pillarFilter === p
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Entries */}
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-slate-400">{entry.daysAgo}</span>
                  {pillarBadge(entry.pillar)}
                  <span
                    className={`text-xs font-semibold ${confidenceColor(entry.confidence)}`}
                  >
                    {entry.confidence}% confidence
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  {entry.title}
                </h3>
                <div className="mb-2">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                    Context
                  </span>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {entry.context}
                  </p>
                </div>
                <div className="mb-3">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                    Learning
                  </span>
                  <p className="text-sm text-slate-700 mt-0.5 font-medium">
                    {entry.learning}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 rounded px-2 py-1 font-medium">
                    <svg
                      className="w-3 h-3 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Applied {entry.applied} time{entry.applied !== 1 ? "s" : ""}
                    {entry.appliedNote ? ` (${entry.appliedNote})` : ""}
                  </span>
                </div>
              </div>
            ))}
            {filteredEntries.length === 0 && (
              <div className="text-center py-12 text-sm text-slate-400">
                No memory entries match your search.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== INCIDENT PATTERNS ===================== */}
      {activeTab === "patterns" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {incidentPatterns.map((pat) => (
            <div
              key={pat.name}
              className="bg-white rounded-xl border border-slate-200 p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900">
                  {pat.name}
                </h3>
                {trendBadge(pat.trend)}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                {/* Frequency */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {pat.occurrences}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mt-0.5">
                    Occurrences
                  </div>
                </div>

                {/* Auto-resolution donut */}
                <div className="flex flex-col items-center">
                  <div className="relative w-12 h-12">
                    <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke={pat.autoResolved === 100 ? "#10b981" : pat.autoResolved >= 50 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="3"
                        strokeDasharray={`${pat.autoResolved} ${100 - pat.autoResolved}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                      {pat.autoResolved}%
                    </span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mt-1">
                    Auto-resolved
                  </div>
                </div>

                {/* Avg time */}
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900">
                    {pat.avgTime}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mt-0.5">
                    Avg Resolve
                  </div>
                </div>
              </div>

              {/* Frequency bar (last 90d, 6 buckets) */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1.5">
                  Last 90 days
                </div>
                <div className="flex items-end gap-1 h-8">
                  {pat.bars.map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-violet-400"
                      style={{
                        height: v === 0 ? "2px" : `${(v / 3) * 100}%`,
                        opacity: v === 0 ? 0.2 : 0.4 + v * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===================== REMEDIATION LIBRARY ===================== */}
      {activeTab === "remediation" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Fix
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Times Applied
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Last Applied
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Pillar
                  </th>
                </tr>
              </thead>
              <tbody>
                {remediationRows.map((row) => (
                  <tr
                    key={row.fix}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {row.fix}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`font-semibold ${confidenceColor(row.confidence)}`}
                      >
                        {row.confidence}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {row.timesApplied}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {row.successRate}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {row.lastApplied}
                    </td>
                    <td className="px-5 py-4">{pillarBadge(row.pillar)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== LEARNINGS ===================== */}
      {activeTab === "learnings" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 mb-2">
            Cross-pillar insights that emerge from combining memory across
            operational domains.
          </p>
          {learnings.map((l, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-violet-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 leading-relaxed">
                  {l.insight}
                </p>
                <span className="inline-block mt-2 text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                  {l.crossPillar}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
