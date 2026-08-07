"use client";

import { useState } from "react";
import {
  Sparkles,
  Bot,
  ShieldCheck,
  Brain,
  MessageSquare,
  Wrench,
  BarChart3,
  Send,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useApiData } from "@/lib/api";
import { useOrg } from "@/lib/org-context";
import { askMemoryChat } from "@/lib/api/chat";
import { ApplyFixModal } from "@/components/ApplyFixModal";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

const tabs = ["AI Agents", "Query Infrastructure", "AI Analysis Tools", "Usage & Governance"] as const;
type Tab = (typeof tabs)[number];

interface StatItem {
  label: string;
  value: string;
  sub: string | null;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  pulse: boolean;
}

interface Agent {
  name: string;
  status: string;
  statusColor: string;
  description: string;
  lastAction: string;
  confidence: number;
}

interface ActivityEntry {
  time: string;
  agent: string;
  action: string;
  result: string;
  resultColor: string;
  resultBg: string;
  icon: LucideIcon;
}

interface AnalysisTool {
  icon: LucideIcon;
  title: string;
  desc: string;
  usage: number;
  usageLabel: string;
}

interface CostFeature {
  feature: string;
  tokens: string;
  cost: string;
  pct: number;
  color: string;
}

interface AuditEntry {
  time: string;
  decision: string;
  reasoning: string;
  outcome: string;
  outcomeColor: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  confidence?: string | null;
  suggestedFix?: string | null;
  source?: "live" | "seed";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AIOpsPage() {
  const { tenantId, environment, tenant } = useOrg();
  const [activeTab, setActiveTab] = useState<Tab>("AI Agents");
  const [queryInput, setQueryInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [fixModal, setFixModal] = useState<{ question: string; fix: string; confidence: string | null } | null>(null);

  async function sendQuestion(question: string) {
    const q = question.trim();
    if (!q || sending) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setQueryInput("");
    setSending(true);
    const res = await askMemoryChat(q, { tenantId, environment });
    setMessages((m) => [
      ...m,
      { role: "assistant", text: res.answer, confidence: res.confidence, suggestedFix: res.suggestedFix, source: res.source },
    ]);
    setSending(false);
  }

  const { data: statsRow } = useApiData<StatItem[]>("/aiops/stats", []);
  const { data: agents } = useApiData<Agent[]>("/aiops/agents", []);
  const { data: activityLog } = useApiData<ActivityEntry[]>("/aiops/activity", []);
  const { data: quickQueries } = useApiData<string[]>("/aiops/quick-queries", []);
  const { data: analysisTools } = useApiData<AnalysisTool[]>("/aiops/tools", []);
  const { data: dailyTokenData } = useApiData<number[]>("/aiops/daily-tokens", []);
  const { data: costByFeature } = useApiData<CostFeature[]>("/aiops/cost-by-feature", []);
  const { data: auditTrail } = useApiData<AuditEntry[]>("/aiops/audit-trail", []);

  const maxToken = Math.max(1, ...dailyTokenData);

  return (
    <div className="min-h-screen text-slate-800 p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              AIOps Intelligence
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              AI-powered operations &mdash; agents, analysis, natural language
              queries, and usage governance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select className="appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm text-slate-600 focus:border-blue-500 focus:outline-none">
              <option>All Organizations</option>
              <option>searce-playground</option>
              <option>searce-prod</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
            <Sparkles className="h-3 w-3" />
            Powered by Claude
          </span>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-4">
        {statsRow.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`rounded-xl border ${s.border} bg-white p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${s.color}`} />
                </div>
                {s.pulse && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                  </span>
                )}
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              {s.sub && (
                <p className="text-[11px] text-slate-400 mt-1">{s.sub}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 border-b border-slate-200">
        {tabs.map((tab) => {
          const icons: Record<Tab, typeof Bot> = {
            "AI Agents": Bot,
            "Query Infrastructure": MessageSquare,
            "AI Analysis Tools": Wrench,
            "Usage & Governance": BarChart3,
          };
          const TabIcon = icons[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium transition ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {tab}
            </button>
          );
        })}
      </div>

      {/* ── AI Agents ──────────────────────────────────────────── */}
      {activeTab === "AI Agents" && (
        <div className="space-y-6">
          {/* Active Agents */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Active Agents
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {agents.map((a) => (
                <div
                  key={a.name}
                  className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">
                      {a.name}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      <span className="relative flex h-2 w-2">
                        <span
                          className={`absolute inline-flex h-full w-full animate-ping rounded-full ${a.statusColor} opacity-75`}
                        />
                        <span
                          className={`relative inline-flex h-2 w-2 rounded-full ${a.statusColor}`}
                        />
                      </span>
                      {a.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {a.description}
                  </p>
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-600 shrink-0">
                        Last action:
                      </span>
                      <span>{a.lastAction}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">
                        Confidence threshold:
                      </span>
                      <span>{a.confidence}%</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${a.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Activity Log */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Agent Activity Log
            </h2>
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
              {activityLog.map((entry, i) => {
                const EntryIcon = entry.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    <span className="text-xs text-slate-400 w-14 shrink-0 tabular-nums">
                      {entry.time}
                    </span>
                    <span className="text-xs font-medium text-slate-600 w-32 shrink-0">
                      {entry.agent}
                    </span>
                    <span className="flex-1 text-sm text-slate-700">
                      {entry.action}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${entry.resultBg} ${entry.resultColor}`}
                    >
                      <EntryIcon className="h-3 w-3" />
                      {entry.result}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agent Memory */}
          <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="h-5 w-5 text-violet-500" />
              <h3 className="text-sm font-semibold text-violet-800">
                Agent Memory
              </h3>
            </div>
            <p className="text-sm text-violet-700 leading-relaxed">
              Agents have collectively built{" "}
              <span className="font-semibold">156 memory entries</span> from 23
              remediations, 47 deployments, and 86 anomaly analyses.
              Cross-pillar correlation enabled.
            </p>
          </div>
        </div>
      )}

      {/* ── Query Infrastructure ───────────────────────────────── */}
      {activeTab === "Query Infrastructure" && (
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Welcome */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  I have <span className="font-semibold">Memory</span> of your
                  entire infrastructure. Ask me anything &mdash; I&apos;ll
                  answer with context from past incidents, cost patterns, and
                  security findings.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Query Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {quickQueries.map((q) => (
              <button
                key={q}
                onClick={() => sendQuestion(q)}
                disabled={sending}
                className="text-left text-sm text-slate-600 bg-white border border-slate-200 rounded-lg px-4 py-2.5 hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-60"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Conversation */}
          {messages.length > 0 && (
            <div className="space-y-3">
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="rounded-xl rounded-br-sm bg-blue-500 text-white px-4 py-3 max-w-md">
                      <p className="text-sm">{m.text}</p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 shrink-0 mt-0.5">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="rounded-xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 max-w-lg">
                      <p className="text-sm text-slate-700 leading-relaxed">{m.text}</p>
                      {m.confidence && (
                        <p className="text-xs font-medium text-amber-600 mt-2">
                          Confidence: {m.confidence}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        {m.suggestedFix && (
                          <button
                            onClick={() =>
                              setFixModal({ question: m.text, fix: m.suggestedFix as string, confidence: m.confidence ?? null })
                            }
                            className="text-xs font-medium bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition"
                          >
                            Apply fix
                          </button>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {m.source === "live" ? "Answered from your live Memory graph" : `Seed data · ${tenant.name}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ),
              )}
              {sending && (
                <div className="flex items-center gap-3 text-xs text-slate-400 pl-11">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Reading the Memory graph…
                </div>
              )}
            </div>
          )}

          {messages.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">
              Ask a question above, or try one of the quick queries.
            </p>
          )}

          {/* Input Field */}
          <div className="sticky bottom-0 pt-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendQuestion(queryInput);
                }}
                placeholder="Ask about your cloud infrastructure..."
                disabled={sending}
                className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
              />
              <button
                onClick={() => sendQuestion(queryInput)}
                disabled={sending || !queryInput.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition shrink-0 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          <ApplyFixModal
            open={fixModal !== null}
            onClose={() => setFixModal(null)}
            onConfirm={() => {
              setMessages((m) => [
                ...m,
                { role: "assistant", text: "Applied. I'll keep watching this resource and let you know if the pattern comes back." },
              ]);
            }}
            pillar="AIOps"
            title="Apply the suggested fix?"
            memoryContext={fixModal?.question ?? ""}
            confidence={fixModal?.confidence ?? null}
            fixDescription={fixModal?.fix ?? ""}
          />
        </div>
      )}

      {/* ── AI Analysis Tools ──────────────────────────────────── */}
      {activeTab === "AI Analysis Tools" && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Analysis Tools
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {analysisTools.map((tool) => {
              const ToolIcon = tool.icon;
              return (
                <div
                  key={tool.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                        <ToolIcon className="h-5 w-5 text-blue-500" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        {tool.title}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                      {tool.usage} {tool.usageLabel}
                    </span>
                    <button
                      disabled
                      title="Coming in V2 — on-demand tool runs outside the chat"
                      className="text-xs font-medium text-blue-300 bg-blue-50/50 px-3 py-1.5 rounded-lg cursor-not-allowed"
                    >
                      Launch
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Usage & Governance ─────────────────────────────────── */}
      {activeTab === "Usage & Governance" && (
        <div className="space-y-6">
          {/* Monthly Usage Bar Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">
              Monthly Usage
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Daily token consumption &mdash; last 30 days
            </p>
            <div className="flex items-end gap-1 h-40">
              {dailyTokenData.map((val, i) => (
                <div
                  key={i}
                  className="flex-1 group relative"
                >
                  <div
                    className="w-full bg-blue-400 hover:bg-blue-500 rounded-t transition-colors"
                    style={{ height: `${(val / maxToken) * 100}%` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                    {val}K tokens
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-slate-400">Jul 1</span>
              <span className="text-[10px] text-slate-400">Jul 30</span>
            </div>
          </div>

          {/* Cost by Feature */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Cost by Feature
            </h2>
            <div className="space-y-3">
              {costByFeature.map((f) => (
                <div key={f.feature} className="flex items-center gap-4">
                  <span className="text-sm text-slate-700 w-44 shrink-0">
                    {f.feature}
                  </span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${f.color} rounded-full transition-all`}
                      style={{ width: `${f.pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-16 text-right tabular-nums">
                    {f.tokens}
                  </span>
                  <span className="text-xs font-medium text-slate-700 w-14 text-right tabular-nums">
                    {f.cost}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Governance */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              <h3 className="text-sm font-semibold text-blue-800">
                Governance Rules
              </h3>
            </div>
            <div className="space-y-2 text-sm text-blue-700 leading-relaxed">
              <p>
                <span className="font-semibold">
                  AI actions requiring human approval:
                </span>{" "}
                IAM changes, cost impact &gt; $50, security policy
                modifications.
              </p>
              <p>
                <span className="font-semibold">All other actions:</span>{" "}
                auto-execute with Memory confidence &gt; 85%.
              </p>
            </div>
          </div>

          {/* Audit Trail */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Audit Trail
            </h2>
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
              {auditTrail.map((entry, i) => (
                <div key={i} className="px-5 py-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 tabular-nums">
                        {entry.time}
                      </span>
                      <span className="text-sm font-medium text-slate-800">
                        {entry.decision}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium ${entry.outcomeColor}`}
                    >
                      {entry.outcome}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed pl-[4.25rem]">
                    {entry.reasoning}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
