"use client";

import { useState } from "react";
import {
  Brain,
  ChevronDown,
  RefreshCw,
  Cpu,
  Coins,
  Clock,
  ShieldAlert,
  Hash,
  BarChart3,
  Info,
} from "lucide-react";

const orgs = ["searce-playground", "searce-prod", "searce-staging"];
const timeRanges = ["7d", "14d", "30d", "90d"] as const;

const stats = [
  {
    label: "Total AI Calls",
    value: "48",
    icon: Hash,
    color: "text-slate-800",
    bgColor: "bg-slate-100",
    iconColor: "text-slate-500",
    borderColor: "border-slate-200",
  },
  {
    label: "Tokens Used",
    value: "480.7K",
    icon: Cpu,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-500",
    borderColor: "border-emerald-200",
  },
  {
    label: "Total Cost",
    value: "$2.4252",
    icon: Coins,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    iconColor: "text-yellow-500",
    borderColor: "border-yellow-200",
  },
  {
    label: "Avg Cost/Call",
    value: "$0.05053",
    icon: Coins,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    iconColor: "text-yellow-500",
    borderColor: "border-yellow-200",
  },
  {
    label: "Avg Latency",
    value: "15791ms",
    icon: Clock,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-500",
    borderColor: "border-orange-200",
  },
  {
    label: "Security Events",
    value: "0",
    icon: ShieldAlert,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-500",
    borderColor: "border-emerald-200",
  },
];

// Daily token usage data
const dailyTokenData = [
  { date: "06-29", tokens: 0 },
  { date: "06-30", tokens: 0 },
  { date: "07-01", tokens: 12000 },
  { date: "07-02", tokens: 269000 },
  { date: "07-03", tokens: 42000 },
  { date: "07-04", tokens: 0 },
  { date: "07-05", tokens: 0 },
  { date: "07-06", tokens: 0 },
  { date: "07-07", tokens: 8000 },
  { date: "07-08", tokens: 15000 },
  { date: "07-09", tokens: 0 },
  { date: "07-10", tokens: 0 },
  { date: "07-11", tokens: 0 },
  { date: "07-12", tokens: 0 },
  { date: "07-13", tokens: 0 },
  { date: "07-14", tokens: 5000 },
  { date: "07-15", tokens: 0 },
  { date: "07-16", tokens: 0 },
  { date: "07-17", tokens: 0 },
  { date: "07-18", tokens: 0 },
  { date: "07-19", tokens: 18000 },
  { date: "07-20", tokens: 0 },
  { date: "07-21", tokens: 0 },
  { date: "07-22", tokens: 0 },
  { date: "07-23", tokens: 0 },
  { date: "07-24", tokens: 0 },
  { date: "07-25", tokens: 32000 },
  { date: "07-26", tokens: 0 },
  { date: "07-27", tokens: 45000 },
  { date: "07-28", tokens: 34700 },
];

const costByFeature = [
  { feature: "unknown", cost: 2.28, color: "bg-blue-500" },
  { feature: "cloudops", cost: 0.05, color: "bg-cyan-500" },
  { feature: "databases", cost: 0.04, color: "bg-violet-500" },
  { feature: "sec", cost: 0.03, color: "bg-emerald-500" },
  { feature: "predictive_ops_briefin", cost: 0.05, color: "bg-amber-500" },
];

const featureBreakdown = [
  {
    feature: "unknown",
    calls: 44,
    inputTokens: 395416,
    outputTokens: 73398,
    totalTokens: 468814,
    cost: 2.2872,
    avgLatency: "15728ms",
  },
];

const maxTokens = Math.max(...dailyTokenData.map((d) => d.tokens));
const maxCost = Math.max(...costByFeature.map((f) => f.cost));

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

