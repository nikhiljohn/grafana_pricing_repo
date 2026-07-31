/* ------------------------------------------------------------------ */
/*  Intellicore CMP — In-product user guide content                   */
/*  Rendered in Settings → User Guide. Data-driven so it stays easy    */
/*  to maintain alongside the product.                                 */
/* ------------------------------------------------------------------ */

export interface GuideFeature {
  title: string;
  body: string;
}

export interface GuideSection {
  id: string;
  title: string;
  intro: string;
  features: GuideFeature[];
}

export const guideSections: GuideSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    intro:
      "Intellicore CMP fuses Operational Memory with five ops pillars so every screen shows intelligence, not just data. It is managed alongside Searce's CSRE squad.",
    features: [
      {
        title: "Signing in",
        body: "Sign in with your email and password. On first login you set up two-factor authentication — scan the QR code with Google Authenticator, Authy, or 1Password, then enter the 6-digit code. On later logins you enter the code; tick “Remember this device” to skip it for 30 days.",
      },
      {
        title: "Navigation",
        body: "The left sidebar has two groups: INTELLIGENCE (Command Center + the five pillars) and REFERENCE (Assets/CMDB, Alerts, Memory). The top bar has a Memory search box, notifications, and your account menu.",
      },
      {
        title: "Bring your own AI key",
        body: "Every AI feature runs on your own LLM key. Go to Settings → AI Keys and add an Anthropic, OpenAI, or Gemini key. Keys are encrypted at rest and used only for your tenant. Nothing AI works until at least one key is set as active.",
      },
    ],
  },
  {
    id: "command-center",
    title: "Command Center",
    intro:
      "Your morning briefing. It answers: what do I need to know right now?",
    features: [
      {
        title: "Intelligence Briefing",
        body: "Five score cards (0–100) show the health of each pillar with status colours — healthy, warning, critical, or active for AIOps.",
      },
      {
        title: "Needs Your Attention",
        body: "Priority cards ranked by severity. Each carries a Memory note showing how a similar situation was resolved before.",
      },
      {
        title: "What Changed & Patterns",
        body: "A per-pillar summary of the last 24 hours, plus the recurring operational patterns Memory has detected with their auto-resolution rates.",
      },
    ],
  },
  {
    id: "cloudops",
    title: "CloudOps",
    intro:
      "Health and operational memory across every workload type — not just VMs.",
    features: [
      {
        title: "Workload tabs",
        body: "Switch between All Workloads, Compute/VMs, Kubernetes, Databases, Serverless, and Data & AI. Each has Overview and Analysis sub-views.",
      },
      {
        title: "Instance detail",
        body: "Each resource shows CPU/memory, status, monthly cost, and its last incident with resolution. Click a card to expand full detail with Memory context.",
      },
    ],
  },
  {
    id: "finops",
    title: "FinOps",
    intro: "Cost intelligence with anomalies correlated to past patterns.",
    features: [
      {
        title: "Cost Intelligence",
        body: "Total spend with trend, cost broken down by pillar, and 7-day sparklines per service category.",
      },
      {
        title: "Anomalies & Optimization",
        body: "Active cost anomalies show a Memory correlation (percentage match to known incidents). Optimization Memory tracks applied, pending, and available savings.",
      },
      {
        title: "Forecasting",
        body: "Projected spend for the next three months based on trend analysis.",
      },
    ],
  },
  {
    id: "secops",
    title: "Cloud Security",
    intro: "Cloud security posture and remediation memory across your cloud accounts.",
    features: [
      {
        title: "Findings Intelligence",
        body: "Cloud misconfigurations are mapped to CIS benchmarks and enriched with how many times the issue was seen and how it was fixed before, plus an auto-fix confidence score.",
      },
      {
        title: "IAM, Compliance & Remediation",
        body: "Review identity risk, framework compliance (CIS, SOC 2, ISO 27001), and the full history of past remediations and their outcomes.",
      },
    ],
  },
  {
    id: "devops",
    title: "DevOps",
    intro: "Change intelligence and deployment memory.",
    features: [
      {
        title: "Change & Orchestration",
        body: "Risk-scored changes with Memory context, plus infrastructure orchestration requests carrying cost impact, risk, and learnings from similar past requests.",
      },
      {
        title: "Patch & Deployment Memory",
        body: "Track resources behind on patches and the outcome history of recent deployments.",
      },
    ],
  },
  {
    id: "aiops",
    title: "AIOps",
    intro:
      "AI agents, natural-language infrastructure queries, and analysis tools — all powered by your own AI key.",
    features: [
      {
        title: "AI Agents",
        body: "Autonomous agents monitor your infrastructure with a confidence threshold that governs when they act automatically versus ask for approval.",
      },
      {
        title: "Query Infrastructure",
        body: "Ask questions about your cloud in plain English. Requires an active AI key in Settings → AI Keys.",
      },
      {
        title: "Analysis Tools & Governance",
        body: "Run specialised analyses (root cause, impact prediction, optimization) and review the AI decision audit trail and token usage.",
      },
    ],
  },
  {
    id: "memory",
    title: "Memory",
    intro:
      "The platform's knowledge base — everything it has learned, reusable across pillars.",
    features: [
      {
        title: "Entries & Patterns",
        body: "Searchable memory entries with a confidence score and how often each learning was reused, plus recurring incident patterns and their trends.",
      },
      {
        title: "Remediation Library & Learnings",
        body: "Proven fix scripts with success rates, and cross-pillar insights the platform has derived.",
      },
    ],
  },
  {
    id: "reference",
    title: "Assets, Alerts & Search",
    intro: "Supporting reference views.",
    features: [
      {
        title: "Assets / CMDB",
        body: "Searchable, filterable inventory of cloud resources across GCP and AWS with type, region, cost, and last-seen.",
      },
      {
        title: "Alerts",
        body: "Filter alerts by status (Active, Acknowledged, Resolved) and expand any card for baseline-vs-current detail.",
      },
      {
        title: "Memory search",
        body: "The top-bar search lets you ask Memory anything about your cloud (AI key required).",
      },
    ],
  },
];
