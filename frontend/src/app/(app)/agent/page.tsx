"use client";

import { useState } from "react";

const tabs = ["Investigate", "Remediate", "CloudTrail & Status"] as const;
type Tab = (typeof tabs)[number];

const providers = [
  { label: "All Providers", dot: null },
  { label: "AWS", dot: "bg-orange-400" },
  { label: "GCP", dot: "bg-blue-400" },
] as const;

export default function AgentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Investigate");
  const [activeProvider, setActiveProvider] = useState("All Providers");
  const [resourceSearch, setResourceSearch] = useState("");
  const [problem, setProblem] = useState("");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
            <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a3.375 3.375 0 01-2.387.988H9.857a3.375 3.375 0 01-2.387-.988L5 14.5m14 0V17a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 17v-2.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Agent</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Cloud Detective &middot; AI remediation &middot; CloudTrail ingest
            </p>
          </div>
        </div>

        <select className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none">
          <option>Organization</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition ${
              activeTab === tab
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cloud Detective Section */}
      {activeTab === "Investigate" && (
        <div className="space-y-8">
          {/* Section Header */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
              <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a3.375 3.375 0 01-2.387.988H9.857a3.375 3.375 0 01-2.387-.988L5 14.5m14 0V17a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 17v-2.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Cloud Detective</h2>
              <p className="text-sm text-gray-400">
                Autonomous multi-step investigation with upstream/downstream service correlation
              </p>
            </div>
          </div>

          {/* Step 1 */}
          <div className="rounded-xl bg-gray-800/50 p-6 ring-1 ring-gray-700/60 space-y-5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-[11px] font-bold text-gray-300">
                1
              </span>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Select Asset <span className="font-normal normal-case text-gray-600">(optional)</span>
              </h3>
            </div>

            {/* Cloud Provider */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cloud Provider</label>
              <div className="flex items-center rounded-lg border border-gray-700 bg-gray-900 p-0.5 w-fit">
                {providers.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setActiveProvider(p.label)}
                    className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                      activeProvider === p.label
                        ? "bg-gray-700 text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {p.dot && <span className={`h-2 w-2 rounded-full ${p.dot}`} />}
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resource Search */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, IP, instance ID..."
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-gray-300 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl bg-gray-800/50 p-6 ring-1 ring-gray-700/60 space-y-5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-[11px] font-bold text-gray-300">
                2
              </span>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Describe the Problem
              </h3>
            </div>

            <textarea
              rows={5}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder={`"Why did our RDS costs jump 385% yesterday?"\n"High latency on the API gateway since 2am — trace root cause"\n"Find all unencrypted S3 buckets with public access"\n"Why is the prod database running hot since last deploy?"`}
              className="w-full resize-none rounded-lg border border-gray-700 bg-gray-900 p-4 text-sm text-gray-300 placeholder-gray-600 focus:border-blue-500 focus:outline-none leading-relaxed"
            />
            <p className="text-xs text-gray-500">
              Leave blank to run a General Health Check on the selected asset.
            </p>
          </div>

          {/* Investigate Button */}
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/20">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            Investigate
          </button>
        </div>
      )}
    </div>
  );
}
