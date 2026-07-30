"use client";

import { useState } from "react";
import {
  Sparkles,
  Bot,
  ShieldCheck,
  TrendingUp,
  Activity,
  Brain,
  MessageSquare,
  Wrench,
  BarChart3,
  Send,
  Zap,
  FileText,
  ShieldAlert,
  DollarSign,
  GitCompare,
  ClipboardCheck,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const tabs = ["AI Agents", "Query Infrastructure", "AI Analysis Tools", "Usage & Governance"] as const;
type Tab = (typeof tabs)[number];

const statsRow = [
  {
    label: "AI Agents Active",
    value: "3",
    sub: null,
    icon: Bot,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    pulse: true,
  },
  {
    label: "Auto-remediations (30d)",
    value: "23",
    sub: "0 regressions",
    icon: ShieldCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    pulse: false,
  },
  {
    label: "Tokens Used (30d)",
    value: "847K",
    sub: "$2.40 total cost",
    icon: Zap,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    pulse: false,
  },
  {
    label: "Memory Entries",
    value: "156",
    sub: "patterns, incidents, learnings",
    icon: Brain,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    pulse: false,
  },
  {
    label: "Success Rate",
    value: "96%",
    sub: "across all AI actions",
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    pulse: false,
  },
];

const agents = [
  {
    name: "Security Auto-Remediation Agent",
    status: "Active",
    statusColor: "bg-emerald-500",
    description:
      "Monitoring 342 findings. 23 auto-remediated in 30d. Currently watching: SSH security group creation events.",
    lastAction: "Restricted SSH group to VPN CIDR (2h ago)",
    confidence: 85,
  },
  {
    name: "Cost Anomaly Agent",
    status: "Investigating",
    statusColor: "bg-amber-500",
    description:
      "Detected BigQuery +340% spike. Correlating with Memory: matches Jul 15 ETL pattern (88% confidence). Awaiting human approval for fix.",
    lastAction: "Flagged anomaly, generated fix recommendation (4h ago)",
    confidence: 88,
  },
  {
    name: "Predictive Operations Agent",
    status: "Active",
    statusColor: "bg-emerald-500",
    description:
      "Monitoring 11 metrics across 5 instances. 1 critical anomaly (bastion-host egress). 4 trending toward breach in 22d.",
    lastAction: "Updated trend prediction for clens-dev CPU (12h ago)",
    confidence: 92,
  },
];

const activityLog = [
  {
    time: "2h ago",
    agent: "Security Agent",
    action: "Auto-restricted SSH group 'launch-wizard-111' to VPN CIDR",
    result: "Success",
    resultColor: "text-emerald-600",
    resultBg: "bg-emerald-50",
    icon: CheckCircle2,
  },
  {
    time: "4h ago",
    agent: "Cost Agent",
    action: "Detected BigQuery anomaly, generated remediation plan",
    result: "Awaiting approval",
    resultColor: "text-amber-600",
    resultBg: "bg-amber-50",
    icon: Clock,
  },
  {
    time: "8h ago",
    agent: "Predictive Agent",
    action: "Bastion-host egress classified as false positive (72% confidence)",
    result: "Flagged for review",
    resultColor: "text-orange-600",
    resultBg: "bg-orange-50",
    icon: Eye,
  },
  {
    time: "1d ago",
    agent: "Security Agent",
    action: "Disabled inactive IAM user test-user@searce.com",
    result: "Success",
    resultColor: "text-emerald-600",
    resultBg: "bg-emerald-50",
    icon: CheckCircle2,
  },
  {
    time: "2d ago",
    agent: "Cost Agent",
    action: "Applied committed use discount recommendation to project Sea-Sbox",
    result: "Success",
    resultColor: "text-emerald-600",
    resultBg: "bg-emerald-50",
    icon: CheckCircle2,
  },
];

const quickQueries = [
  "What changed in the last 24h?",
  "What's our biggest cost risk?",
  "Which findings should I fix first?",
  "Show me deployment patterns",
];

const analysisTools = [
  {
    icon: Activity,
    title: "Anomaly Narrative",
    desc: "AI explains anomalies in plain English with Memory context",
    usage: 12,
    usageLabel: "analyses run",
  },
  {
    icon: ShieldAlert,
    title: "Policy Engine",
    desc: "Natural language → IAM/firewall policies",
    usage: 8,
    usageLabel: "policies generated",
  },
  {
    icon: AlertTriangle,
    title: "Incident Assistant",
    desc: "Correlates current incident with Memory of past resolutions",
    usage: 23,
    usageLabel: "incidents assisted",
  },
  {
    icon: DollarSign,
    title: "Cost Optimization Advisor",
    desc: "Recommendations with ROI from past applications",
    usage: 7,
    usageLabel: "optimizations applied",
  },
  {
    icon: GitCompare,
    title: "Drift Analysis",
    desc: "Detects config drift and correlates with incidents",
    usage: 3,
    usageLabel: "drifts detected",
  },
  {
    icon: ClipboardCheck,
    title: "Compliance Reporter",
    desc: "Generates compliance reports with remediation history",
    usage: 2,
    usageLabel: "reports generated",
  },
];

const dailyTokenData = [
  12, 18, 45, 28, 34, 22, 15, 42, 38, 27, 19, 55, 31, 24, 48, 36, 29, 17,
  41, 33, 26, 52, 21, 37, 44, 30, 23, 47, 35, 20,
];
const maxToken = Math.max(...dailyTokenData);

const costByFeature = [
  { feature: "Auto-remediation", tokens: "312K", cost: "$0.94", pct: 37, color: "bg-blue-500" },
  { feature: "Query Infrastructure", tokens: "245K", cost: "$0.74", pct: 29, color: "bg-violet-500" },
  { feature: "Anomaly Analysis", tokens: "156K", cost: "$0.47", pct: 18, color: "bg-amber-500" },
  { feature: "Policy Generation", tokens: "89K", cost: "$0.27", pct: 11, color: "bg-emerald-500" },
  { feature: "Reports", tokens: "45K", cost: "$0.14", pct: 5, color: "bg-slate-400" },
];

const auditTrail = [
  {
    time: "2h ago",
    decision: "Auto-restrict SSH security group",
    reasoning: "Matched known over-permissive pattern. Memory confidence 91%. No prior regressions from this action type.",
    outcome: "Executed",
    outcomeColor: "text-emerald-600",
  },
  {
    time: "4h ago",
    decision: "Flag BigQuery cost anomaly",
    reasoning: "Spend exceeded 3-sigma threshold. Memory matched Jul 15 ETL incident (88%). Auto-fix available but cost > $50 — requires approval.",
    outcome: "Awaiting approval",
    outcomeColor: "text-amber-600",
  },
  {
    time: "8h ago",
    decision: "Classify bastion egress as false positive",
    reasoning: "Traffic pattern matches scheduled backup window. Confidence 72% — below auto-execute threshold. Flagged for human review.",
    outcome: "Flagged",
    outcomeColor: "text-orange-600",
  },
  {
    time: "1d ago",
    decision: "Disable inactive IAM user",
    reasoning: "No login for 90+ days. No active service account keys. Memory shows 4 prior successful deactivations with 0 rollbacks.",
    outcome: "Executed",
    outcomeColor: "text-emerald-600",
  },
  {
    time: "2d ago",
    decision: "Apply CUD recommendation",
    reasoning: "12-month usage pattern stable. Projected savings $1,240/yr. Memory: 3 prior CUD applications, all within 5% of projected savings.",
    outcome: "Executed",
    outcomeColor: "text-emerald-600",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AIOpsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("AI Agents");
  const [queryInput, setQueryInput] = useState("");

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
                onClick={() => setQueryInput(q)}
                className="text-left text-sm text-slate-600 bg-white border border-slate-200 rounded-lg px-4 py-2.5 hover:bg-slate-50 hover:border-slate-300 transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Sample Conversation */}
          <div className="space-y-3">
            {/* User message */}
            <div className="flex justify-end">
              <div className="rounded-xl rounded-br-sm bg-blue-500 text-white px-4 py-3 max-w-md">
                <p className="text-sm">
                  What&apos;s our biggest cost risk right now?
                </p>
              </div>
            </div>

            {/* AI response */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4 text-blue-500" />
              </div>
              <div className="rounded-xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 max-w-lg">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Your biggest cost risk is the active{" "}
                  <span className="font-semibold">
                    BigQuery anomaly (+340% in 4h, est. $42 excess)
                  </span>
                  . Memory shows this matches the Jul 15 ETL spike pattern
                  &mdash; that time, an unoptimized JOIN on{" "}
                  <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                    analytics.events
                  </code>{" "}
                  scanned 2TB instead of 45GB after a partition filter was
                  removed.
                </p>
                <p className="text-sm text-slate-700 leading-relaxed mt-2">
                  Confidence this is the same root cause:{" "}
                  <span className="font-semibold text-amber-600">88%</span>. I
                  can apply the fix from last time &mdash; should I?
                </p>
                <div className="flex gap-2 mt-3">
                  <button className="text-xs font-medium bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition">
                    Apply fix
                  </button>
                  <button className="text-xs font-medium bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">
                    Show details first
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Input Field */}
          <div className="sticky bottom-0 pt-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ask about your cloud infrastructure..."
                className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition shrink-0">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
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
                    <button className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
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
