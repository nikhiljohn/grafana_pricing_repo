/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Alerts seed data                                 */
/*  Keyed [tenantId][environmentId]["/alerts"]. One rich production      */
/*  profile per tenant, scaled down for non-prod environments.          */
/* ------------------------------------------------------------------ */

import { TENANTS } from "../../tenants";
import { buildTenantEnvShell, envFactor } from "./_env";

interface Alert {
  id: string; title: string; status: string; description: string;
  baseline: string; current: string; increase: string; date: string; type: string;
}

const PROFILES: Record<string, Alert[]> = {
  netcore: [
    {
      id: "1", title: "Cost spike detected: +340%", status: "ACTIVE",
      description: "Spend for 'netcore-prod-1' BigQuery increased 340% in the last 4h ($1,240 → $5,458/day). Threshold: 25%.",
      baseline: "$1,240/day", current: "$5,458/day", increase: "+340%", date: "Aug 3, 2026 06:12:00", type: "COST_SPIKE",
    },
    {
      id: "2", title: "Memory pressure warning: gke-prod-app", status: "ACTIVE",
      description: "Node pool memory pressure hit 88%, exceeding the 85% threshold.",
      baseline: "62%", current: "88%", increase: "+26pp", date: "Aug 3, 2026 08:40:00", type: "RESOURCE_PRESSURE",
    },
  ],
  aarti: [
    {
      id: "1", title: "Security finding: SSH open to internet", status: "ACTIVE",
      description: "5 security groups on 'aarti-prod-1' allow SSH from 0.0.0.0/0 (CIS 5.2). Auto-fix available at 96% confidence.",
      baseline: "0 open groups", current: "5 open groups", increase: "+5", date: "Aug 3, 2026 05:02:00", type: "SECURITY_FINDING",
    },
  ],
  shopstop: [
    {
      id: "1", title: "Egress anomaly: checkout-service", status: "ACTIVE",
      description: "Network egress on checkout-service-prod is 3.3σ above baseline, ahead of the scheduled sale window.",
      baseline: "180 GB/day", current: "410 GB/day", increase: "+128%", date: "Aug 3, 2026 07:15:00", type: "NETWORK_ANOMALY",
    },
  ],
  designx: [
    {
      id: "1", title: "Risky IAM change blocked: deploy-bot", status: "ACKNOWLEDGED",
      description: "deploy-bot was granted project Editor. Pre-deploy guardrail blocked the change and suggested a least-privilege role.",
      baseline: "roles/viewer", current: "roles/editor (blocked)", increase: "n/a", date: "Jul 22, 2026 14:20:00", type: "IAM_GUARDRAIL",
    },
  ],
  dmart: [
    {
      id: "1", title: "Pods OOMKilled: hcl-commerce-checkout", status: "ACTIVE",
      description: "3 checkout pods on 'gke-prod-commerce' were OOMKilled during flash-sale traffic — JVM heap exceeded the 2Gi pod memory limit. Fix available at 91% confidence.",
      baseline: "0 restarts/hr", current: "3 restarts/hr", increase: "+3", date: "Aug 3, 2026 14:05:00", type: "RESOURCE_PRESSURE",
    },
  ],
};

const data = buildTenantEnvShell(TENANTS, (tenant, envId, isProd) => {
  const alerts = PROFILES[tenant.id].map((a) =>
    isProd
      ? a
      : { ...a, status: "RESOLVED" as const, title: `[${envId}] ${a.title}`, increase: `~${Math.round(envFactor(envId) * 100)}% of prod` },
  );
  return { "/alerts": alerts };
});

export default data;
