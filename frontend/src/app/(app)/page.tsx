"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/charts";
import { useApiData } from "@/lib/api";
import { useOrg } from "@/lib/org-context";
import { ApplyFixModal } from "@/components/ApplyFixModal";
import { SCORE_METHODOLOGY_SUMMARY } from "@/lib/scoring";
import type { ChangeItem, OpsScore } from "@/lib/api";

/* ── data shapes served through the abstraction layer ─────────────────── */

interface AttentionItem {
  severity: "red" | "amber" | "blue";
  pillar: string;
  title: string;
  memory: string;
}

interface MemoryPatternRow {
  pattern: string;
  firstSeen: string;
  occurrences: number;
  lastResolution: string;
  confidence: number;
}

interface CsreActivityItem {
  label: string;
  value: string;
}

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
      className="w-7 h-7 text-slate-700"
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

/* ── page ─────────────────────────────────────────────────────────────── */

export default function CommandCenterPage() {
  const { tenant, environment } = useOrg();
  const [showScoreInfo, setShowScoreInfo] = useState(false);

  const { data: intelligenceScores } = useApiData<OpsScore[]>(
    "/command-center/scores",
    [],
  );
  const { data: attentionItems } = useApiData<AttentionItem[]>(
    "/command-center/attention",
    [],
  );
  // Local, mutable copy so "Resolve" actually removes the item instead of
  // being a decorative button — resyncs whenever the org switcher changes.
  const [openAttention, setOpenAttention] = useState<AttentionItem[]>([]);
  const [resolveTarget, setResolveTarget] = useState<AttentionItem | null>(null);
  useEffect(() => {
    setOpenAttention(attentionItems);
  }, [attentionItems]);
  const { data: changeItems } = useApiData<ChangeItem[]>(
    "/command-center/changes",
    [],
  );
  const { data: memoryPatterns } = useApiData<MemoryPatternRow[]>(
    "/command-center/memory-patterns",
    [],
  );
  const { data: whatsWorkingWell } = useApiData<string[]>(
    "/command-center/working-well",
    [],
  );
  const { data: csreActivity } = useApiData<CsreActivityItem[]>(
    "/command-center/csre-activity",
    [],
  );
  const { data: timelineDays } = useApiData<number[]>(
    "/command-center/timeline",
    [],
  );

  return (
    <div className="space-y-6">
      {/* ── 1. Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <CommandIcon />
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Command Center
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Intelligence briefing for <span className="font-medium text-slate-700">{tenant.name}</span> ({environment}) — powered
              by Memory across CloudOps, FinOps, Cloud Security, DevOps &amp; AIOps
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-400 whitespace-nowrap">
            Last briefing: 12 min ago
          </span>
        </div>
      </div>

      {/* ── 2. Intelligence Score Bar ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">Pillar Intelligence Scores</span>
        <div className="relative">
          <button
            onClick={() => setShowScoreInfo((v) => !v)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px]">
              i
            </span>
            How is this calculated?
          </button>
          {showScoreInfo && (
            <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600 shadow-lg">
              {SCORE_METHODOLOGY_SUMMARY}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        {intelligenceScores.map((s) => {
          let pillBg = "bg-emerald-50 border-emerald-200";
          let scoreFg = "text-emerald-700";
          let dotBg = "bg-emerald-500";

          if (s.status === "warning") {
            pillBg = "bg-amber-50 border-amber-200";
            scoreFg = "text-amber-700";
            dotBg = "bg-amber-500";
          } else if (s.status === "active") {
            pillBg = "bg-blue-50 border-blue-200";
            scoreFg = "text-blue-700";
            dotBg = "bg-blue-500";
          }

          return (
            <div
              key={s.pillar}
              className={`flex-1 flex items-center gap-3 rounded-lg border px-4 py-3 ${pillBg}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${dotBg}`} />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {s.pillar}
                </div>
                <div className={`text-lg font-bold ${scoreFg} leading-tight`}>
                  {s.score !== null ? `${s.score}/100` : "Active"}
                </div>
                {s.note && (
                  <div className="text-[11px] text-slate-500 truncate">
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
        <h2 className="text-base font-semibold text-slate-800 mb-3">
          Needs Your Attention
        </h2>
        <div className="space-y-3">
          {openAttention.map((item, i) => (
            <div
              key={i}
              className={`bg-white border border-slate-200 border-l-4 ${severityBorder[item.severity]} rounded-xl p-4`}
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
                  <p className="text-sm font-medium text-slate-800">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5 italic">
                    <span className="not-italic">&#x1F9E0;</span>{" "}
                    Memory: {item.memory}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 pt-1">
                  <button
                    onClick={() => setResolveTarget(item)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                  >
                    Resolve
                  </button>
                  <button
                    disabled
                    title="Coming in V2 — dedicated investigation view per event"
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed"
                  >
                    Investigate
                  </button>
                  <button
                    onClick={() =>
                      setOpenAttention((cur) => cur.filter((a) => a !== item))
                    }
                    className="text-xs font-medium px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
          {openAttention.length === 0 && (
            <p className="text-sm text-slate-400 py-2">
              Nothing needs attention right now — everything is Resolved or Dismissed.
            </p>
          )}
        </div>
      </div>

      <ApplyFixModal
        open={resolveTarget !== null}
        onClose={() => setResolveTarget(null)}
        onConfirm={() => {
          setOpenAttention((cur) => cur.filter((a) => a !== resolveTarget));
        }}
        pillar={resolveTarget?.pillar}
        title={resolveTarget?.title ?? ""}
        memoryContext={resolveTarget?.memory ?? ""}
        confidence={null}
        fixDescription="Applies the same remediation Memory has already validated for this pattern, then re-checks the resource to confirm it held."
      />

      {/* ── 4. Two-column layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* LEFT — col-span-2 */}
        <div className="col-span-2 space-y-4">
          {/* What Changed — Last 24h */}
          <Card title="What Changed — Last 24h" subtitle="8,452 total changes across all pillars">
            <div className="space-y-3">
              {changeItems.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${pillarBadgeColor(c.pillar)}`}
                  >
                    {c.pillar}
                  </span>
                  <p className="text-sm text-slate-600 leading-snug">
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
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                      Pattern
                    </th>
                    <th className="pb-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                      First Seen
                    </th>
                    <th className="pb-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wider text-center">
                      Occurrences
                    </th>
                    <th className="pb-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                      Last Resolution
                    </th>
                    <th className="pb-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wider text-right">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {memoryPatterns.map((p, i) => (
                    <tr key={i}>
                      <td className="py-2.5 text-slate-800 font-medium">
                        {p.pattern}
                      </td>
                      <td className="py-2.5 text-slate-500">{p.firstSeen}</td>
                      <td className="py-2.5 text-slate-700 font-medium text-center tabular-nums">
                        {p.occurrences} times
                      </td>
                      <td className="py-2.5 text-slate-500">
                        {p.lastResolution}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums ${
                            p.confidence >= 90
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
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
            className="bg-emerald-50/50 border-emerald-200"
          >
            <div className="space-y-2.5">
              {whatsWorkingWell.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs mt-0.5">
                    &#x2713;
                  </span>
                  <span className="text-sm text-emerald-800 leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* CSRE Squad Activity */}
          <Card title="CSRE Squad Activity">
            <div className="space-y-3">
              {csreActivity.map((item, i) => (
                <div key={i}>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                    {item.label}
                  </div>
                  <div className="text-sm text-slate-700 font-medium mt-0.5">
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
          {timelineDays.map((level, i) => {
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
            <span className="text-xs text-slate-500">Clear</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-400" />
            <span className="text-xs text-slate-500">Minor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-400" />
            <span className="text-xs text-slate-500">Incident</span>
          </div>
          <span className="text-xs text-slate-400 ml-auto">
            2 incidents in 30d &middot; 99.94% uptime &middot; 26 min total
            downtime
          </span>
        </div>
      </Card>
    </div>
  );
}
