/* ------------------------------------------------------------------ */
/*  Intellicore CMP — the managed customer book                       */
/*  Canonical list of demo tenants + the environments each one runs.   */
/*  Every mock data module keys its seed data off these ids so the     */
/*  org switcher (Command Center, top-right) actually changes what     */
/*  every page renders.                                                 */
/* ------------------------------------------------------------------ */

export interface EnvironmentDef {
  id: string;
  label: string;
}

export interface Tenant {
  id: string;
  name: string;
  industry: string;
  clouds: string[];
  tier: "foundation" | "advanced" | "elite";
  heroPillar: string;
  /** Short line used in the org switcher dropdown under the name. */
  tagline: string;
  /** Tailwind classes for the avatar chip in the org switcher. */
  accent: string;
  environments: EnvironmentDef[];
}

export const TENANTS: Tenant[] = [
  {
    id: "netcore",
    name: "Netcore Cloud",
    industry: "Martech SaaS",
    clouds: ["gcp"],
    tier: "elite",
    heroPillar: "FinOps",
    tagline: "$1.1M/mo GCP spend",
    accent: "bg-blue-100 text-blue-700",
    environments: [
      { id: "production", label: "Production" },
      { id: "staging", label: "Staging" },
    ],
  },
  {
    id: "aarti",
    name: "Aarti Industries",
    industry: "Chemicals / Pharma",
    clouds: ["gcp"],
    tier: "advanced",
    heroPillar: "Cloud Security",
    tagline: "Mid-audit, compliance-critical",
    accent: "bg-rose-100 text-rose-700",
    environments: [
      { id: "production", label: "Production" },
      { id: "uat", label: "UAT" },
    ],
  },
  {
    id: "shopstop",
    name: "ShoppersStop",
    industry: "Retail / E-commerce",
    clouds: ["gcp", "aws"],
    tier: "elite",
    heroPillar: "CloudOps",
    tagline: "Peak-sale reliability",
    accent: "bg-amber-100 text-amber-700",
    environments: [
      { id: "production", label: "Production" },
      { id: "staging", label: "Staging" },
      { id: "dev", label: "Dev" },
    ],
  },
  {
    id: "designx",
    name: "DesignX",
    industry: "Design SaaS",
    clouds: ["gcp"],
    tier: "foundation",
    heroPillar: "DevOps",
    tagline: "Change guardrails, fast ship",
    accent: "bg-violet-100 text-violet-700",
    environments: [
      { id: "production", label: "Production" },
      { id: "dev", label: "Dev" },
    ],
  },
  {
    id: "paynimbus",
    name: "PayNimbus",
    industry: "Fintech / Payments",
    clouds: ["aws", "gcp"],
    tier: "elite",
    heroPillar: "Cloud Security",
    tagline: "PCI-DSS, zero tolerance",
    accent: "bg-emerald-100 text-emerald-700",
    environments: [
      { id: "production", label: "Production" },
      { id: "uat", label: "UAT" },
    ],
  },
];

export const DEFAULT_TENANT_ID = "netcore";
export const DEFAULT_ENV_ID = "production";

export function getTenant(id: string): Tenant {
  return TENANTS.find((t) => t.id === id) ?? TENANTS[0];
}

export function envLabel(tenantId: string, envId: string): string {
  const tenant = getTenant(tenantId);
  return tenant.environments.find((e) => e.id === envId)?.label ?? envId;
}

/** Short suffix used to flavor resource names per environment (e.g. "gke-prod-app" vs "gke-app-staging"). */
export function envSuffix(envId: string): string {
  if (envId === "production") return "prod";
  return envId;
}