export default function AIUsagePage() {
  const [selectedOrg, setSelectedOrg] = useState(orgs[0]);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<(typeof timeRanges)[number]>("30d");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <div className="min-h-screen text-slate-800">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                  AI Usage &amp; Costs
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Token consumption, cost breakdown, and security events across
                  all AI features
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Org Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300"
                >
                  {selectedOrg}
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
                {orgDropdownOpen && (
                  <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                    {orgs.map((org) => (
                      <button
                        key={org}
                        onClick={() => {
                          setSelectedOrg(org);
                          setOrgDropdownOpen(false);
                        }}
                        className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                          org === selectedOrg
                            ? "text-blue-600"
                            : "text-slate-600"
                        }`}
                      >
                        {org}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Time Range */}
              <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                {timeRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      selectedRange === range
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              {/* Refresh */}
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Stats Row */}
        <div className="mb-6 grid grid-cols-6 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border ${stat.borderColor} bg-white px-4 py-4`}
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${stat.bgColor}`}
                >
                  <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </div>
              <div className={`text-xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Model Info Bar */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3">
          <Info className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">Model:</span>{" "}
            claude-haiku-4-5-20251001
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">Input:</span> $3/M
            tokens
          </span>
          <span className="text-slate-300">&middot;</span>
          <span className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">Output:</span> $15/M
            tokens
          </span>
        </div>

        {/* Charts Row */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          {/* Daily Token Usage Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-slate-700">
                Daily Token Usage
              </h3>
            </div>
            <div className="relative h-52">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-right">
                <span className="text-[10px] text-slate-400">
                  {formatTokens(maxTokens)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {formatTokens(maxTokens / 2)}
                </span>
                <span className="text-[10px] text-slate-400">0</span>
              </div>
              {/* Grid lines */}
              <div className="absolute inset-x-10 top-0 h-full">
                <div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-200" />
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200" />
                <div className="absolute inset-x-0 bottom-0 border-t border-slate-200" />
              </div>
              {/* Bars */}
              <div className="absolute inset-x-10 bottom-0 flex h-full items-end gap-[2px]">
                {dailyTokenData.map((d, i) => {
                  const heightPct =
                    maxTokens > 0 ? (d.tokens / maxTokens) * 100 : 0;
                  return (
                    <div
                      key={i}
                      className="group relative flex flex-1 flex-col items-center justify-end"
                      style={{ height: "100%" }}
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Tooltip */}
                      {hoveredBar === i && d.tokens > 0 && (
                        <div className="absolute -top-8 z-10 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white shadow-lg">
                          {d.date}: {formatTokens(d.tokens)} tokens
                        </div>
                      )}
                      <div
                        className={`w-full rounded-t transition-colors ${
                          d.tokens > 0
                            ? "bg-blue-500 hover:bg-blue-400"
                            : "bg-transparent"
                        }`}
                        style={{
                          height: `${Math.max(heightPct, d.tokens > 0 ? 2 : 0)}%`,
                          minHeight: d.tokens > 0 ? "3px" : "0px",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            {/* X-axis labels */}
            <div className="mt-2 flex justify-between pl-10 pr-0">
              {dailyTokenData
                .filter((_, i) => i % 5 === 0)
                .map((d) => (
                  <span key={d.date} className="text-[10px] text-slate-400">
                    {d.date}
                  </span>
                ))}
            </div>
          </div>

          {/* Cost by Feature Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-semibold text-slate-700">
                Cost by Feature
              </h3>
            </div>
            <div className="space-y-3">
              {costByFeature.map((item) => {
                const widthPct =
                  maxCost > 0 ? (item.cost / maxCost) * 100 : 0;
                return (
                  <div key={item.feature} className="group">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        {item.feature}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        ${item.cost.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-6 w-full overflow-hidden rounded-md bg-slate-100">
                      <div
                        className={`h-full rounded-md ${item.color} transition-all duration-500`}
                        style={{ width: `${Math.max(widthPct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Feature Breakdown Table */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-700">
              Feature Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Feature
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Calls
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Input Tokens
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Output Tokens
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Tokens
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Cost (USD)
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Avg Latency
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureBreakdown.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-700">
                      {row.feature}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm tabular-nums text-slate-600">
                      {row.calls}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm tabular-nums text-slate-600">
                      {row.inputTokens.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm tabular-nums text-slate-600">
                      {row.outputTokens.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm tabular-nums text-slate-600">
                      {row.totalTokens.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm tabular-nums">
                      <span className="font-medium text-emerald-600">
                        ${row.cost.toFixed(4)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm tabular-nums text-slate-600">
                      {row.avgLatency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
