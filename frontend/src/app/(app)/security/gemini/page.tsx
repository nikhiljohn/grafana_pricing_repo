"use client";

import { useState } from "react";

const tabs = ["Posture Dashboard", "AI Analysis"] as const;

interface DomainBar {
  name: string;
  passing: number;
  notAssessed: number;
  total: number;
}

const domainData: DomainBar[] = [
  { name: "Data Governance", passing: 5, notAssessed: 2, total: 7 },
  { name: "Identity & Access", passing: 6, notAssessed: 1, total: 7 },
  { name: "Model Integrity", passing: 5, notAssessed: 2, total: 7 },
  { name: "Monitoring", passing: 4, notAssessed: 1, total: 5 },
  { name: "Prompt & Output Safety", passing: 6, notAssessed: 2, total: 8 },
  { name: "AI Governance", passing: 7, notAssessed: 2, total: 9 },
];

interface SeverityBar {
  label: string;
  count: number;
  color: string;
  bgColor: string;
}

const severityData: SeverityBar[] = [
  { label: "Critical", count: 3, color: "bg-red-500", bgColor: "bg-red-100" },
  {
    label: "High",
    count: 18,
    color: "bg-orange-500",
    bgColor: "bg-orange-100",
  },
  {
    label: "Medium",
    count: 22,
    color: "bg-yellow-500",
    bgColor: "bg-yellow-100",
  },
  { label: "Low", count: 0, color: "bg-blue-400", bgColor: "bg-blue-100" },
];

const maxSeverity = Math.max(...severityData.map((s) => s.count), 1);

export default function GeminiSecurityPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>(
    "Posture Dashboard"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100">
              <svg
                className="w-5 h-5 text-red-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gemini Security
              </h1>
              <p className="text-sm text-gray-500">
                <span className="font-medium">35 checks</span> ·{" "}
                <span>Vertex AI</span> · <span>Google Workspace</span> ·{" "}
                <span>ISO 42001</span> · <span>CIS AI Safety</span> ·{" "}
                <span>NIST CSF 2.0</span>
              </p>
            </div>
          </div>
          <div>
            <select className="block w-56 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <option>All Organizations</option>
              <option>Production</option>
              <option>Staging</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Security Score */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-6">
              {/* Donut Chart */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-24 h-24" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="10"
                    strokeDasharray="251.3"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">100</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Security Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  100<span className="text-lg text-gray-400">/100</span>
                </p>
              </div>
            </div>
          </div>

          {/* Total Checks */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Checks</p>
                <p className="text-3xl font-bold text-gray-900">43</p>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Passing
                  </p>
                  <p className="text-xl font-bold text-green-600">33</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Failing
                  </p>
                  <p className="text-xl font-bold text-gray-400">0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Not Assessed */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Not Assessed</p>
                <p className="text-3xl font-bold text-gray-900">10</p>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Critical Fails
                  </p>
                  <p className="text-xl font-bold text-red-600">0</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Action Required
                  </p>
                  <p className="text-xl font-bold text-gray-400">0</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Coverage
          </h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                Vertex AI assets
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
              <span className="text-sm text-gray-500">
                Workspace Admin SDK
              </span>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Refresh
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">9 of 35 checks</span> require
              Workspace Admin SDK credentials &mdash; Checks covering DLP
              policies, model improvement data sharing...
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-4">
          {/* Checks by Domain */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-5">
              Checks by Domain
            </h3>
            <div className="space-y-4">
              {domainData.map((domain) => (
                <div key={domain.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-700">
                      {domain.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {domain.passing}/{domain.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden flex">
                    <div
                      className="bg-green-500 h-full rounded-l-full transition-all"
                      style={{
                        width: `${(domain.passing / domain.total) * 100}%`,
                      }}
                    ></div>
                    <div
                      className="bg-green-200 h-full transition-all"
                      style={{
                        width: `${(domain.notAssessed / domain.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-5 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-500"></span>
                Passing
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-200"></span>
                Not Assessed
              </div>
            </div>
          </div>

          {/* Severity Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-5">
              Severity Distribution of All Checks
            </h3>
            <div className="flex items-end gap-6 h-48 px-4">
              {severityData.map((severity) => (
                <div
                  key={severity.label}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <span className="text-sm font-bold text-gray-700">
                    {severity.count}
                  </span>
                  <div className="w-full flex flex-col justify-end h-36">
                    <div
                      className={`w-full ${severity.color} rounded-t-md transition-all`}
                      style={{
                        height:
                          severity.count > 0
                            ? `${(severity.count / maxSeverity) * 100}%`
                            : "4px",
                      }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {severity.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
