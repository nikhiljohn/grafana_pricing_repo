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
  Rejected: "bg-gray-400",
};

const statusTextColor: Record<string, string> = {
  Failed: "text-red-600",
  "Generating plan": "text-green-600",
  Completed: "text-green-600",
  "Needs approval": "text-yellow-600",
  Provisioning: "text-blue-600",
  Rejected: "text-slate-500",
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-5">
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
              <h1 className="text-xl font-semibold text-slate-800">Cloud Orchestration</h1>
              <p className="text-sm text-slate-500">
                Self-service provisioning from Freshservice tickets — Terraform + Claude AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-sky-500 focus:outline-none">
              <option>searce-sandbox</option>
              <option>production-org</option>
            </select>
            <button className="rounded-md border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <button className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800">
              Configure
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Row */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">36</p>
          </div>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-slate-500">Pending approval</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">4</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-slate-500">Provisioning</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">0</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-slate-500">Completed</p>
            <p className="mt-1 text-2xl font-bold text-green-600">8</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-slate-500">Failed</p>
            <p className="mt-1 text-2xl font-bold text-red-600">7</p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mb-6 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm font-medium text-amber-800">
              4 requests waiting for approval
            </span>
          </div>
          <button className="text-sm font-medium text-amber-600 transition-colors hover:text-amber-700">
            Review now &gt;
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? "bg-sky-600 text-white"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={`ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                    activeFilter === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ticket
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Request
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Resource
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Risk
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRows.map((row) => (
                <tr
                  key={row.ticket}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="text-sm font-medium text-sky-600">{row.ticket}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="text-sm text-slate-800">{row.request}</p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="inline-flex items-center rounded-md bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                      {row.resource}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="inline-flex items-center rounded-md bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                      {row.provider}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-500">
                    {row.cost ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-500">
                    {row.risk ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          statusDotColor[row.status] ?? "bg-gray-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          statusTextColor[row.status] ?? "text-slate-500"
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-500">
                    {row.date}
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
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
