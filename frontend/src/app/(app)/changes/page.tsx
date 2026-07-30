"use client";

import { useState } from "react";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

type ChangeKind = "ADDED" | "REMOVED" | "MODIFIED";

interface ChangeRow {
  time: string;
  change: ChangeKind;
  resource: string;
  type: string;
  region: string;
  project: string;
  initiatedBy: string;
  costImpact: string;
}

const changes: ChangeRow[] = [
  {
    time: "Jul 28, 09:54:48",
    change: "ADDED",
    resource: "cloudaudit_googleapis_com_...",
    type: "Table",
    region: "US",
    project: "138101788",
    initiatedBy: "—",
    costImpact: "—",
  },
  {
    time: "Jul 28, 09:54:48",
    change: "ADDED",
    resource: "cloudaudit_googleapis_com_...",
    type: "Table",
    region: "US",
    project: "138101788",
    initiatedBy: "—",
    costImpact: "—",
  },
  {
    time: "Jul 28, 09:54:48",
    change: "ADDED",
    resource: "cloudaudit_googleapis_com_...",
    type: "Table",
    region: "US",
    project: "138101788",
    initiatedBy: "—",
    costImpact: "—",
  },
  {
    time: "Jul 28, 09:54:48",
    change: "ADDED",
    resource: "cloudaudit_googleapis_com_...",
    type: "Table",
    region: "US",
    project: "138101788",
    initiatedBy: "—",
    costImpact: "—",
  },
  {
    time: "Jul 27, 20:25:13",
    change: "ADDED",
    resource: "parth-db-vpc",
    type: "Subnetwork",
    region: "as-se3",
    project: "138101788",
    initiatedBy: "—",
    costImpact: "—",
  },
  {
    time: "Jul 27, 20:25:13",
    change: "ADDED",
    resource: "parth-db-vpc",
    type: "Subnetwork",
    region: "eu-c2",
    project: "138101788",
    initiatedBy: "—",
    costImpact: "—",
  },
  {
    time: "Jul 27, 20:25:13",
    change: "ADDED",
    resource: "default",
    type: "Subnetwork",
    region: "eu-n1",
    project: "138101788",
    initiatedBy: "—",
    costImpact: "—",
  },
];

const filterTabs: { label: string; value: "ALL" | ChangeKind }[] = [
  { label: "All", value: "ALL" },
  { label: "ADDED", value: "ADDED" },
  { label: "REMOVED", value: "REMOVED" },
  { label: "MODIFIED", value: "MODIFIED" },
];

const timeRangeOptions = [
  "Last 1h",
  "Last 6h",
  "Last 24h",
  "Last 7d",
  "Last 30d",
  "All time",
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ChangeLogPage() {
  const [activeFilter, setActiveFilter] = useState<"ALL" | ChangeKind>("ALL");
  const [activeRange, setActiveRange] = useState("Last 7d");

  const filtered =
    activeFilter === "ALL"
      ? changes
      : changes.filter((c) => c.change === activeFilter);

  return (
    <div className="space-y-5">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Change Log</h1>
          <p className="text-sm text-slate-500">
            12,570 changes &middot; Jul 21, 12:40 &rarr; Now
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700">
            <option>All Organizations</option>
            <option>AI</option>
            <option>AWS CSRE</option>
            <option>Sea-Sbox</option>
          </select>
        </div>
      </div>

      {/* ---- Filter Tabs ---- */}
      <div className="flex items-center gap-2">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ---- Time Range Selector ---- */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-700">
            Time Range:{" "}
            <span className="text-blue-600">{activeRange}</span>
          </span>
          <span className="text-xs text-slate-500">
            Jul 21, 12:40 &rarr; Now
          </span>
        </div>

        {/* Slider track */}
        <div className="relative flex items-center">
          <div className="absolute inset-x-0 h-0.5 bg-slate-200 rounded-full" />
          <div className="relative flex w-full justify-between">
            {timeRangeOptions.map((opt) => {
              const isActive = activeRange === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setActiveRange(opt)}
                  className="relative flex flex-col items-center gap-1.5 group"
                >
                  <span
                    className={`w-3 h-3 rounded-full border-2 transition-colors ${
                      isActive
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white border-slate-300 group-hover:border-blue-400"
                    }`}
                  />
                  <span
                    className={`text-[11px] ${
                      isActive
                        ? "text-blue-600 font-semibold"
                        : "text-slate-500"
                    }`}
                  >
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---- Info Banner ---- */}
      <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800 leading-relaxed">
        <svg
          className="w-5 h-5 mt-0.5 shrink-0 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
          />
        </svg>
        <span>
          <strong>Initiated By</strong> is sourced from CloudTrail (AWS) or
          Audit Logs (GCP). Human IAM users and assumed roles are shown;
          internal AWS service calls (SSM, EC2, etc.) are excluded. Click{" "}
          <strong>MODIFIED</strong> rows to see exactly what changed (old &rarr;
          new values). If blank, use{" "}
          <strong>Agent &rarr; CloudTrail &rarr; Enrich actors</strong> to
          backfill &mdash; requires{" "}
          <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono">
            cloudtrail:LookupEvents
          </code>{" "}
          IAM permission.
        </span>
      </div>

      {/* ---- Table ---- */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Change</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Region</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Initiated By</th>
                <th className="px-4 py-3 font-medium">Cost Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-slate-50 transition-colors cursor-default"
                >
                  {/* Time */}
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-mono text-xs">
                    {row.time}
                  </td>

                  {/* Change */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-xs font-semibold ${
                        row.change === "ADDED"
                          ? "text-emerald-600"
                          : row.change === "REMOVED"
                          ? "text-red-500"
                          : "text-amber-600"
                      }`}
                    >
                      {row.change}
                    </span>
                  </td>

                  {/* Resource */}
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-800">
                    {row.resource}
                  </td>

                  {/* Type badge */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                      {row.type}
                    </span>
                  </td>

                  {/* Region */}
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" />
                      </svg>
                      {row.region}
                    </span>
                  </td>

                  {/* Project */}
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-mono text-xs">
                    {row.project}
                  </td>

                  {/* Initiated By */}
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                    {row.initiatedBy}
                  </td>

                  {/* Cost Impact */}
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                    {row.costImpact}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
