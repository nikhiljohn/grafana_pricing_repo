/* ------------------------------------------------------------------ */
/*  Intellicore CMP — AIOps seed data                                 */
/*  Served by apiFetch() when no backend is configured.  Keyed by the  */
/*  endpoint path each page requests via useApiData().                 */
/* ------------------------------------------------------------------ */

import {
  Bot,
  ShieldCheck,
  Zap,
  Brain,
  TrendingUp,
  CheckCircle2,
  Clock,
  Eye,
  Activity,
  ShieldAlert,
  AlertTriangle,
  DollarSign,
  GitCompare,
  ClipboardCheck,
} from "lucide-react";

const data: Record<string, unknown> = {
  "/aiops/stats": [
    {
      label: "AI Agents Active",
      value: "3",
      sub: null,
      icon: Bot,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      pulse: true,
    },
    {
      label: "Auto-remediations (30d)",
      value: "23",
      sub: "0 regressions",
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      pulse: false,
    },
    {
      label: "Tokens Used (30d)",
      value: "847K",
      sub: "$2.40 total cost",
      icon: Zap,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      pulse: false,
    },
    {
      label: "Memory Entries",
      value: "156",
      sub: "patterns, incidents, learnings",
      icon: Brain,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-200",
      pulse: false,
    },
    {
      label: "Success Rate",
      value: "96%",
      sub: "across all AI actions",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      pulse: false,
    },
  ],

  "/aiops/agents": [
    {
      name: "Security Auto-Remediation Agent",
      status: "Active",
      statusColor: "bg-emerald-500",
      description:
        "Monitoring 342 findings. 23 auto-remediated in 30d. Currently watching: SSH security group creation events.",
      lastAction: "Restricted SSH group to VPN CIDR (2h ago)",
      confidence: 85,
    },
    {
      name: "Cost Anomaly Agent",
      status: "Investigating",
      statusColor: "bg-amber-500",
      description:
        "Detected BigQuery +340% spike. Correlating with Memory: matches Jul 15 ETL pattern (88% confidence). Awaiting human approval for fix.",
      lastAction: "Flagged anomaly, generated fix recommendation (4h ago)",
      confidence: 88,
    },
    {
      name: "Predictive Operations Agent",
      status: "Active",
      statusColor: "bg-emerald-500",
      description:
        "Monitoring 11 metrics across 5 instances. 1 critical anomaly (bastion-host egress). 4 trending toward breach in 22d.",
      lastAction: "Updated trend prediction for clens-dev CPU (12h ago)",
      confidence: 92,
    },
  ],

  "/aiops/activity": [
    {
      time: "2h ago",
      agent: "Security Agent",
      action: "Auto-restricted SSH group 'launch-wizard-111' to VPN CIDR",
      result: "Success",
      resultColor: "text-emerald-600",
      resultBg: "bg-emerald-50",
      icon: CheckCircle2,
    },
    {
      time: "4h ago",
      agent: "Cost Agent",
      action: "Detected BigQuery anomaly, generated remediation plan",
      result: "Awaiting approval",
      resultColor: "text-amber-600",
      resultBg: "bg-amber-50",
      icon: Clock,
    },
    {
      time: "8h ago",
      agent: "Predictive Agent",
      action: "Bastion-host egress classified as false positive (72% confidence)",
      result: "Flagged for review",
      resultColor: "text-orange-600",
      resultBg: "bg-orange-50",
      icon: Eye,
    },
    {
      time: "1d ago",
      agent: "Security Agent",
      action: "Disabled inactive IAM user test-user@searce.com",
      result: "Success",
      resultColor: "text-emerald-600",
      resultBg: "bg-emerald-50",
      icon: CheckCircle2,
    },
    {
      time: "2d ago",
      agent: "Cost Agent",
      action: "Applied committed use discount recommendation to project Sea-Sbox",
      result: "Success",
      resultColor: "text-emerald-600",
      resultBg: "bg-emerald-50",
      icon: CheckCircle2,
    },
  ],

  "/aiops/quick-queries": [
    "What changed in the last 24h?",
    "What's our biggest cost risk?",
    "Which findings should I fix first?",
    "Show me deployment patterns",
  ],

  "/aiops/tools": [
    {
      icon: Activity,
      title: "Anomaly Narrative",
      desc: "AI explains anomalies in plain English with Memory context",
      usage: 12,
      usageLabel: "analyses run",
    },
    {
      icon: ShieldAlert,
      title: "Policy Engine",
      desc: "Natural language → IAM/firewall policies",
      usage: 8,
      usageLabel: "policies generated",
    },
    {
      icon: AlertTriangle,
      title: "Incident Assistant",
      desc: "Correlates current incident with Memory of past resolutions",
      usage: 23,
      usageLabel: "incidents assisted",
    },
    {
      icon: DollarSign,
      title: "Cost Optimization Advisor",
      desc: "Recommendations with ROI from past applications",
      usage: 7,
      usageLabel: "optimizations applied",
    },
    {
      icon: GitCompare,
      title: "Drift Analysis",
      desc: "Detects config drift and correlates with incidents",
      usage: 3,
      usageLabel: "drifts detected",
    },
    {
      icon: ClipboardCheck,
      title: "Compliance Reporter",
      desc: "Generates compliance reports with remediation history",
      usage: 2,
      usageLabel: "reports generated",
    },
  ],

  "/aiops/daily-tokens": [
    12, 18, 45, 28, 34, 22, 15, 42, 38, 27, 19, 55, 31, 24, 48, 36, 29, 17,
    41, 33, 26, 52, 21, 37, 44, 30, 23, 47, 35, 20,
  ],

  "/aiops/cost-by-feature": [
    { feature: "Auto-remediation", tokens: "312K", cost: "$0.94", pct: 37, color: "bg-blue-500" },
    { feature: "Query Infrastructure", tokens: "245K", cost: "$0.74", pct: 29, color: "bg-violet-500" },
    { feature: "Anomaly Analysis", tokens: "156K", cost: "$0.47", pct: 18, color: "bg-amber-500" },
    { feature: "Policy Generation", tokens: "89K", cost: "$0.27", pct: 11, color: "bg-emerald-500" },
    { feature: "Reports", tokens: "45K", cost: "$0.14", pct: 5, color: "bg-slate-400" },
  ],

  "/aiops/audit-trail": [
    {
      time: "2h ago",
      decision: "Auto-restrict SSH security group",
      reasoning: "Matched known over-permissive pattern. Memory confidence 91%. No prior regressions from this action type.",
      outcome: "Executed",
      outcomeColor: "text-emerald-600",
    },
    {
      time: "4h ago",
      decision: "Flag BigQuery cost anomaly",
      reasoning: "Spend exceeded 3-sigma threshold. Memory matched Jul 15 ETL incident (88%). Auto-fix available but cost > $50 — requires approval.",
      outcome: "Awaiting approval",
      outcomeColor: "text-amber-600",
    },
    {
      time: "8h ago",
      decision: "Classify bastion egress as false positive",
      reasoning: "Traffic pattern matches scheduled backup window. Confidence 72% — below auto-execute threshold. Flagged for human review.",
      outcome: "Flagged",
      outcomeColor: "text-orange-600",
    },
    {
      time: "1d ago",
      decision: "Disable inactive IAM user",
      reasoning: "No login for 90+ days. No active service account keys. Memory shows 4 prior successful deactivations with 0 rollbacks.",
      outcome: "Executed",
      outcomeColor: "text-emerald-600",
    },
    {
      time: "2d ago",
      decision: "Apply CUD recommendation",
      reasoning: "12-month usage pattern stable. Projected savings $1,240/yr. Memory: 3 prior CUD applications, all within 5% of projected savings.",
      outcome: "Executed",
      outcomeColor: "text-emerald-600",
    },
  ],
};

export default data;
