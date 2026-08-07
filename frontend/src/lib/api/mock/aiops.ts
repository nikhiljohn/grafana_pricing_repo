/* ------------------------------------------------------------------ */
/*  Intellicore CMP — AIOps seed data                                  */
/*  Keyed [tenantId][environmentId][endpoint]. One rich production      */
/*  profile per tenant, scaled down for non-prod environments.          */
/* ------------------------------------------------------------------ */

import {
  Bot, ShieldCheck, Zap, Brain, TrendingUp, CheckCircle2, Clock, Eye,
  Activity, ShieldAlert, AlertTriangle, DollarSign, GitCompare, ClipboardCheck,
} from "lucide-react";
import { TENANTS } from "../../tenants";
import { buildTenantEnvShell } from "./_env";

interface Stat { label: string; value: string; sub: string | null; icon: unknown; color: string; bg: string; border: string; pulse: boolean; }
interface Agent { name: string; status: string; statusColor: string; description: string; lastAction: string; confidence: number; }
interface Activity_ { time: string; agent: string; action: string; result: string; resultColor: string; resultBg: string; icon: unknown; }
interface AuditEntry { time: string; decision: string; reasoning: string; outcome: string; outcomeColor: string; }

interface AiOpsProfile {
  activeAgents: number; remediations30d: number; tokens30d: string; tokenCost: string;
  memoryEntries: number; successRate: string;
  agents: Agent[]; activity: Activity_[]; auditTrail: AuditEntry[];
}

const TOOLS = [
  { icon: Activity, title: "Anomaly Narrative", desc: "AI explains anomalies in plain English with Memory context", usage: 12, usageLabel: "analyses run" },
  { icon: ShieldAlert, title: "Policy Engine", desc: "Natural language → IAM/firewall policies", usage: 8, usageLabel: "policies generated" },
  { icon: AlertTriangle, title: "Incident Assistant", desc: "Correlates current incident with Memory of past resolutions", usage: 23, usageLabel: "incidents assisted" },
  { icon: DollarSign, title: "Cost Optimization Advisor", desc: "Recommendations with ROI from past applications", usage: 7, usageLabel: "optimizations applied" },
  { icon: GitCompare, title: "Drift Analysis", desc: "Detects config drift and correlates with incidents", usage: 3, usageLabel: "drifts detected" },
  { icon: ClipboardCheck, title: "Compliance Reporter", desc: "Generates compliance reports with remediation history", usage: 2, usageLabel: "reports generated" },
];

const QUICK_QUERIES = [
  "What changed in the last 24h?",
  "What's our biggest cost risk?",
  "Which findings should I fix first?",
  "Show me deployment patterns",
];

const DAILY_TOKENS = [12, 18, 45, 28, 34, 22, 15, 42, 38, 27, 19, 55, 31, 24, 48, 36, 29, 17, 41, 33, 26, 52, 21, 37, 44, 30, 23, 47, 35, 20];

