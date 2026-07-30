"use client";

import { useState } from "react";

const instantTools = [
  { key: "query", icon: "🔍", label: "Query Your Infrastructure", desc: "Ask anything in plain English — AI translates to live DB queries", tag: "Instant" },
  { key: "anomaly", icon: "⚡", label: "Anomaly Narrative", desc: "AI explains what changed, who did it, and what to watch for", tag: "Instant" },
  { key: "risk", icon: "✦", label: "Deployment Risk Scorer", desc: "", tag: "" },
  { key: "policy", icon: "🏛️", label: "Policy Engine", desc: "Write policies in plain English — AI evaluates every resource", tag: "Instant" },
  { key: "incident", icon: "⚠️", label: "Incident Assistant", desc: "AI incident commander — root cause, actions, escalation guidance", tag: "Instant" },
];

const analysisTools = [
  { key: "cost-opt", icon: "💰", label: "Cost Optimisation Advisor", desc: "Ranked recommendations with exact dollar savings per resource", tag: "Analysis" },
  { key: "sec-triage", icon: "🔴", label: "Security Triage", desc: "", tag: "" },
  { key: "drift", icon: "📊", label: "Drift Analysis", desc: "", tag: "" },
  { key: "forecast", icon: "📈", label: "Cost Forecasting", desc: "", tag: "" },
  { key: "arch-review", icon: "🌐", label: "Architecture Review", desc: "", tag: "" },
];

const reportTools = [
  { key: "digest", icon: "📋", label: "Weekly Digest", desc: "", tag: "" },
  { key: "compliance", icon: "✅", label: "Compliance Report", desc: "", tag: "" },
];

const policyTemplates = ["No public VMs", "Storage encryption", "Label compliance", "SA key rotation", "Region restriction"];

const queryExamples = [
  "Show me all VMs costing more than $50/month",
  "Which projects have the most open critical findings?",
  "List all resources added in the last 7 days",
  "Show storage buckets with no labels",
  "What are the top 10 most expensive resources?",
];

export default function AIHubPage() {
  const [activeTool, setActiveTool] = useState("query");
  const [policyText, setPolicyText] = useState("No VM should have a public IP unless a load balancer is in front of it...");

  return (
    <div className="flex gap-0 -m-8">
      <div className="w-72 bg-white border-r border-slate-200 p-4 min-h-screen">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🌐</span>
          <span className="text-base font-semibold text-slate-800">AI Hub</span>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">Beta</span>
        </div>
        <div className="mb-4">
          <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white mt-2">
            <option>All Organizations</option>
          </select>
        </div>

        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-2 px-1">INSTANT</div>
        {instantTools.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTool(t.key)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left mb-0.5 ${
              activeTool === t.key ? "bg-emerald-50 text-emerald-700 font-medium" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>{t.icon}</span>
            <span className="flex-1 truncate">{t.label}</span>
            {activeTool === t.key && <span className="text-slate-400">›</span>}
          </button>
        ))}

        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-2 mt-4 px-1">ANALYSIS</div>
        {analysisTools.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTool(t.key)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left mb-0.5 ${
              activeTool === t.key ? "bg-emerald-50 text-emerald-700 font-medium" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>{t.icon}</span>
            <span className="flex-1 truncate">{t.label}</span>
            {activeTool === t.key && <span className="text-slate-400">›</span>}
          </button>
        ))}

        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-2 mt-4 px-1">REPORTS</div>
        {reportTools.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTool(t.key)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left mb-0.5 ${
              activeTool === t.key ? "bg-emerald-50 text-emerald-700 font-medium" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>{t.icon}</span>
            <span className="flex-1 truncate">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 p-8">
        {activeTool === "query" && <QueryPanel />}
        {activeTool === "anomaly" && <AnomalyPanel />}
        {activeTool === "policy" && <PolicyPanel policyText={policyText} setPolicyText={setPolicyText} />}
        {activeTool === "incident" && <IncidentPanel />}
        {activeTool === "cost-opt" && <CostOptPanel />}
        {activeTool === "drift" && <DriftPanel />}
        {!["query", "anomaly", "policy", "incident", "cost-opt", "drift"].includes(activeTool) && (
          <GenericPanel tool={[...instantTools, ...analysisTools, ...reportTools].find(t => t.key === activeTool)} />
        )}
      </div>
    </div>
  );
}

