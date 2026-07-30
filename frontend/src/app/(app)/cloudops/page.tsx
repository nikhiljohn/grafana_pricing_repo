"use client";

import { useState } from "react";

export default function CloudOpsIntelligencePage() {
  const [topTab, setTopTab] = useState<"kubernetes" | "databases">("kubernetes");
  const [subTab, setSubTab] = useState<"dashboard" | "analysis">("dashboard");
  const [analysisCategory, setAnalysisCategory] = useState<
    "security" | "cost" | "performance" | "reliability"
  >("security");
  const [expandedInstance, setExpandedInstance] = useState<string | null>("pgsql");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600">
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
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">CloudOps Intelligence</h1>
              <p className="text-sm text-gray-400">
                Kubernetes and database visibility — security, cost, performance, reliability
              </p>
            </div>
          </div>
          <div>
            <select className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-sky-500 focus:outline-none">
              <option>searce-sandbox</option>
              <option>production-org</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-0">
          <button
            onClick={() => {
              setTopTab("kubernetes");
              setSubTab("dashboard");
            }}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              topTab === "kubernetes"
                ? "border-b-2 border-sky-500 text-sky-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Kubernetes
          </button>
          <button
            onClick={() => {
              setTopTab("databases");
              setSubTab("dashboard");
            }}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              topTab === "databases"
                ? "border-b-2 border-sky-500 text-sky-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Databases
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-0">
          <button
            onClick={() => setSubTab("dashboard")}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              subTab === "dashboard"
                ? "border-b-2 border-sky-500 text-sky-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setSubTab("analysis")}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              subTab === "analysis"
                ? "border-b-2 border-sky-500 text-sky-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Analysis
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* ===== KUBERNETES > DASHBOARD ===== */}
        {topTab === "kubernetes" && subTab === "dashboard" && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
              <svg
                className="h-8 w-8 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-gray-200">
              No Kubernetes clusters found
            </h2>
            <p className="text-sm text-gray-500">
              Run an asset scan to discover EKS and GKE clusters.
            </p>
          </div>
        )}

        {/* ===== KUBERNETES > ANALYSIS ===== */}
        {topTab === "kubernetes" && subTab === "analysis" && (
          <div>
            {/* Analysis Category Pills */}
            <div className="mb-8 flex gap-2">
              <button
                onClick={() => setAnalysisCategory("security")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  analysisCategory === "security"
                    ? "bg-red-600/20 text-red-400 ring-1 ring-red-500/40"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Security
              </button>
              <button
                onClick={() => setAnalysisCategory("cost")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  analysisCategory === "cost"
                    ? "bg-amber-600/20 text-amber-400 ring-1 ring-amber-500/40"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                <span className="text-sm">$</span>
                Cost
              </button>
              <button
                onClick={() => setAnalysisCategory("performance")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  analysisCategory === "performance"
                    ? "bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/40"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Performance
              </button>
              <button
                onClick={() => setAnalysisCategory("reliability")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  analysisCategory === "reliability"
                    ? "bg-green-600/20 text-green-400 ring-1 ring-green-500/40"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Reliability
              </button>
            </div>

            {/* Empty State */}
            <div className="flex flex-col items-center justify-center py-24">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
                <svg
                  className="h-8 w-8 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-200">
                {analysisCategory.charAt(0).toUpperCase() + analysisCategory.slice(1)} Analysis
              </h2>
              <p className="mb-6 text-center text-sm text-gray-500">
                AI will analyse your kubernetes and generate prioritised findings.
              </p>
              <button className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700">
                Run {analysisCategory.charAt(0).toUpperCase() + analysisCategory.slice(1)} Analysis
              </button>
            </div>
          </div>
        )}

        {/* ===== DATABASES > DASHBOARD ===== */}
        {topTab === "databases" && subTab === "dashboard" && (
          <div>
            {/* Stat Tiles */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <p className="text-sm text-gray-400">Instances</p>
                <p className="mt-1 text-2xl font-bold text-white">1</p>
              </div>
              <div className="rounded-lg border border-green-900/50 bg-green-950/30 p-4">
                <p className="text-sm text-gray-400">Monthly Cost</p>
                <p className="mt-1 text-2xl font-bold text-green-400">$15</p>
              </div>
              <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4">
                <p className="text-sm text-gray-400">Open Findings</p>
                <p className="mt-1 text-2xl font-bold text-red-400">2</p>
              </div>
              <div className="rounded-lg border border-blue-900/50 bg-blue-950/30 p-4">
                <p className="text-sm text-gray-400">Total Storage</p>
                <p className="mt-1 text-2xl font-bold text-blue-400">10 GB</p>
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <p className="text-sm text-gray-400">Multi-AZ</p>
                <p className="mt-1 text-2xl font-bold text-white">0</p>
                <p className="mt-0.5 text-xs text-gray-500">HA configured</p>
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <p className="text-sm text-gray-400">Public Access</p>
                <p className="mt-1 text-2xl font-bold text-white">0</p>
                <p className="mt-0.5 text-xs text-gray-500">all private</p>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-300">Encrypted at rest</span>
                  <span className="text-sm font-medium text-green-400">1/1</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-700">
                  <div className="h-2 w-full rounded-full bg-green-500" />
                </div>
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-300">Multi-AZ / Regional</span>
                  <span className="text-sm font-medium text-gray-400">0/1</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-700">
                  <div className="h-2 w-0 rounded-full bg-amber-500" />
                </div>
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-300">PITR enabled</span>
                  <span className="text-sm font-medium text-gray-400">0/1</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-700">
                  <div className="h-2 w-0 rounded-full bg-amber-500" />
                </div>
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-300">Pending maintenance</span>
                  <span className="text-sm font-medium text-gray-400">0/1</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-700">
                  <div className="h-2 w-0 rounded-full bg-amber-500" />
                </div>
              </div>
            </div>

            {/* Two Column: Open Findings + Instance Overview */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Open Findings by Severity */}
              <div className="rounded-lg border border-gray-800 bg-gray-900">
                <div className="border-b border-gray-800 px-5 py-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Open Findings by Severity
                  </h3>
                </div>
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
                    <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">No open findings</p>
                </div>
              </div>

              {/* Instance Overview */}
              <div className="rounded-lg border border-gray-800 bg-gray-900">
                <div className="border-b border-gray-800 px-5 py-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Instance Overview
                  </h3>
                </div>
                <div className="divide-y divide-gray-800">
                  {/* Instance Row */}
                  <button
                    onClick={() =>
                      setExpandedInstance(expandedInstance === "pgsql" ? null : "pgsql")
                    }
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          expandedInstance === "pgsql" ? "rotate-90" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      <div>
                        <p className="font-medium text-white">pgsql</p>
                        <p className="text-xs text-gray-500">
                          GCP &middot; POSTGRES_18 &middot; db-f1-micro &middot; ZONAL
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-green-400">$15/mo</span>
                      <span className="rounded-full bg-red-600/20 px-2.5 py-0.5 text-xs font-medium text-red-400">
                        2 findings
                      </span>
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {expandedInstance === "pgsql" && (
                    <div className="bg-gray-800/30 px-5 py-4">
                      <div className="ml-7 grid grid-cols-3 gap-4">
                        <div className="rounded-md border border-gray-700 bg-gray-800 p-3">
                          <p className="text-xs text-gray-400">Security</p>
                          <p className="mt-1 text-lg font-bold text-white">
                            2<span className="text-sm font-normal text-gray-500">/8</span>
                          </p>
                        </div>
                        <div className="rounded-md border border-gray-700 bg-gray-800 p-3">
                          <p className="text-xs text-gray-400">HA / DR</p>
                          <p className="mt-1 text-lg font-bold text-white">
                            0<span className="text-sm font-normal text-gray-500">/4</span>
                          </p>
                        </div>
                        <div className="rounded-md border border-gray-700 bg-gray-800 p-3">
                          <p className="text-xs text-gray-400">Findings</p>
                          <p className="mt-1 text-lg font-bold text-red-400">2</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== DATABASES > ANALYSIS ===== */}
        {topTab === "databases" && subTab === "analysis" && (
          <div>
            {/* Analysis Category Pills */}
            <div className="mb-8 flex gap-2">
              <button
                onClick={() => setAnalysisCategory("security")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  analysisCategory === "security"
                    ? "bg-red-600/20 text-red-400 ring-1 ring-red-500/40"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Security
              </button>
              <button
                onClick={() => setAnalysisCategory("cost")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  analysisCategory === "cost"
                    ? "bg-amber-600/20 text-amber-400 ring-1 ring-amber-500/40"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                <span className="text-sm">$</span>
                Cost
              </button>
              <button
                onClick={() => setAnalysisCategory("performance")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  analysisCategory === "performance"
                    ? "bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/40"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Performance
              </button>
              <button
                onClick={() => setAnalysisCategory("reliability")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  analysisCategory === "reliability"
                    ? "bg-green-600/20 text-green-400 ring-1 ring-green-500/40"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Reliability
              </button>
            </div>

            {/* Empty State */}
            <div className="flex flex-col items-center justify-center py-24">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
                <svg
                  className="h-8 w-8 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-200">
                {analysisCategory.charAt(0).toUpperCase() + analysisCategory.slice(1)} Analysis
              </h2>
              <p className="mb-6 text-center text-sm text-gray-500">
                AI will analyse your databases and generate prioritised findings.
              </p>
              <button className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700">
                Run {analysisCategory.charAt(0).toUpperCase() + analysisCategory.slice(1)} Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