const PROFILES: Record<string, AiOpsProfile> = {
  netcore: {
    activeAgents: 4, remediations30d: 31, tokens30d: "1.2M", tokenCost: "$3.60", memoryEntries: 82, successRate: "94%",
    agents: [
      { name: "Cost Anomaly Agent", status: "Investigating", statusColor: "bg-amber-500", description: "Detected BigQuery +340% spike. Correlating with Memory: matches Jul 15 ETL pattern (88% confidence).", lastAction: "Flagged anomaly, generated fix recommendation (4h ago)", confidence: 88 },
      { name: "Predictive Operations Agent", status: "Active", statusColor: "bg-emerald-500", description: "Monitoring 14 metrics across gke-prod-app and gke-prod-ml. 1 warning (node pool memory pressure).", lastAction: "Recommended node pool right-sizing (3d ago)", confidence: 92 },
      { name: "Security Auto-Remediation Agent", status: "Active", statusColor: "bg-emerald-500", description: "Monitoring 58 findings across GCP. 4 auto-remediated in 30d.", lastAction: "Scoped a default compute SA (2d ago)", confidence: 85 },
    ],
    activity: [
      { time: "4h ago", agent: "Cost Agent", action: "Detected BigQuery anomaly, generated remediation plan", result: "Awaiting approval", resultColor: "text-amber-600", resultBg: "bg-amber-50", icon: Clock },
      { time: "3d ago", agent: "Predictive Agent", action: "Right-sized gke-prod-app node pool ahead of breach", result: "Success", resultColor: "text-emerald-600", resultBg: "bg-emerald-50", icon: CheckCircle2 },
    ],
    auditTrail: [
      { time: "4h ago", decision: "Flag BigQuery cost anomaly", reasoning: "Spend exceeded 3-sigma threshold. Memory matched Jul 15 ETL incident (88%). Auto-fix available but cost > $50 — requires approval.", outcome: "Awaiting approval", outcomeColor: "text-amber-600" },
      { time: "3d ago", decision: "Right-size GKE node pool", reasoning: "Memory pressure hit 88%, matching the 65%-of-projection pattern seen 7 times before.", outcome: "Executed", outcomeColor: "text-emerald-600" },
    ],
  },
  aarti: {
    activeAgents: 2, remediations30d: 12, tokens30d: "410K", tokenCost: "$1.20", memoryEntries: 34, successRate: "97%",
    agents: [
      { name: "Security Auto-Remediation Agent", status: "Active", statusColor: "bg-emerald-500", description: "Monitoring 43 findings. 12 auto-remediated in 30d. Currently watching: SSH security group creation.", lastAction: "Restricted SSH group to VPN CIDR (2d ago)", confidence: 96 },
      { name: "Compliance Evidence Agent", status: "Active", statusColor: "bg-emerald-500", description: "Auto-attaches CIS/NIST/ISO evidence to every remediation ahead of Q3 audit.", lastAction: "Attached evidence to 3 findings (21d ago)", confidence: 90 },
    ],
    activity: [
      { time: "2d ago", agent: "Security Agent", action: "Auto-restricted SSH group across 3 accounts", result: "Success", resultColor: "text-emerald-600", resultBg: "bg-emerald-50", icon: CheckCircle2 },
    ],
    auditTrail: [
      { time: "2d ago", decision: "Auto-restrict SSH security group", reasoning: "Matched known over-permissive pattern. Memory confidence 96%. No prior regressions.", outcome: "Executed", outcomeColor: "text-emerald-600" },
    ],
  },
  shopstop: {
    activeAgents: 5, remediations30d: 18, tokens30d: "2.1M", tokenCost: "$6.30", memoryEntries: 41, successRate: "96%",
    agents: [
      { name: "Predictive Operations Agent", status: "Active", statusColor: "bg-emerald-500", description: "Monitoring checkout, cart, and catalog services ahead of the sale window. Predictive scaling active on 5 services.", lastAction: "Auto-scaled checkout-service 6 min ahead of breach (45d ago)", confidence: 94 },
      { name: "Anomaly Classification Agent", status: "Investigating", statusColor: "bg-amber-500", description: "New egress anomaly signature differs from the known Jun 2 false positive. Flagged as likely real.", lastAction: "Escalated for human review (4h ago)", confidence: 78 },
    ],
    activity: [
      { time: "4h ago", agent: "Anomaly Agent", action: "Classified new egress signature as likely real (differs from Jun 2 baseline)", result: "Flagged for review", resultColor: "text-orange-600", resultBg: "bg-orange-50", icon: Eye },
    ],
    auditTrail: [
      { time: "4h ago", decision: "Classify checkout-service egress as likely real", reasoning: "Signature differs from the Jun 2 false-positive baseline (backup job). Confidence 78% — below auto-suppress threshold.", outcome: "Flagged", outcomeColor: "text-orange-600" },
    ],
  },
  designx: {
    activeAgents: 2, remediations30d: 5, tokens30d: "180K", tokenCost: "$0.55", memoryEntries: 19, successRate: "100%",
    agents: [
      { name: "Change Guardrail Agent", status: "Active", statusColor: "bg-emerald-500", description: "Pre-deploy guardrail watching for risky IAM grants to CI service accounts.", lastAction: "Blocked deploy-bot Editor grant, suggested least-privilege role (12d ago)", confidence: 87 },
    ],
    activity: [
      { time: "12d ago", agent: "Guardrail Agent", action: "Blocked risky IAM grant to deploy-bot before it shipped", result: "Success", resultColor: "text-emerald-600", resultBg: "bg-emerald-50", icon: CheckCircle2 },
    ],
    auditTrail: [
      { time: "12d ago", decision: "Block Editor grant to deploy-bot", reasoning: "Matches the May 9 incident pattern that led to privilege escalation. Guardrail suggested least-privilege role instead.", outcome: "Executed", outcomeColor: "text-emerald-600" },
    ],
  },
  dmart: {
    activeAgents: 4, remediations30d: 14, tokens30d: "890K", tokenCost: "$2.70", memoryEntries: 31, successRate: "93%",
    agents: [
      { name: "Predictive HPA Agent", status: "Active", statusColor: "bg-emerald-500", description: "Monitoring pod memory/CPU across 4 hcl-commerce services ahead of flash-sale traffic.", lastAction: "Flagged checkout memory limit as under-sized before today's OOMKill (1h ago)", confidence: 91 },
      { name: "Cost Anomaly Agent", status: "Active", statusColor: "bg-emerald-500", description: "Watching GKE node pool spend for post-sale over-provisioning.", lastAction: "Triggered automated scale-down 48h after last sale window (12d ago)", confidence: 88 },
    ],
    activity: [
      { time: "1h ago", agent: "Predictive HPA Agent", action: "Detected checkout pod memory limit under-sized for flash-sale load", result: "Fix suggested", resultColor: "text-amber-600", resultBg: "bg-amber-50", icon: Clock },
    ],
    auditTrail: [
      { time: "1h ago", decision: "Raise hcl-commerce-checkout pod memory limit", reasoning: "3rd OOMKill in 70 days under the same flash-sale traffic pattern. Memory confidence 91%, no prior regressions from this fix.", outcome: "Awaiting approval", outcomeColor: "text-amber-600" },
    ],
  },
};

