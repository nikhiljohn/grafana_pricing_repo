"use client";

import { useEffect, useState } from "react";
import { useApiData } from "@/lib/api";

type FilterTab = "all" | "active" | "acknowledged" | "resolved";

interface Alert {
  id: string;
  title: string;
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  description: string;
  baseline: string;
  current: string;
  increase: string;
  date: string;
  type: string;
}

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "acknowledged", label: "Acknowledged" },
  { key: "resolved", label: "Resolved" },
];

export default function AlertsPage() {
  const { data: alertsData } = useApiData<Alert[]>("/alerts", []);
  // Local, mutable copy so Acknowledge/Resolve actually change status
  // instead of being decorative — resyncs when the org switcher changes.
  const [alerts, setAlerts] = useState<Alert[]>([]);
  useEffect(() => setAlerts(alertsData), [alertsData]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("active");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(
    new Set(["1"])
  );

  const setAlertStatus = (id: string, status: Alert["status"]) => {
    setAlerts((cur) => cur.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredAlerts =
    activeFilter === "all"
      ? alerts
      : alerts.filter(
          (a) => a.status.toLowerCase() === activeFilter
        );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Alerts</h1>
            <p className="mt-1 text-sm text-gray-500">
              {filteredAlerts.length} alert{filteredAlerts.length !== 1 && "s"}
            </p>
          </div>

          {/* Org Dropdown */}
          <div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
              <svg
                className="h-4 w-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Organization
              <svg
                className="h-4 w-4 text-gray-400"
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
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-4 flex gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Cards */}
      <div className="mx-auto max-w-5xl space-y-4 px-6 py-6">
        {filteredAlerts.map((alert) => {
          const isExpanded = expandedCards.has(alert.id);

          return (
            <div
              key={alert.id}
              className="overflow-hidden rounded-lg border border-gray-200 border-l-4 border-l-amber-400 bg-white shadow-sm"
            >
              {/* Card Header */}
              <div className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {/* Warning Icon */}
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-50">
                      <svg
                        className="h-5 w-5 text-amber-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-gray-900">
                          {alert.title}
                        </h3>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          {alert.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(alert.id)}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isExpanded
                          ? "border-gray-300 bg-gray-50 text-gray-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-gray-400">$</span>
                      Details
                      <svg
                        className={`h-3.5 w-3.5 text-gray-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
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
                    <button
                      onClick={() => setAlertStatus(alert.id, "ACKNOWLEDGED")}
                      disabled={alert.status !== "ACTIVE"}
                      className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg
                        className="h-3.5 w-3.5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Acknowledge
                    </button>
                    <button
                      onClick={() => setAlertStatus(alert.id, "RESOLVED")}
                      disabled={alert.status === "RESOLVED"}
                      className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg
                        className="h-3.5 w-3.5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Resolve
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="ml-11 mt-2 text-sm text-gray-600">
                  {alert.description}
                </p>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="ml-11 mt-4 flex gap-6 rounded-md bg-gray-50 px-4 py-3">
                    <div>
                      <p className="text-xs text-gray-500">Baseline</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-900">
                        {alert.baseline}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Current</p>
                      <p className="mt-0.5 text-sm font-semibold text-green-600">
                        {alert.current}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Increase</p>
                      <p className="mt-0.5 text-sm font-semibold text-red-600">
                        {alert.increase}
                      </p>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="ml-11 mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                  <span>{alert.date}</span>
                  <span>&middot;</span>
                  <span>{alert.type}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
