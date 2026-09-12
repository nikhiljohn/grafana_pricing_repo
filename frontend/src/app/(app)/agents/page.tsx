"use client";

/* ------------------------------------------------------------------ */
/*  Agent Operations                                                   */
/*                                                                     */
/*  The operating model made visible: Intellicore holds the detail and */
/*  hands the squad exactly what to run. Every packet on this page is  */
/*  a recommendation a human executes — nothing here mutates the       */
/*  estate, because Searce holds read-mostly access (SOW §4.11) and    */
/*  every change needs Client approval (SOW §3.2).                     */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import { useApiData } from "@/lib/api";
import type {
  AgentRow,
  WorkPacket,
} from "@/lib/api/mock/agents";

type Tab = "packets" | "fleet" | "sizing";

interface FleetSummary {
  agentCount: number;
  monthlyCalls: number;
  apiSurfaces: number;
  monthlyUsd: number;
  monthlyInr: number;
  cloudSpendShare: string;
  models: { name: string; usd: number; selected: boolean }[];
}

const TABS: Record<Tab, string> = {
  packets: "Work Packets",
  fleet: "Agent Fleet",
  sizing: "Claude API Sizing",
};

const TIER_LABEL: Record<AgentRow["tier"], string> = {
  streaming: "Streaming",
  scheduled: "Scheduled",
  on_demand: "On-demand",
};

