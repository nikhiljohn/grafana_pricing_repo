/* ------------------------------------------------------------------ */
/*  Intellicore CMP — SecOps (Cloud Security) seed data                 */
/*  Keyed [tenantId][environmentId][endpoint]. One rich production      */
/*  profile per tenant, scaled down for non-prod environments.          */
/* ------------------------------------------------------------------ */

import { TENANTS } from "../../tenants";
import { buildTenantEnvShell, envName } from "./_env";

interface Finding {
  id: number; severity: "critical" | "high" | "medium" | "low"; title: string; resource: string;
  account: string; cisCheck: string; memorySeenCount: number; memoryLastResolution: string;
  memoryConfidence: number; memoryNote: string; actions: string[];
}
interface IamIdentity { name: string; type: string; risk: string; riskColor: string; lastActive: string; memory: string; }
interface Compliance { name: string; pct: number; passing: number; failing: number; notAssessed: number; total: number; }
interface Remediation { date: string; finding: string; action: string; result: string; time: string; }

interface SecOpsProfile {
  findings: Finding[]; iam: IamIdentity[]; compliance: Compliance[]; remediations: Remediation[];
}

const PROFILES: Record<string, SecOpsProfile> = {
  netcore: {
    findings: [
      { id: 1, severity: "medium", title: "3 GKE service accounts use default compute SA", resource: "gke-prod-app", account: "netcore-prod", cisCheck: "CIS 5.1", memorySeenCount: 2, memoryLastResolution: "Scoped custom SA per workload", memoryConfidence: 74, memoryNote: "Partial fix applied on 2 of 5 clusters.", actions: ["Investigate"] },
      { id: 2, severity: "low", title: "Cloud Storage bucket missing lifecycle policy", resource: "gcs-user-uploads", account: "netcore-prod", cisCheck: "CIS 2.2", memorySeenCount: 1, memoryLastResolution: "Moved to Nearline after 30d", memoryConfidence: 68, memoryNote: "Recommend lifecycle policy at bucket creation.", actions: ["Review"] },
    ],
    iam: [
      { name: "ci-deploy-sa", type: "Service Account", risk: "Medium", riskColor: "text-amber-600 bg-amber-50", lastActive: "1h ago", memory: "Has storage.admin, only uses storage.objectViewer" },
      { name: "analytics-sa", type: "Service Account", risk: "Low", riskColor: "text-green-600 bg-green-50", lastActive: "10m ago", memory: "Appropriately scoped" },
    ],
    compliance: [
      { name: "CIS Benchmark v1.4", pct: 91, passing: 39, failing: 4, notAssessed: 0, total: 43 },
      { name: "SOC 2 Type II", pct: 94, passing: 47, failing: 3, notAssessed: 0, total: 50 },
    ],
    remediations: [
      { date: "3d ago", finding: "Default compute SA on GKE (2 clusters)", action: "Scoped custom service accounts", result: "Resolved", time: "18 min" },
    ],
  },
  aarti: {
    findings: [
      { id: 1, severity: "critical", title: "5 security groups allow SSH from internet", resource: "erp-prod-app", account: "aarti-prod", cisCheck: "CIS 5.2", memorySeenCount: 12, memoryLastResolution: "Restricted to VPN CIDR 10.0.0.0/8", memoryConfidence: 96, memoryNote: "Auto-remediated across 3 Aarti accounts on Jul 12. Auto-fix confidence 96%.", actions: ["Auto-Fix", "Investigate"] },
      { id: 2, severity: "high", title: "2 IAM roles have AdministratorAccess by default", resource: "batch-processing-ec2", account: "aarti-prod", cisCheck: "CIS 1.16", memorySeenCount: 8, memoryLastResolution: "Created custom least-privilege policy", memoryConfidence: 88, memoryNote: "Over-privileged roles found 8 times. Avg time to resolve: 25 min.", actions: ["Generate Role"] },
      { id: 3, severity: "medium", title: "CloudTrail log retention below 1 year", resource: "erp-prod-app", account: "aarti-prod", cisCheck: "CIS 2.7", memorySeenCount: 0, memoryLastResolution: "", memoryConfidence: 0, memoryNote: "New finding, flagged ahead of Q3 audit.", actions: ["Investigate"] },
    ],
    iam: [
      { name: "erp-deploy-role", type: "IAM Role", risk: "High", riskColor: "text-rose-600 bg-rose-50", lastActive: "2h ago", memory: "AdministratorAccess since creation. Memory: 8 similar cases resolved with custom least-privilege policies." },
      { name: "audit-readonly-role", type: "IAM Role", risk: "Low", riskColor: "text-green-600 bg-green-50", lastActive: "6h ago", memory: "Appropriately scoped" },
    ],
    compliance: [
      { name: "CIS Benchmark v1.4", pct: 78, passing: 34, failing: 9, notAssessed: 0, total: 43 },
      { name: "NIST 800-53", pct: 84, passing: 92, failing: 18, notAssessed: 10, total: 120 },
      { name: "ISO 27001", pct: 91, passing: 104, failing: 10, notAssessed: 0, total: 114 },
    ],
    remediations: [
      { date: "2d ago", finding: "SSH groups (3 accounts)", action: "Restricted to VPN CIDR", result: "All resolved", time: "12 min" },
      { date: "18d ago", finding: "Over-privileged SA (erp-deploy-sa-2)", action: "Custom role created", result: "Resolved", time: "25 min" },
    ],
  },
  shopstop: {
    findings: [
      { id: 1, severity: "low", title: "3 VPC networks missing flow logs", resource: "vpc-prod-primary", account: "shopstop-prod", cisCheck: "CIS 3.7", memorySeenCount: 0, memoryLastResolution: "", memoryConfidence: 0, memoryNote: "New finding.", actions: ["Investigate"] },
    ],
    iam: [
      { name: "checkout-deploy-sa", type: "Service Account", risk: "Low", riskColor: "text-green-600 bg-green-50", lastActive: "20m ago", memory: "Appropriately scoped" },
    ],
    compliance: [
      { name: "CIS Benchmark v1.4", pct: 92, passing: 40, failing: 3, notAssessed: 0, total: 43 },
      { name: "PCI-DSS (payment pages only)", pct: 96, passing: 48, failing: 2, notAssessed: 0, total: 50 },
    ],
    remediations: [
      { date: "12d ago", finding: "Bastion egress false positive", action: "Adjusted anomaly baseline to exclude backup CIDR", result: "Resolved, no impact", time: "4 min" },
    ],
  },
  designx: {
    findings: [
      { id: 1, severity: "high", title: "deploy-bot granted project Editor (risky IAM change)", resource: "deploy-bot", account: "designx-prod", cisCheck: "CIS 1.16", memorySeenCount: 3, memoryLastResolution: "Suggested least-privilege role pre-deploy", memoryConfidence: 87, memoryNote: "On May 9 an Editor grant to a CI bot led to a privilege-escalation finding. Guardrail now catches this pattern before it ships.", actions: ["Generate Role", "Investigate"] },
    ],
    iam: [
      { name: "deploy-bot", type: "Service Account", risk: "Medium", riskColor: "text-amber-600 bg-amber-50", lastActive: "12d ago", memory: "Flagged pre-deploy 3 times. Least-privilege role suggested each time." },
    ],
    compliance: [
      { name: "CIS Benchmark v1.4", pct: 90, passing: 39, failing: 4, notAssessed: 0, total: 43 },
    ],
    remediations: [
      { date: "12d ago", finding: "deploy-bot Editor grant", action: "Guardrail suggested least-privilege role", result: "Blocked pre-deploy", time: "instant" },
    ],
  },
  dmart: {
    findings: [
      { id: 1, severity: "medium", title: "3 hcl-commerce pods running without a non-root securityContext", resource: "gke-prod-commerce", account: "dmart-prod", cisCheck: "CIS Kubernetes 5.2.6", memorySeenCount: 2, memoryLastResolution: "Added runAsNonRoot + read-only root filesystem to pod spec", memoryConfidence: 85, memoryNote: "Same finding resolved on 2 other GKE workloads via a shared PodSecurity baseline template.", actions: ["Generate Role", "Investigate"] },
      { id: 2, severity: "low", title: "GKE Workload Identity not enabled — pods use default node service account", resource: "gke-prod-catalog", account: "dmart-prod", cisCheck: "CIS Kubernetes 5.1.5", memorySeenCount: 1, memoryLastResolution: "Enabled Workload Identity, scoped per-service KSA", memoryConfidence: 80, memoryNote: "Recommend enabling Workload Identity before next workload onboarding.", actions: ["Investigate"] },
    ],
    iam: [
      { name: "gke-default-node-sa", type: "Service Account", risk: "Medium", riskColor: "text-amber-600 bg-amber-50", lastActive: "1h ago", memory: "Used by 3 workloads pending Workload Identity migration." },
      { name: "commerce-ci-deploy-sa", type: "Service Account", risk: "Low", riskColor: "text-green-600 bg-green-50", lastActive: "20m ago", memory: "Appropriately scoped to GKE deploy + Artifact Registry pull." },
    ],
    compliance: [
      { name: "CIS Kubernetes Benchmark v1.7", pct: 87, passing: 46, failing: 7, notAssessed: 0, total: 53 },
      { name: "CIS Benchmark v1.4 (GCP)", pct: 92, passing: 40, failing: 3, notAssessed: 0, total: 43 },
    ],
    remediations: [
      { date: "12d ago", finding: "Non-root securityContext missing (2 workloads)", action: "Applied shared PodSecurity baseline template", result: "Resolved", time: "22 min" },
    ],
  },
};

function scaleForEnv(p: SecOpsProfile, envId: string, isProd: boolean): SecOpsProfile {
  if (isProd) return p;
  return {
    findings: p.findings
      .filter((f) => f.severity !== "critical")
      .map((f) => ({ ...f, resource: envName(f.resource, envId) })),
    iam: p.iam.map((i) => ({ ...i, risk: i.risk === "High" ? "Medium" : i.risk, riskColor: i.risk === "High" ? "text-amber-600 bg-amber-50" : i.riskColor })),
    compliance: p.compliance.map((c) => ({ ...c, pct: Math.min(99, c.pct + 4) })),
    remediations: p.remediations,
  };
}

const data = buildTenantEnvShell(TENANTS, (tenant, envId, isProd) => {
  const scaled = scaleForEnv(PROFILES[tenant.id], envId, isProd);
  return {
    "/secops/findings": scaled.findings,
    "/secops/iam": scaled.iam,
    "/secops/compliance": scaled.compliance,
    "/secops/remediations": scaled.remediations,
  };
});

export default data;
