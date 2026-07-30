"use client";

import { useState } from "react";
import { Network, ChevronDown, ChevronUp, Globe, Building2 } from "lucide-react";

/* ─── Data ──────────────────────────────────────────────────────────────── */

type CloudFilter = "all" | "aws" | "gcp";

interface Subnet {
  id: string;
}

interface VPC {
  name: string;
  id: string;
  region: string;
  cidr: string;
  isDefault?: boolean;
  subnets: Subnet[];
  extraSubnets?: number;
  resourceCount: number;
}

const awsVPCs: VPC[] = [
  {
    name: "security-tools-vpc",
    id: "vpc-05e7c59e73a95de72",
    region: "ap-south-1",
    cidr: "192.168.0.0/16",
    subnets: [
      { id: "64505304" },
      { id: "44ea3f37" },
      { id: "0d5888e9" },
      { id: "47578d83" },
    ],
    resourceCount: 0,
  },
  {
    name: "vpc-576c633f",
    id: "vpc-576c633f",
    region: "ap-south-1",
    cidr: "172.31.0.0/16",
    isDefault: true,
    subnets: [
      { id: "4466992a" },
      { id: "63aefd6e" },
      { id: "665bbf87" },
      { id: "4b3ac64b" },
      { id: "0f9f348b" },
      { id: "09104868" },
    ],
    extraSubnets: 17,
    resourceCount: 0,
  },
  {
    name: "vpc-bc75b3d6",
    id: "vpc-bc75b3d6",
    region: "eu-central-1",
    cidr: "172.31.0.0/16",
    isDefault: true,
    subnets: [],
    resourceCount: 0,
  },
];

const gcpNetworks = [
  { name: "default", project: "searce-playground", region: "global", subnets: 24, resourceCount: 3 },
  { name: "custom-vpc-prod", project: "searce-prod", region: "global", subnets: 8, resourceCount: 2 },
  { name: "shared-vpc-host", project: "searce-shared", region: "global", subnets: 12, resourceCount: 2 },
  { name: "analytics-network", project: "searce-analytics", region: "global", subnets: 6, resourceCount: 1 },
];

/* Deterministic badge colours keyed on the first hex char of the subnet ID */
const SUBNET_COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-red-500",
];

function subnetColor(id: string) {
  const idx = parseInt(id[0], 16);
  return SUBNET_COLORS[idx % SUBNET_COLORS.length];
}

/* ─── Components ────────────────────────────────────────────────────────── */

function VPCCard({ vpc }: { vpc: VPC }) {
  const [expanded, setExpanded] = useState(false);
  const totalResources = vpc.resourceCount;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Card header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-orange-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800 truncate">{vpc.name}</span>
              {vpc.isDefault && (
                <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                  Default
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-mono">{vpc.id}</span>
              <span className="text-slate-300">&#183;</span>
              <span>{vpc.region}</span>
              <span className="text-slate-300">&#183;</span>
              <span className="font-mono">{vpc.cidr}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <span className="text-xs text-slate-500">{totalResources} resources</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4">
          {/* Subnets */}
          {vpc.subnets.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-2">
                Subnets
              </div>
              <div className="flex flex-wrap gap-2">
                {vpc.subnets.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1"
                  >
                    <span className={`w-2 h-2 rounded-full ${subnetColor(s.id)}`} />
                    {s.id}
                  </span>
                ))}
                {vpc.extraSubnets && (
                  <span className="inline-flex items-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
                    +{vpc.extraSubnets} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Resources placeholder */}
          {totalResources === 0 && (
            <div className="flex items-center justify-center py-6 text-sm text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No compute resources in this VPC
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function ServiceMapPage() {
  const [cloudFilter, setCloudFilter] = useState<CloudFilter>("all");
  const [summaryTab, setSummaryTab] = useState<"aws" | "gcp">("aws");

  const awsTotalResources = awsVPCs.reduce((s, v) => s + v.resourceCount, 0);
  const gcpTotalResources = gcpNetworks.reduce((s, n) => s + n.resourceCount, 0);

  const cloudTabs: { key: CloudFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "aws", label: "AWS" },
    { key: "gcp", label: "GCP" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
            <Network className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-searce-navy">Service Map</h1>
            <p className="text-sm text-slate-500 mt-0.5 max-w-xl">
              Network topology &mdash; VPCs, subnets, compute, database and security groups
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Org selector */}
          <div className="flex items-center gap-2 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-slate-700 font-medium">Netcore Cloud</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Cloud filter tabs */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            {cloudTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setCloudFilter(t.key)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition ${
                  cloudFilter === t.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Summary tabs ──────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button
          onClick={() => setSummaryTab("aws")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition ${
            summaryTab === "aws"
              ? "bg-orange-50 border-orange-200 text-orange-800"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span className="font-semibold">{awsVPCs.length} AWS VPCs</span>
          <span className="text-slate-400">&#183;</span>
          <span className="text-xs">{awsTotalResources} resources</span>
        </button>
        <button
          onClick={() => setSummaryTab("gcp")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition ${
            summaryTab === "gcp"
              ? "bg-blue-50 border-blue-200 text-blue-800"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span className="font-semibold">{gcpNetworks.length} GCP Networks</span>
          <span className="text-slate-400">&#183;</span>
          <span className="text-xs">{gcpTotalResources} resources</span>
        </button>
      </div>

      {/* ── AWS VPCs section ──────────────────────────────────────────── */}
      {(cloudFilter === "all" || cloudFilter === "aws") && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center">
              <span className="text-[10px] font-bold text-orange-700">&#9679;</span>
            </div>
            <h2 className="text-sm font-semibold text-slate-800">
              Amazon Web Services &mdash; {awsVPCs.length} VPCs
            </h2>
          </div>

          <div className="space-y-3">
            {awsVPCs.map((vpc) => (
              <VPCCard key={vpc.id} vpc={vpc} />
            ))}
          </div>
        </section>
      )}

      {/* ── GCP Networks section ──────────────────────────────────────── */}
      {(cloudFilter === "all" || cloudFilter === "gcp") && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
              <span className="text-[10px] font-bold text-blue-700">&#9679;</span>
            </div>
            <h2 className="text-sm font-semibold text-slate-800">
              Google Cloud Platform &mdash; {gcpNetworks.length} Networks
            </h2>
          </div>

          <div className="space-y-3">
            {gcpNetworks.map((net) => (
              <div
                key={net.name}
                className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{net.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <span>{net.project}</span>
                      <span className="text-slate-300">&#183;</span>
                      <span>{net.region}</span>
                      <span className="text-slate-300">&#183;</span>
                      <span>{net.subnets} subnets</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{net.resourceCount} resources</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