const PRIORITY_STYLE: Record<WorkPacket["sowPriority"], string> = {
  P1: "bg-red-50 text-red-700 ring-1 ring-red-200",
  P2: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  P3: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  P4: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

const STATUS_DOT: Record<AgentRow["status"], string> = {
  active: "bg-emerald-500",
  investigating: "bg-amber-500",
  idle: "bg-slate-300",
};

export default function AgentOperationsPage() {
  const [tab, setTab] = useState<Tab>("packets");
  const [openPacket, setOpenPacket] = useState<string | null>("wp-1");

  const { data: agents } = useApiData<AgentRow[]>("/agents", []);
  const { data: packets } = useApiData<WorkPacket[]>("/agents/work-packets", []);
  const { data: fleet } = useApiData<FleetSummary | null>("/agents/fleet-summary", null);

  const openCount = packets.filter((p) => p.ticketStatus !== "Suppressed").length;
  const suppressed = packets.filter((p) => p.ticketStatus === "Suppressed").length;
  const activeAgents = agents.filter((a) => a.status !== "idle").length;

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-start justify-between gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">Agent Operations</h1>
              <p className="text-sm text-slate-500">
                Intellicore holds the detail and hands your team exactly what to run —
                every action below is executed by a human, never by the platform
              </p>
            </div>
          </div>
          <span className="mt-1 shrink-0 whitespace-nowrap rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-violet-200">
            Advisory mode · SOW §4.11
          </span>
        </div>
      </div>

      {/* Stat strip */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Agents" value={String(agents.length)} sub={`${activeAgents} active`} />
          <Stat label="Open work packets" value={String(openCount)} sub="awaiting a human" accent="border-amber-200" />
          <Stat label="Suppressed (30d)" value={String(suppressed)} sub="never paged anyone" accent="border-emerald-200" />
          <Stat
            label="Claude API surfaces"
            value={String(fleet?.apiSurfaces ?? 1)}
            sub="Messages API"
          />
          <Stat
            label="AI layer cost"
            value={fleet ? `₹${fleet.monthlyInr.toLocaleString("en-IN")}` : "—"}
            sub={fleet?.cloudSpendShare ?? ""}
            accent="border-emerald-200"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 px-6">
        <div className="flex gap-0">
          {(Object.keys(TABS) as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? "border-b-2 border-violet-500 text-violet-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {TABS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {tab === "packets" && (
          <WorkPacketList packets={packets} open={openPacket} setOpen={setOpenPacket} />
        )}
        {tab === "fleet" && <FleetTable agents={agents} />}
        {tab === "sizing" && <Sizing fleet={fleet} agents={agents} />}
      </div>
    </div>
  );
}

/* ── Work packets ─────────────────────────────────────────────────── */

function WorkPacketList({
  packets,
  open,
  setOpen,
}: {
  packets: WorkPacket[];
  open: string | null;
  setOpen: (v: string | null) => void;
}) {
  if (packets.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-500">No work packets.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Each packet is a complete runbook: what happened, what it means, the exact commands, and how
        to undo it. Steps that change state are marked as needing Client approval.
      </p>

      {packets.map((p) => {
        const isOpen = open === p.id;
        const suppressed = p.recommendedAction === "suppress";
        return (
          <div
            key={p.id}
            className={`rounded-xl border bg-white ${
              suppressed ? "border-slate-200" : "border-slate-300"
            }`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : p.id)}
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLE[p.sowPriority]}`}>
                    {p.sowPriority}
                  </span>
                  <span className="text-xs text-slate-400">{p.agentName}</span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{p.raisedAt}</span>
                  {p.ticketId > 0 ? (
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                      SS-{p.ticketId}
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Suppressed — no ticket raised
                    </span>
                  )}
                </div>
                <p className="font-medium text-slate-800">{p.subject}</p>
                <p className="mt-1 text-sm text-slate-500">{p.summary}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-slate-400">{p.confidence}%</span>
                <svg
                  className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-5">
                {p.confidence < 70 && (
                  <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Low confidence — verify the diagnosis before executing, not just the steps.
                  </div>
                )}

                <Section title="What happened before">
                  <p className="text-sm leading-relaxed text-slate-700">
                    {p.memoryContext || "No prior occurrence on this estate. This is a new pattern."}
                  </p>
                </Section>

                {p.sopSteps.length > 0 ? (
                  <Section title="Steps to run">
                    <ol className="space-y-3">
                      {p.sopSteps.map((s) => (
                        <li key={s.step} className="flex gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                            {s.step}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-700">{s.action}</p>
                            <pre className="mt-1.5 overflow-x-auto rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-100">
                              <code>{s.command}</code>
                            </pre>
                            <p className="mt-1.5 text-xs text-slate-500">Expect: {s.expected}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </Section>
                ) : (
                  <Section title="Action">
                    <p className="text-sm text-slate-700">
                      No steps required — the agent recommends suppressing this signal.
                    </p>
                  </Section>
                )}

                {p.rollback && (
                  <Section title="Rollback">
                    <p className="text-sm leading-relaxed text-slate-700">{p.rollback}</p>
                  </Section>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
                  {p.requiresClientApproval && (
                    <span className="rounded-md bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                      Requires Client approval before execution (SOW §3.2)
                    </span>
                  )}
                  {p.ticketId > 0 && (
                    <span className="text-xs text-slate-500">
                      FreshService SS-{p.ticketId} · {p.ticketStatus}
                    </span>
                  )}
                  <span className="ml-auto text-xs italic text-slate-400">
                    Executed by a Searce engineer — Intellicore does not apply changes
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Fleet ────────────────────────────────────────────────────────── */

function FleetTable({ agents }: { agents: AgentRow[] }) {
  const tiers: AgentRow["tier"][] = ["streaming", "scheduled", "on_demand"];

  return (
    <div className="space-y-8">
      {tiers.map((tier) => {
        const rows = agents.filter((a) => a.tier === tier);
        if (rows.length === 0) return null;
        const calls = rows.reduce((s, a) => s + a.monthlyCalls, 0);
        return (
          <div key={tier}>
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                {TIER_LABEL[tier]}
              </h2>
              <span className="text-xs text-slate-400">
                {rows.length} agents · {calls.toLocaleString()} calls/mo
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {["Agent", "Tower", "Trigger", "Produces", "Calls/mo", "SOW"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.key} className="border-b border-slate-100 last:border-0 align-top">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[a.status]}`} />
                          <span className="text-sm font-medium text-slate-700">{a.name}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{a.lastAction}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{a.tower}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{a.trigger}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{a.produces}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                        {a.monthlyCalls.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">{a.sowClause}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Sizing ───────────────────────────────────────────────────────── */

function Sizing({ fleet, agents }: { fleet: FleetSummary | null; agents: AgentRow[] }) {
  if (!fleet) return <p className="py-16 text-center text-sm text-slate-500">No sizing data.</p>;

  const byCalls = [...agents].sort((a, b) => b.monthlyCalls - a.monthlyCalls).slice(0, 6);
  const maxCalls = byCalls[0]?.monthlyCalls || 1;

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
        <h2 className="mb-1 text-base font-semibold text-violet-900">
          There is one Claude API, not many
        </h2>
        <p className="text-sm leading-relaxed text-violet-800">
          Every agent is a prompt shape and a token profile over the same Messages API endpoint.
          There is nothing per-agent to procure or rate-limit separately. What varies is call volume
          ({fleet.monthlyCalls.toLocaleString()}/month across {fleet.agentCount} agents) and model tier.
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Model tier options
        </h3>
        <div className="space-y-2">
          {fleet.models.map((m) => (
            <div
              key={m.name}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                m.selected ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    m.selected ? "bg-violet-500" : "bg-slate-300"
                  }`}
                />
                <span className={`text-sm ${m.selected ? "font-medium text-violet-900" : "text-slate-600"}`}>
                  {m.name}
                </span>
              </div>
              <span className={`text-sm font-semibold ${m.selected ? "text-violet-900" : "text-slate-500"}`}>
                ${m.usd.toFixed(2)}/mo
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          The gap between Opus everywhere and the mixed tier is about $67/month. The two agents you
          would downgrade — Alert Triage and GKE Health — are exactly the ones deciding what wakes
          someone at 03:00, so the default keeps them on Opus. The cheaper tiers stay available as a
          deliberate commercial choice.
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Call volume by agent
        </h3>
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
          {byCalls.map((a) => (
            <div key={a.key} className="flex items-center gap-3">
              <span className="w-56 shrink-0 truncate text-sm text-slate-600">{a.name}</span>
              <div className="h-2 flex-1 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-violet-400"
                  style={{ width: `${(a.monthlyCalls / maxCalls) * 100}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-sm text-slate-500">
                {a.monthlyCalls.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Prompt caching is load-bearing</h3>
        <p className="text-sm leading-relaxed text-slate-600">
          Each agent&apos;s ~12K-token prefix — the SOP library plus estate context — is cached, with
          the per-call signal placed after the breakpoint. At a 95% hit rate that is roughly a 5×
          saving on the fleet bill. It is also fragile: interpolating a timestamp or a ticket ID into
          the prefix silently invalidates it. The runtime raises a warning whenever a cache read
          comes back zero, and that warning should be treated as an incident.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <h3 className="mb-2 text-sm font-semibold text-amber-900">BYOK — keys are the Client&apos;s</h3>
        <p className="text-sm leading-relaxed text-amber-800">
          Every call bills to Shoppers Stop&apos;s own LLM key (SOW §3.2, §4.10), so these figures are
          what the Client pays Anthropic, not what Searce pays. That also makes key health an
          operational concern: a lapsed or rate-limited key stops all {fleet.agentCount} agents, and
          the engagement silently reverts to fully manual operation.
        </p>
      </div>
    </div>
  );
}

/* ── Small pieces ─────────────────────────────────────────────────── */

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className={`rounded-xl border bg-white p-4 ${accent ?? "border-slate-200"}`}>
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-2xl font-semibold text-slate-800">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h4>
      {children}
    </div>
  );
}
