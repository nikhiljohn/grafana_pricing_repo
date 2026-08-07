"use client";

import { useState } from "react";
import { useApiData } from "@/lib/api";

type ServiceType =
  | "VM Instances"
  | "EC2 Instances"
  | "Cloud SQL Instances"
  | "Cloud Run Services";

type ResourceState = "RUNNING" | "SUSPENDED" | "UNKNOWN";

interface Resource {
  name: string;
  subtitle: string;
  service: ServiceType;
  project: string;
  region: string;
  state: ResourceState;
  costPerMonth: string;
  lastSeen: string;
}

const SERVICE_BADGE_COLORS: Record<ServiceType, { bg: string; text: string }> = {
  "VM Instances": { bg: "bg-emerald-100", text: "text-emerald-700" },
  "EC2 Instances": { bg: "bg-orange-100", text: "text-orange-700" },
  "Cloud SQL Instances": { bg: "bg-blue-100", text: "text-blue-700" },
  "Cloud Run Services": { bg: "bg-teal-100", text: "text-teal-700" },
};

const STATE_BADGE_COLORS: Record<ResourceState, { bg: string; text: string; dot: string }> = {
  RUNNING: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  SUSPENDED: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  UNKNOWN: { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
};

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ServerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="14" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

export default function AssetsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");

  const { data: resources } = useApiData<Resource[]>("/assets", []);

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      searchQuery === "" ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesService =
      serviceFilter === "all" || r.service === serviceFilter;

    const matchesRegion =
      regionFilter === "all" || r.region === regionFilter;

    return matchesSearch && matchesService && matchesRegion;
  });

  const uniqueServices = Array.from(new Set(resources.map((r) => r.service)));
  const uniqueRegions = Array.from(new Set(resources.map((r) => r.region)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 bg-indigo-50 rounded-lg">
                <ServerIcon className="text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Assets / CMDB
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  <span className="font-medium text-gray-700">5,154</span>{" "}
                  resources discovered
                </p>
              </div>
            </div>
            <div className="relative">
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                All Organizations
                <ChevronDownIcon className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-[1440px] mx-auto px-6 pt-5 pb-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 shadow-sm"
            />
          </div>

          {/* Service type filter */}
          <div className="relative">
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer shadow-sm"
            >
              <option value="all">All service types</option>
              {uniqueServices.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Region filter */}
          <div className="relative">
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer shadow-sm"
            >
              <option value="all">All regions</option>
              {uniqueRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1440px] mx-auto px-6 pb-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left px-5 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                    Resource Name
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                    GCP Service
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                    Region / Zone
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                    Cost/Mo
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                    Last Seen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredResources.map((resource, idx) => {
                  const serviceBadge = SERVICE_BADGE_COLORS[resource.service];
                  const stateBadge = STATE_BADGE_COLORS[resource.state];

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Resource Name */}
                      <td className="px-5 py-3.5">
                        <div>
                          <a
                            href="#"
                            className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition-colors"
                          >
                            {resource.name}
                          </a>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {resource.subtitle}
                          </p>
                        </div>
                      </td>

                      {/* Service */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${serviceBadge.bg} ${serviceBadge.text}`}
                        >
                          {resource.service}
                        </span>
                      </td>

                      {/* Project */}
                      <td className="px-5 py-3.5">
                        <span className="text-gray-700 font-mono text-xs">
                          {resource.project}
                        </span>
                      </td>

                      {/* Region */}
                      <td className="px-5 py-3.5">
                        <span className="text-gray-600 text-xs">
                          {resource.region}
                        </span>
                      </td>

                      {/* State */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${stateBadge.bg} ${stateBadge.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${stateBadge.dot}`}
                          />
                          {resource.state}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-gray-900 font-medium">
                          {resource.costPerMonth}
                        </span>
                      </td>

                      {/* Last Seen */}
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-gray-500 text-xs">
                          {resource.lastSeen}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="border-t border-gray-200 bg-gray-50/50 px-5 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">
                {filteredResources.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700">5,154</span>{" "}
              resources
            </p>
            <div className="flex items-center gap-1.5">
              <button
                disabled
                className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-white border border-gray-200 rounded-md cursor-not-allowed"
              >
                Previous
              </button>
              <button className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 border border-indigo-600 rounded-md">
                1
              </button>
              <button
                disabled
                title="Coming in V2 — paginated asset browsing"
                className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-white border border-gray-200 rounded-md cursor-not-allowed"
              >
                2
              </button>
              <button
                disabled
                title="Coming in V2 — paginated asset browsing"
                className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-white border border-gray-200 rounded-md cursor-not-allowed"
              >
                3
              </button>
              <span className="px-1 text-xs text-gray-400">...</span>
              <button
                disabled
                title="Coming in V2 — paginated asset browsing"
                className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-white border border-gray-200 rounded-md cursor-not-allowed"
              >
                516
              </button>
              <button
                disabled
                title="Coming in V2 — paginated asset browsing"
                className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-white border border-gray-200 rounded-md cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
