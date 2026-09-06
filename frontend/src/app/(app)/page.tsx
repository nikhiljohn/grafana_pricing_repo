"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/charts";
import {
  CUSTOMER_DATA,
  type CustomerKey,
} from "@/lib/api/mock/command-center";

/* ── helpers ──────────────────────────────────────────────────────────── */

const severityBorder: Record<string, string> = {
  red: "border-l-red-500",
  amber: "border-l-amber-500",
  blue: "border-l-blue-500",
};

const severityBadgeBg: Record<string, string> = {
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
};

function pillarBadgeColor(pillar: string): string {
  const map: Record<string, string> = {
    CloudOps: "bg-sky-100 text-sky-700",
    FinOps: "bg-amber-100 text-amber-700",
    "Cloud Security": "bg-red-100 text-red-700",
    DevOps: "bg-violet-100 text-violet-700",
    AIOps: "bg-indigo-100 text-indigo-700",
  };
  return map[pillar] || "bg-slate-100 text-slate-600";
}

function CommandIcon() {
  return (
    <svg
      className="w-7 h-7 text-slate-700 dark:text-slate-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
      />
    </svg>
  );
}

const CUSTOMERS: CustomerKey[] = [
  "All Organizations",
  "Netcore",
  "Aarti Industries",
  "ShoppersStop",
  "DesignX",
  "PayNimbus",
  "Kiranakart",
  "MediSetu",
  "ShipEasy",
];

/* ── page ─────────────────────────────────────────────────────────────── */

export default function CommandCenterPage() {
  const [org, setOrg] = useState<CustomerKey>("All Organizations");

  // All data changes reactively when org changes — no API round-trips
  const d = useMemo(() => CUSTOMER_DATA[org] ?? CUSTOMER_DATA["All Organizations"], [org]);

  return (
    <div className="space-y-6">
      {/* ── 1. Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <CommandIcon />
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
              Command Center
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {org === "All Organizations"
                ? "Intelligence briefing — powered by Memory across CloudOps, FinOps, Cloud Security, DevOps & AIOps"
                : `Intelligence briefing for ${org} — powered by Operational Memory`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <select
            value={org}
            onChange={(e) => setOrg(e.target.value as CustomerKey)}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            {CUSTOMERS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            Last briefing: 12 min ago
          </span>
        </div>
      </div>

      {/* ── 2. Intelligence Score Bar ──────────────────────────────────── */}
      <div className="flex gap-3">
        {d.scores.map((s) => {
          let pillBg = "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700";
          let scoreFg = "text-emerald-700 dark:text-emerald-400";
          let dotBg = "bg-emerald-500";

          if (s.status === "warning") {
            pillBg = "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700";
            scoreFg = "text-amber-700 dark:text-amber-400";
            dotBg = "bg-amber-500";
          } else if (s.status === "critical") {
            pillBg = "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700";
            scoreFg = "text-red-700 dark:text-red-400";
            dotBg = "bg-red-500";
          } else if (s.status === "active") {
            pillBg = "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700";
            scoreFg = "text-blue-700 dark:text-blue-400";
            dotBg = "bg-blue-500";
          }

          return (
            <div
              key={s.pillar}
              className={`flex-1 flex items-center gap-3 rounded-lg border px-4 py-3 ${pillBg}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${dotBg}`} />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  {s.pillar}
                </div>
                <div className={`text-lg font-bold ${scoreFg} leading-tight`}>
                  {s.score !== null ? `${s.score}/100` : "Active"}
                </div>
                {s.note && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {s.note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. Needs Your Attention ────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
          Needs Your Attention
        </h2>
        {d.attention.length === 0 ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-6 text-center">
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              ✓ All clear — no attention items for {org} right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {d.attention.map((item, i) => (
              <div
                key={i}
                className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-4 ${severityBorder[item.severity]} rounded-xl p-4`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${pillarBadgeColor(item.pillar)}`}
                      >
                        {item.pillar}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${severityBadgeBg[item.severity]}`}
                      >
                        {item.severity === "red"
                          ? "Critical"
                          : item.severity === "amber"
                            ? "Warning"
                            : "Info"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 italic">
                      <span className="not-italic">&#x1F9E0;</span>{" "}
                      {item.memory}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-600 text-white hover:bg-slate-700 transition-colors">
                      Resolve
                    </button>
                    <button className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      Investigate
                    </button>
                    <button className="text-xs font-medium px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Two-column layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* LEFT — col-span-2 */}
        <div className="col-span-2 space-y-4">
          {/* What Changed — Last 24h */}
          <Card
            title="What Changed — Last 24h"
            subtitle={
              org === "All Organizations"
                ? "Activity across all managed accounts"
                : `Activity for ${org}`
            }
          >
            <div className="space-y-3">
              {d.changes.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${pillarBadgeColor(c.pillar)}`}
                  >
                    {c.pillar}
                  </span>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug">
                    {c.detail}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Operational Memory — Patterns Detected */}
          <Card title="Operational Memory — Patterns Detected">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                    <th className="pb-2.5 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
                      Pattern
                    </th>
                    <th className="pb-2.5 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
                      First Seen
                    </th>
                    <th className="pb-2.5 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider text-center">
                      Occurrences
                    </th>
                    <th className="pb-2.5 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
                      Last Resolution
                    </th>
                    <th className="pb-2.5 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider text-right">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {d.patterns.map((p, i) => (
                    <tr key={i}>
                      <td className="py-2.5 text-slate-800 dark:text-slate-100 font-medium">
                        {p.pattern}
                      </td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">{p.firstSeen}</td>
                      <td className="py-2.5 text-slate-700 dark:text-slate-300 font-medium text-center tabular-nums">
                        {p.occurrences} times
                      </td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">
                        {p.lastResolution}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums ${
                            p.confidence >= 90
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {p.confidence}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT — col-span-1 */}
        <div className="col-span-1 space-y-4">
          {/* What's Working Well */}
          <Card
            title="What&apos;s Working Well"
            className="bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-700"
          >
            <div className="space-y-2.5">
              {d.workingWell.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs mt-0.5">
                    &#x2713;
                  </span>
                  <span className="text-sm text-emerald-800 dark:text-emerald-300 leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* CSRE Squad Activity */}
          <Card title="CSRE Squad Activity">
            <div className="space-y-3">
              {d.csreActivity.map((item, i) => (
                <div key={i}>
                  <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                    {item.label}
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── 5. Memory Timeline ─────────────────────────────────────────── */}
      <Card title="Memory Timeline" subtitle="Last 30 days of incident activity">
        <div className="flex items-end gap-1">
          {d.timeline.map((level, i) => {
            let bg = "bg-emerald-400";
            if (level === 1) bg = "bg-amber-400";
            if (level === 2) bg = "bg-red-400";
            return (
              <div
                key={i}
                className={`flex-1 h-6 rounded-sm ${bg} transition-colors`}
                title={`Day ${i + 1}: ${
                  level === 0
                    ? "No incidents"
                    : level === 1
                      ? "Minor issue"
                      : "Incident"
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Clear</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Minor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Incident</span>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
            {d.incidentSummary}
          </span>
        </div>
      </Card>
    </div>
  );
}