function scaleForEnv(p: AiOpsProfile, isProd: boolean): AiOpsProfile {
  if (isProd) return p;
  return {
    ...p,
    activeAgents: Math.max(1, Math.round(p.activeAgents * 0.5)),
    remediations30d: Math.round(p.remediations30d * 0.3),
    tokens30d: p.tokens30d,
    memoryEntries: p.memoryEntries,
    agents: p.agents.slice(0, 1),
    activity: p.activity.slice(0, 1),
    auditTrail: p.auditTrail.slice(0, 1),
  };
}

const data = buildTenantEnvShell(TENANTS, (tenant, _envId, isProd) => {
  const p = scaleForEnv(PROFILES[tenant.id], isProd);
  return {
    "/aiops/stats": [
      { label: "AI Agents Active", value: String(p.activeAgents), sub: null, icon: Bot, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", pulse: true },
      { label: "Auto-remediations (30d)", value: String(p.remediations30d), sub: "0 regressions", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", pulse: false },
      { label: "Tokens Used (30d)", value: p.tokens30d, sub: `${p.tokenCost} total cost`, icon: Zap, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", pulse: false },
      { label: "Memory Entries", value: String(p.memoryEntries), sub: "patterns, incidents, learnings", icon: Brain, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", pulse: false },
      { label: "Success Rate", value: p.successRate, sub: "across all AI actions", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", pulse: false },
    ],
    "/aiops/agents": p.agents,
    "/aiops/activity": p.activity,
    "/aiops/quick-queries": QUICK_QUERIES,
    "/aiops/tools": TOOLS,
    "/aiops/daily-tokens": DAILY_TOKENS,
    "/aiops/cost-by-feature": [
      { feature: "Auto-remediation", tokens: "312K", cost: "$0.94", pct: 37, color: "bg-blue-500" },
      { feature: "Query Infrastructure", tokens: "245K", cost: "$0.74", pct: 29, color: "bg-violet-500" },
      { feature: "Anomaly Analysis", tokens: "156K", cost: "$0.47", pct: 18, color: "bg-amber-500" },
      { feature: "Policy Generation", tokens: "89K", cost: "$0.27", pct: 11, color: "bg-emerald-500" },
      { feature: "Reports", tokens: "45K", cost: "$0.14", pct: 5, color: "bg-slate-400" },
    ],
    "/aiops/audit-trail": p.auditTrail,
  };
});

export default data;