function QueryPanel() {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Query Your Infrastructure</h2>
            <p className="text-sm text-slate-500">Ask anything in plain English — AI translates to live DB queries</p>
          </div>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Instant</span>
      </div>
      <div className="flex gap-2 mt-6 mb-4">
        <input
          type="text"
          placeholder="Ask anything about your infrastructure..."
          className="flex-1 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          ▶ Run
        </button>
      </div>
      <div className="text-sm text-slate-500 mb-2">Examples:</div>
      <div className="flex flex-wrap gap-2">
        {queryExamples.map((ex) => (
          <button key={ex} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-50 bg-white">
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

function AnomalyPanel() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚡</span>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Anomaly Narrative</h2>
            <p className="text-sm text-slate-500">AI explains what changed, who did it, and what to watch for</p>
          </div>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Instant</span>
      </div>
      <button className="bg-emerald-500 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-emerald-600 flex items-center gap-2 mb-6">
        ✦ Generate Anomaly Narrative
      </button>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-slate-700">AI Response</div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          📄 PDF <span className="ml-2">📋</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-semibold text-emerald-600">100</div>
          <div className="text-xs text-slate-500">Changes in period</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-semibold text-slate-800">0</div>
          <div className="text-xs text-slate-500">Active alerts</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-semibold text-slate-800">$0</div>
          <div className="text-xs text-slate-500">Net cost delta/mo</div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-2"># CloudLens AI Anomaly Narrative</h3>
        <h4 className="text-sm font-medium text-slate-600 mb-2">## Summary</h4>
        <p className="text-sm text-slate-600">100 resources were added to project 138101788 in the past 24 hours, all by an unidentified actor. The additions consist primarily of BigQuery audit tables and VPC subnetworks with zero cost impact, but the unknown actor and bulk creation pattern warrant immediate investigation.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-slate-800 mb-2">BigQuery audit tables created</h4>
        <p className="text-sm text-slate-600">: Four Cloud Audit Logs tables added (&apos;cloudaudit_googleapis_com_data_access&apos; and &apos;cloudaudit_googleapis_com_activity&apos; for 2026-07-27 and 2026-07-28) — suggests automated audit log ingestion or infrastructure-as-code deployment</p>
      </div>
    </div>
  );
}

function PolicyPanel({ policyText, setPolicyText }: { policyText: string; setPolicyText: (v: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xl">🏛️</span>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Policy Engine</h2>
            <p className="text-sm text-slate-500">Write policies in plain English — AI evaluates every resource</p>
          </div>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Instant</span>
      </div>
      <textarea
        value={policyText}
        onChange={(e) => setPolicyText(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
      />
      <div className="text-sm text-slate-500 mb-2">Template policies:</div>
      <div className="flex flex-wrap gap-2 mb-6">
        {policyTemplates.map((p) => (
          <button key={p} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-50 bg-white">{p}</button>
        ))}
      </div>
      <button className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
        🏛️ Evaluate Policy
      </button>
    </div>
  );
}

function IncidentPanel() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Incident Assistant</h2>
            <p className="text-sm text-slate-500">AI incident commander — root cause, actions, escalation guidance</p>
          </div>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Instant</span>
      </div>
      <textarea
        placeholder="Describe the incident or issue you are investigating..."
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
      />
      <button className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
        ✦ Analyse Incident
      </button>
    </div>
  );
}

function CostOptPanel() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xl">💰</span>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Cost Optimisation Advisor</h2>
            <p className="text-sm text-slate-500">Ranked recommendations with exact dollar savings per resource</p>
          </div>
        </div>
        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">Analysis</span>
      </div>
      <button className="bg-emerald-500 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-emerald-600 flex items-center gap-2">
        ✦ Analyse Cost Optimisations
      </button>
    </div>
  );
}

function DriftPanel() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xl">📊</span>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Drift Analysis</h2>
            <p className="text-sm text-slate-500">Detect infrastructure drift and unauthorized changes</p>
          </div>
        </div>
      </div>
      <button className="bg-emerald-500 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-emerald-600 flex items-center gap-2 mb-6">
        ✦ Run Drift Analysis
      </button>
      <div className="text-sm text-slate-500 mb-4">2026-07-21 → 2026-07-28 (7 days) · 300 total changes</div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-semibold text-blue-600">95</div>
          <div className="text-xs text-slate-500">Drift score</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-semibold text-red-500">131</div>
          <div className="text-xs text-slate-500">Suspicious</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-semibold text-yellow-500">98</div>
          <div className="text-xs text-slate-500">Violations</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-semibold text-emerald-600">71</div>
          <div className="text-xs text-slate-500">Expected</div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
        <h4 className="text-sm font-semibold text-slate-800 mb-2">AI Assessment</h4>
        <p className="text-sm text-slate-600 mb-3">Massive infrastructure drift detected on 2026-07-27 with 300 changes (4.2x expected baseline). All suspicious changes occurred simultaneously with unknown actor attribution, indicating either a bulk infrastructure provisioning event, automated deployment without proper logging, or potential unauthorized access.</p>
        <p className="text-sm text-red-600 italic">Synchronized bulk addition of 15 firewall rules and 10 subnetwork resources all detected at 2026-07-27T14:55:13.152535+00:00 with unknown actor. This suggests either: (1) Infrastructure-as-Code deployment without proper audit logging, (2) Automated remediation/compliance tool execution, or (3) Unauthorized bulk provisioning.</p>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">🔴 Immediate actions required</h4>
        <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside">
          <li>URGENT: Investigate actor attribution gap – determine why all 300 changes show &apos;unknown&apos; actor. Check IAM audit logs, service account activity, and API authentication records for 2026-07-27 14:55 UTC.</li>
          <li>CRITICAL: Audit all database-related firewall rules (allow-postgres, allow-pgbouncer-external-access) for internet exposure. Verify source IP restrictions immediately.</li>
          <li>CRITICAL: Review forseti-server-ssh-external-845b5627 rule – disable external SSH access to security infrastructure unless absolutely required and properly restricted.</li>
          <li>HIGH: Cross-reference all 15 firewall rules against approved change requests, IaC repositories, and automation tool logs.</li>
        </ol>
      </div>
    </div>
  );
}

function GenericPanel({ tool }: { tool?: { icon: string; label: string; desc: string; tag: string } }) {
  if (!tool) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xl">{tool.icon}</span>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{tool.label}</h2>
            {tool.desc && <p className="text-sm text-slate-500">{tool.desc}</p>}
          </div>
        </div>
        {tool.tag && (
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            tool.tag === "Instant" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
          }`}>{tool.tag}</span>
        )}
      </div>
      <button className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
        ✦ Run {tool.label}
      </button>
    </div>
  );
}
