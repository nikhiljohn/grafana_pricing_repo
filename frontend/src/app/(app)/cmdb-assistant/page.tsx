"use client";

import { useState } from "react";

const quickQuestions = [
  { icon: "🔄", label: "Last 24h changes" },
  { icon: "💰", label: "Cost impact of changes" },
  { icon: "🔒", label: "Critical security issues" },
  { icon: "📊", label: "Asset inventory summary" },
  { icon: "📈", label: "Cost trend analysis" },
  { icon: "⚠️", label: "Active alerts" },
  { icon: "🌐", label: "Regional breakdown" },
  { icon: "🏗️", label: "Largest resources by cost" },
];

export default function CmdbAssistantPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">✦</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-800">CMDB Assistant</h1>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Powered by Claude</span>
            </div>
            <p className="text-sm text-slate-500">Ask anything about your cloud infrastructure</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option>All Organizations</option>
          </select>
          <button className="text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50">
            Clear
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <MetricBadge value="5,154" label="Assets" color="bg-blue-600" />
        <MetricBadge value="$250" label="Monthly Cost" color="bg-emerald-600" />
        <MetricBadge value="3" label="Active Alerts" color="bg-red-500" />
        <MetricBadge value="8452" label="Changes (24h)" color="bg-slate-600" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="text-sm text-slate-500 mb-1">findings.</div>
        <div className="mt-4">
          <p className="text-sm text-slate-700 mb-3">Ask me anything about your infrastructure. Some things I can help with:</p>
          <ul className="text-sm text-slate-600 space-y-1.5 ml-4">
            <li className="flex items-center gap-2"><span className="text-blue-500">•</span> What changed in the last 24 hours?</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">•</span> What&apos;s driving our cloud costs?</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Which security findings are most critical?</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">•</span> How does our inventory break down by project?</li>
          </ul>
          <div className="text-xs text-slate-400 mt-3">12:40:49 PM</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium text-slate-600 mb-3">Quick questions:</div>
        <div className="grid grid-cols-4 gap-2">
          {quickQuestions.map((q) => (
            <button
              key={q.label}
              onClick={() => setQuery(q.label)}
              className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2.5 hover:bg-slate-50 text-left"
            >
              <span>{q.icon}</span>
              <span>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about your cloud assets, changes, costs, or security posture..."
          className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </div>
      <div className="text-xs text-slate-400 text-center mt-2">
        Data refreshes with every scan · Enter to send · Shift+Enter for new line
      </div>
    </div>
  );
}

function MetricBadge({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className={`${color} text-white text-sm px-3 py-1 rounded-lg flex items-center gap-2`}>
      <span className="font-semibold">{value}</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
}
