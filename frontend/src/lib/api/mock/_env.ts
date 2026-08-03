/* ------------------------------------------------------------------ */
/*  Shared helpers for building tenant + environment aware mock data.  */
/*  Each pillar mock file authors one rich PRODUCTION profile per       */
/*  tenant, then derives lighter non-prod variants with these helpers   */
/*  so environments feel distinct without hand-authoring every          */
/*  tenant × environment combination from scratch.                     */
/* ------------------------------------------------------------------ */

import { Tenant } from "../../tenants";

/** Non-prod environments run smaller and calmer than production. */
export function envFactor(envId: string): number {
  switch (envId) {
    case "production":
      return 1;
    case "staging":
      return 0.45;
    case "uat":
      return 0.35;
    case "dev":
      return 0.2;
    default:
      return 0.5;
  }
}

/** Flavors a resource name for a non-prod environment, e.g. "gke-app" -> "gke-app-staging". */
export function envName(base: string, envId: string): string {
  if (envId === "production") return base;
  return `${base}-${envId}`;
}

/** Scales a "$123" style cost string down for non-prod environments. */
export function scaleCost(cost: string, envId: string): string {
  const factor = envFactor(envId);
  const match = cost.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return cost;
  const [, prefix, numStr, suffix] = match;
  const num = parseFloat(numStr.replace(/,/g, ""));
  const scaled = Math.max(0, Math.round(num * factor));
  return `${prefix}${scaled}${suffix}`;
}

/** Builds the nested [tenantId][environmentId] shell for a mock module. */
export function buildTenantEnvShell<T>(
  tenants: Tenant[],
  perEnv: (tenant: Tenant, envId: string, isProd: boolean) => T,
): Record<string, Record<string, T>> {
  const out: Record<string, Record<string, T>> = {};
  for (const tenant of tenants) {
    out[tenant.id] = {};
    for (const env of tenant.environments) {
      out[tenant.id][env.id] = perEnv(tenant, env.id, env.id === "production");
    }
  }
  return out;
}
