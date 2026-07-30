"use client";

import { useState } from "react";

const severityFilters = ["All", "Critical", "High", "Medium", "Low"] as const;
type Severity = (typeof severityFilters)[number];

interface Finding {
  id: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  resource: string;
  resourceId: string;
  accountId: string;
  checkId: string;
  status: "OPEN" | "RESOLVED" | "SUPPRESSED";
}

const findings: Finding[] = [
  {
    id: 1,
    severity: "CRITICAL",
    title: "Security group 'Testing-SSH-Demo' allows SSH (port 22) from internet",
    resource: "Testing-SSH-Demo",
    resourceId: "sg-040e717fe06a0f02b",
    accountId: "010863548913",
    checkId: "CIS 5.2",
    status: "OPEN",
  },
  {
    id: 2,
    severity: "CRITICAL",
    title: "Security group 'launch-wizard-110' allows SSH (port 22) from internet",
    resource: "launch-wizard-110",
    resourceId: "sg-07a80c419f8384ba3",
    accountId: "010863548913",
    checkId: "CIS 5.2",
    status: "OPEN",
  },
  {
    id: 3,
    severity: "CRITICAL",
    title: "Security group 'launch-wizard-109' allows SSH (port 22) from internet",
    resource: "launch-wizard-109",
    resourceId: "sg-0463a4ae4c01e70e1",
    accountId: "010863548913",
    checkId: "CIS 5.2",
    status: "OPEN",
  },
  {
    id: 4,
    severity: "CRITICAL",
    title: "Security group 'launch-wizard-108' allows SSH (port 22) from internet",
    resource: "launch-wizard-108",
    resourceId: "sg-0f0de029a15155cc2",
    accountId: "010863548913",
    checkId: "CIS 5.2",
    status: "OPEN",
  },
  {
    id: 5,
    severity: "CRITICAL",
    title: "Security group 'launch-wizard-107' allows SSH (port 22) from internet",
    resource: "launch-wizard-107",
    resourceId: "sg-03dec5bb2623e4c2e",
    accountId: "010863548913",
    checkId: "CIS 5.2",
    status: "OPEN",
  },
  {
    id: 6,
    severity: "CRITICAL",
    title: "Security group 'launch-wizard-106' allows SSH (port 22) from internet",
    resource: "launch-wizard-106",
    resourceId: "sg-0cbb03705a028cb12",
    accountId: "010863548913",
    checkId: "CIS 5.2",
    status: "OPEN",
  },
  {
    id: 7,
    severity: "CRITICAL",
    title: "S3 bucket 'testhydpdf' does not have Block Public Access fully enabled",
    resource: "testhydpdf",
    resourceId: "",
    accountId: "010863548913",
    checkId: "CIS 2.1.2",
    status: "OPEN",
  },
];

const severityBorderColor: Record<string, string> = {
  CRITICAL: "border-l-red-500",
  HIGH: "border-l-orange-500",
  MEDIUM: "border-l-yellow-500",
  LOW: "border-l-blue-400",
};

const severityBadgeBg: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-blue-100 text-blue-700",
};

export default function SecurityFindingsPage() {
  const [activeFilter, setActiveFilter] = useState<Severity>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const filteredFindings = findings.filter((f) => {
    const matchesSeverity =
      activeFilter === "All" || f.severity === activeFilter.toUpperCase();
    const matchesSearch =
      searchQuery === "" ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.checkId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21h18M3 21V8l9-5 9 5v13M9 21V12h6v9"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 3.172a4 4 0 015.656 5.656L12 17.314l-8.485-8.485a4 4 0 015.657-5.657L12 6l2.828-2.828z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Security Findings
              </h1>
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-red-600">342</span> open
                findings
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

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search findings, resources, check IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-2 mb-6">
          {severityFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Findings List */}
        <div className="space-y-3">
          {filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className={`bg-white rounded-lg border border-gray-200 border-l-4 ${
                severityBorderColor[finding.severity]
              } shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                        severityBadgeBg[finding.severity]
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {finding.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">
                      {finding.resource}
                    </span>
                    {finding.resourceId && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="font-mono text-gray-500">
                          {finding.resourceId}
                        </span>
                      </>
                    )}
                    <span className="text-gray-300">·</span>
                    <span className="font-mono">{finding.accountId}</span>
                    <span className="text-gray-300">·</span>
                    <span className="font-semibold text-gray-600">
                      {finding.checkId}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">
                    {finding.status}
                  </span>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenDropdownId(
                          openDropdownId === finding.id ? null : finding.id
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      Chat
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {openDropdownId === finding.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-10">
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg">
                          AI Remediation
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Blast Radius
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg">
                          Suppress Finding
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
