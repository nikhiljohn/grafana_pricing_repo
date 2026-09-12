/* ------------------------------------------------------------------ */
/*  Intellicore CMP — AIOps seed data                                 */
/*  Tenant: Shoppers Stop — eCommerce workloads.                      */
/*                                                                     */
/*  This is the layer that compresses squad hours. Each agent below    */
/*  maps to one service tower and automates the recurring, SOP-driven  */
/*  work that tower currently spends L1 hours on. The per-tower hour   */
/*  model lives in docs/SHOPPERSSTOP_TOWER_AUTOMATION.md — change      */
/*  both together.                                                     */
/*                                                                     */
/*  BYOK IS MANDATORY. Every agent here is contingent on the Client    */
/*  supplying and maintaining a valid Anthropic / OpenAI / Gemini API  */
/*  key [SOW §3.2, §4.10]. With no key, AI Hub features do not run and */
/*  the towers fall back to fully manual operation — which is the      */
/*  420-hour baseline, not the compressed one.                         */
/*                                                                     */
/*  Served by apiFetch() when no backend is configured.                */
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
      value: "7",
      sub: "one per service tower",
      icon: Bot,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      pulse: true,
    },
    {
      label: "Engineer-hours saved (30d)",
      value: "148",
      sub: "against a 420 hr/mo baseline",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      pulse: false,
    },
    {
      label: "Auto-resolved at L1 (30d)",
      value: "214",
      sub: "0 escalations reopened",
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      pulse: false,
    },
    {
      label: "Tokens Used (30d)",
      value: "1.24M",
      sub: "₹684 — billed to Client key (BYOK)",
      icon: Zap,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      pulse: false,
    },
    {
      label: "Memory Entries",
      value: "203",
      sub: "patterns, incidents, learnings",
      icon: Brain,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-200",
      pulse: false,
    },
  ],

  "/aiops/agents": [
    {
      name: "Tower A — Alert Triage Agent",
      status: "Active",
      statusColor: "bg-emerald-500",
      description:
        "Consumes Grafana and Dynatrace alerts across all 7 projects, classifies against Memory, opens the ITSM ticket with a proposed priority, and closes the ones that self-resolve. The L1 seat stops watching dashboards and only receives what survives triage.",
      lastAction: "Classified LB egress spike as a catalogue feed export — closed without paging (12h ago)",
      confidence: 89,
    },
    {
      name: "Tower B — GKE Health Agent",
      status: "Active",
      statusColor: "bg-emerald-500",
      description:
        "Watches pod restarts, node pressure and autoscaling events on both clusters plus Autopilot. Anything GKE repairs itself is logged, not paged. Escalates only cascading-failure signatures — the documented ss.com risk.",
      lastAction: "Autopilot pod eviction rescheduled in 90s — logged, no human action (9d ago)",
      confidence: 91,
    },
    {
      name: "Tower C — Database SOP Agent",
      status: "Active",
      statusColor: "bg-emerald-500",
      description:
        "Runs the weekly archival and backup-integrity SOPs inside the maintenance window, verifies the output, and escalates only on failure. Also tracks connection-pool and storage trend lines for early warning.",
      lastAction: "Weekly archival verified across 5 instances — 38 min, no escalation (4d ago)",
      confidence: 94,
    },
    {
      name: "Tower D — Deployment Agent",
      status: "Active",
      statusColor: "bg-emerald-500",
      description:
        "Reads the pre-approved release note, validates pre-conditions, runs the Jenkins pipeline inside the 02:00–05:00 window, executes the release-specific Magaz pod commands, then runs post-deploy health checks. Pages a human only when a check fails.",
      lastAction: "magento-release-r48 deployed + Magaz restart, 0 errors (Sep 11, 02:14)",
      confidence: 87,
    },
    {
      name: "Tower E — Windows VM SOP Agent",
      status: "Active",
      statusColor: "bg-emerald-500",
      description:
        "Executes the weekly restart of all 5 production Windows VMs and the post-restart curl validation per SOP, plus the nightly card-archival script. Pure SOP execution — this one needs no model at all, and retires with the Dec 2026 GKE migration.",
      lastAction: "5 VMs restarted + curl checks green by 02:41 (4d ago)",
      confidence: 97,
    },
    {
      name: "Tower F — Security Triage Agent",
      status: "Investigating",
      statusColor: "bg-amber-500",
      description:
        "Ranks all 65+ CSPM checks by exploitability against this estate rather than by raw severity, so the engineer works a top-N list instead of reviewing everything. Currently correlating the Keycloak CVE with the unconfirmed auth replacement decision.",
      lastAction: "Ranked Keycloak CVE above 6 higher-CVSS findings — live auth path (3h ago)",
      confidence: 86,
    },
    {
      name: "Tower G — FinOps Digest Agent",
      status: "Active",
      statusColor: "bg-emerald-500",
      description:
        "Drafts the bi-monthly cost report due on the 1st and 15th, with anomaly narratives and right-sizing recommendations already written up. The analyst edits and sends rather than authoring from raw billing data.",
      lastAction: "Drafted the 15 Sep report; flagged the storage egress anomaly as the lead item (6h ago)",
      confidence: 90,
    },
  ],

  "/aiops/activity": [
    {
      time: "3h ago",
      agent: "Tower F — Security Triage",
      action: "Re-ranked Keycloak 22.0.1 CVE to top of queue — sits on the live auth path for ss.com",
      result: "Escalated to L2",
      resultColor: "text-amber-600",
      resultBg: "bg-amber-50",
      icon: Clock,
    },
    {
      time: "6h ago",
      agent: "Tower G — FinOps Digest",
      action: "Drafted 15 Sep bi-monthly cost report with storage egress anomaly as lead item",
      result: "Awaiting analyst review",
      resultColor: "text-amber-600",
      resultBg: "bg-amber-50",
      icon: Clock,
    },
    {
      time: "12h ago",
      agent: "Tower A — Alert Triage",
      action: "Classified ss-nitrogen-lb-prod egress spike (3.1σ) as scheduled catalogue export",
      result: "Closed without paging",
      resultColor: "text-emerald-600",
      resultBg: "bg-emerald-50",
      icon: CheckCircle2,
    },
    {
      time: "1d ago",
      agent: "Tower C — Database SOP",
      action: "Projected ss-magento-db-01 connections to reach max in 9 days at current growth",
      result: "P3 raised proactively",
      resultColor: "text-emerald-600",
      resultBg: "bg-emerald-50",
      icon: Eye,
    },
    {
      time: "2d ago",
      agent: "Tower B — GKE Health",
      action: "Node pool memory at 81% — recommended pre-sale scale-up before the festive window",
      result: "Applied by L1",
      resultColor: "text-emerald-600",
      resultBg: "bg-emerald-50",
      icon: CheckCircle2,
    },
    {
      time: "4d ago",
      agent: "Tower E — Windows VM SOP",
      action: "Weekly restart ×5 + post-restart curl validation per SOP",
      result: "All healthy, zero touch",
      resultColor: "text-emerald-600",
      resultBg: "bg-emerald-50",
      icon: CheckCircle2,
    },
  ],

  "/aiops/quick-queries": [
    "Are we ready for the festive sale?",
    "What breaks if I upgrade MySQL to 8.4?",
    "Which findings actually matter on the checkout path?",
    "Why did the last release roll back?",
  ],

  "/aiops/tools": [
    {
      icon: Activity,
      title: "Pre-Sale Readiness Report",
      desc: "Go/no-go before each sale event: node headroom vs expected load, DB connection headroom, open blast-radius findings",
      usage: 4,
      usageLabel: "sale events assessed",
    },
    {
      icon: GitCompare,
      title: "MySQL 8.4 Dependency Map",
      desc: "Which services break if a schema changes — across Magento, SSO, Keycloak and CMS",
      usage: 6,
      usageLabel: "impact analyses run",
    },
    {
      icon: AlertTriangle,
      title: "Incident Assistant",
      desc: "Correlates a live incident with Memory of past resolutions on this estate",
      usage: 31,
      usageLabel: "incidents assisted",
    },
    {
      icon: ShieldAlert,
      title: "Remediation Playbook",
      desc: "Exact gcloud / Terraform per finding, scoped to the affected project",
      usage: 18,
      usageLabel: "playbooks generated",
    },
    {
      icon: DollarSign,
      title: "Cost Advisor",
      desc: "Right-sizing with ROI from past applications, and 30/60/90-day forecasts",
      usage: 11,
      usageLabel: "recommendations issued",
    },
    {
      icon: ClipboardCheck,
      title: "Compliance Reporter",
      desc: "One-click PCI-DSS, ISO 27001, CIS and NIST reports with live findings as evidence",
      usage: 5,
      usageLabel: "reports generated",
    },
  ],

  "/aiops/daily-tokens": [
    31, 44, 38, 52, 41, 22, 18, 47, 55, 49, 36, 61, 43, 25, 21, 58, 46, 39,
    64, 51, 28, 24, 69, 57, 42, 48, 33, 27, 72, 59,
  ],

  /** BYOK — these tokens bill to the Client's own LLM key [SOW §4.10]. */
  "/aiops/cost-by-feature": [
    { feature: "Alert triage (Tower A)", tokens: "412K", cost: "₹227", pct: 33, color: "bg-blue-500" },
    { feature: "Security triage (Tower F)", tokens: "298K", cost: "₹164", pct: 24, color: "bg-rose-500" },
    { feature: "Incident assistance", tokens: "211K", cost: "₹116", pct: 17, color: "bg-violet-500" },
    { feature: "Cost narratives (Tower G)", tokens: "149K", cost: "₹82", pct: 12, color: "bg-amber-500" },
    { feature: "Deployment validation (Tower D)", tokens: "112K", cost: "₹62", pct: 9, color: "bg-emerald-500" },
    { feature: "Reports", tokens: "58K", cost: "₹33", pct: 5, color: "bg-slate-400" },
  ],

  "/aiops/audit-trail": [
    {
      time: "3h ago",
      decision: "Escalate Keycloak CVE above 6 higher-CVSS findings",
      reasoning:
        "Ranked by exploitability against this estate, not raw CVSS. Keycloak sits on the live ss.com auth path; the higher-CVSS findings are in non-production. SOW §4.8 puts the Keycloak upgrade in scope explicitly.",
      outcome: "Escalated to L2",
      outcomeColor: "text-amber-600",
    },
    {
      time: "12h ago",
      decision: "Close LB egress alert without paging",
      reasoning:
        "Signature matched the scheduled catalogue feed export seen 4 times in 90d, all benign. Source subnet matched the export job, not the payment path. Memory confidence 91%. Threshold rebaselined rather than re-alerting.",
      outcome: "Closed automatically",
      outcomeColor: "text-emerald-600",
    },
    {
      time: "1d ago",
      decision: "Raise P3 on ss-magento-db-01 before any breach",
      reasoning:
        "Connections growing 14%/week against a 500 ceiling — nine days of headroom. Raising early puts it in a maintenance window instead of a 03:00 P1. Prior occurrence on this instance took 31 min to clear reactively.",
      outcome: "Ticket raised",
      outcomeColor: "text-emerald-600",
    },
    {
      time: "2d ago",
      decision: "Recommend pre-sale node scale-up, do not auto-apply",
      reasoning:
        "Memory at 81% with two nodes of headroom. Scaling is in scope [SOW §4.4] but changes cost, and all Searce-initiated changes need Client approval [SOW §3.2]. Recommended rather than executed.",
      outcome: "Approved and applied by L1",
      outcomeColor: "text-emerald-600",
    },
    {
      time: "4d ago",
      decision: "Execute weekly Windows VM restart unattended",
      reasoning:
        "Pure SOP execution with a deterministic curl validation step and an explicit rollback. 5 VMs, documented sequence, inside the agreed window. No model judgement involved — the agent runs the runbook.",
      outcome: "Executed, all healthy",
      outcomeColor: "text-emerald-600",
    },
  ],
};

export default data;
