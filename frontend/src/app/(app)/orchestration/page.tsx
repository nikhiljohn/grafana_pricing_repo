"use client";

import { useState } from "react";

type FilterTab =
  | "all"
  | "needs_approval"
  | "generating_plan"
  | "provisioning"
  | "completed"
  | "failed"
  | "rejected";

interface RequestRow {
  ticket: string;
  request: string;
  email: string;
  resource: string;
  provider: "AWS" | "GCP" | "Azure";
  cost: string | null;
  risk: string | null;
  status: "Failed" | "Generating plan" | "Completed" | "Needs approval" | "Provisioning" | "Rejected";
  date: string;
}

const rows: RequestRow[] = [
  {
    ticket: "CL-36",
    request: "[AI Remediation] Restrict S...",
    email: "harish.gurram@searce.com",
    resource: "Aws Vpc",
    provider: "AWS",
    cost: null,
    risk: null,
    status: "Failed",
    date: "23 Jul 2026",
  },
  {
    ticket: "CL-35",
    request: "[AI Remediation] Enable S3 ...",
    email: "harish.gurram@searce.com",
    resource: "Aws S3",
    provider: "AWS",
    cost: null,
    risk: null,
    status: "Failed",
    date: "29 Jun 2026",
  },
  {
    ticket: "CL-34",
    request: "[AI Remediation] Remove S...",
    email: "admin@csre.com",
    resource: "Aws Vpc",
    provider: "AWS",
    cost: null,
    risk: null,
    status: "Generating plan",
    date: "03 Jun 2026",
  },
  {
    ticket: "CL-33",
    request: "[AI Remediation] Remove S...",
    email: "admin@csre.com",
    resource: "Aws Vpc",
    provider: "AWS",
    cost: null,
    risk: null,
    status: "Failed",
    date: "19 May 2026",
  },
  {
    ticket: "CL-32",
    request: "[AI Remediation] Remove S...",
    email: "user@csre.com",
    resource: "Aws Vpc",
    provider: "AWS",
    cost: null,
    risk: null,
    status: "Failed",
    date: "14 May 2026",
  },
];

const statusDotColor: Record<string, string> = {
  Failed: "bg-red-500",
  "Generating plan": "bg-green-500",
  Completed: "bg-green-500",
  "Needs approval": "bg-yellow-500",
  Provisioning: "bg-blue-500",
  Rejected: "bg-gray-500",
};

const statusTextColor: Record<string, string> = {
  Failed: "text-red-400",
  "Generating plan": "text-green-400",
  Completed: "text-green-400",
  "Needs approval": "text-yellow-400",
  Provisioning: "text-blue-400",
  Rejected: "text-gray-400",
};

export default function CloudOrchestrationPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const filterTabs: { key: FilterTab; label: string; badge?: number }[] = [
    { key: "all", label: "All" },
    { key: "needs_approval", label: "Needs approval", badge: 4 },
    { key: "generating_plan", label: "Generating plan" },
    { key: "provisioning", label: "Provisioning" },
    { key: "completed", label: "Completed" },
    { key: "failed", label: "Failed" },
    { key: "rejected", label: "Rejected" },
  ];

  const filteredRows =
    activeFilter === "all"
      ? rows
      : rows.filter((r) => {
          const map: Record<FilterTab, string> = {
            all: "",
            needs_approval: "Needs approval",
            generating_plan: "Generating plan",
            provisioning: "Provisioning",
            completed: "Completed",
            failed: "Failed",
            rejected: "Rejected",
          };
          return r.status === map[activeFilter];
        });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Cloud Orchestration</h1>
              <p className="text-sm text-gray-400">
                Self-service provisioning from Freshservice tickets — Terraform + Claude AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-sky-500 focus:outline-none">
              <option>searce-sandbox</option>
              <option>production-org</option>
            </select>
            <button className="rounded-md border border-gray-700 bg-gray-800 p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <button className="rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white">
              Configure
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Row */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <p className="text-sm text-gray-400">Total</p>
            <p className="mt-1 text-2xl font-bold text-white">36</p>
          </div>
          <div className="rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-4">
            <p className="text-sm text-gray-400">Pending approval</p>
            <p className="mt-1 text-2xl font-bold text-yellow-400">4</p>
          </div>
          <div className="rounded-lg border border-blue-900/50 bg-blue-950/20 p-4">
            <p className="text-sm text-gray-400">Provisioning</p>
            <p className="mt-1 text-2xl font-bold text-blue-400">0</p>
          </div>
          <div className="rounded-lg border border-green-900/50 bg-green-950/20 p-4">
            <p className="text-sm text-gray-400">Completed</p>
            <p className="mt-1 text-2xl font-bold text-green-400">8</p>
          </div>
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
            <p className="text-sm text-gray-400">Failed</p>
            <p className="mt-1 text-2xl font-bold text-red-400">7</p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mb-6 flex items-center justify-between rounded-lg border border-yellow-800/50 bg-yellow-950/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm font-medium text-yellow-300">
              4 requests waiting for approval
            </span>
          </div>
          <button className="text-sm font-medium text-yellow-400 transition-colors hover:text-yellow-300">
            Review now &gt;
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg border border-gray-800 bg-gray-900 p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? "bg-sky-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={`ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                    activeFilter === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Ticket
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Request
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Resource
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Risk
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredRows.map((row) => (
                <tr
                  key={row.ticket}
                  className="transition-colors hover:bg-gray-900/50"
                >
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="text-sm font-medium text-sky-400">{row.ticket}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="text-sm text-gray-200">{row.request}</p>
                      <p className="text-xs text-gray-500">{row.email}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="inline-flex items-center rounded-md bg-teal-600/20 px-2.5 py-1 text-xs font-medium text-teal-400">
                      {row.resource}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="inline-flex items-center rounded-md bg-orange-600/20 px-2.5 py-1 text-xs font-medium text-orange-400">
                      {row.provider}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500">
                    {row.cost ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500">
                    {row.risk ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          statusDotColor[row.status] ?? "bg-gray-500"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          statusTextColor[row.status] ?? "text-gray-400"
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-400">
                    {row.date}
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                    No requests match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
