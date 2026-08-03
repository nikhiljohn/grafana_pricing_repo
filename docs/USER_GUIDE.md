# Intellicore CMP — User Guide

## What is Intellicore CMP?

Intellicore CMP (Cloud Management Platform) is Searce's AI-native intelligence layer for managed cloud operations. Unlike traditional dashboards that show static data, Intellicore fuses **Operational Memory** — learnings from every past incident, resolution, and optimization — with five ops pillars to give your team context-aware intelligence.

**Managed by**: Searce CSRE (Cloud Solutions & Reliability Engineering) Squad

---

## Getting Started

### Signing In

1. Navigate to your Intellicore CMP instance URL
2. Enter your email and password on the login page
3. **First login**: You'll be prompted to set up two-factor authentication
   - Scan the QR code with Google Authenticator, Authy, or 1Password
   - Enter the 6-digit code to complete setup
4. **Subsequent logins**: Enter your 6-digit authenticator code
5. Check "Remember this device for 30 days" to skip TOTP on trusted devices

### Navigation

The left sidebar organizes Intellicore CMP into two sections:

**INTELLIGENCE** — Your five ops pillars + command center:
| Page | What It Shows |
|------|---------------|
| Command Center | Executive briefing across all pillars |
| CloudOps | Infrastructure health, workloads, incidents |
| FinOps | Cost intelligence, anomalies, optimization |
| SecOps | Security posture, findings, compliance |
| DevOps | Change intelligence, orchestration, patches |
| AIOps | AI agents, analysis tools, governance |

**REFERENCE** — Supporting views:
| Page | What It Shows |
|------|---------------|
| Assets / CMDB | Cloud resource inventory across providers |
| Alerts | Active, acknowledged, and resolved alerts |
| Memory | The platform's operational knowledge base |

---

## Command Center

The Command Center is your morning-briefing dashboard. It answers: *"What do I need to know right now?"*

### Intelligence Briefing

Five score cards show the health of each ops pillar:
- **Score** (0–100): Composite health metric
- **Status**: Healthy (green), Warning (amber), Critical (red), Active (blue for AIOps)
- **Note**: Brief context when something needs attention

### Needs Your Attention

Priority cards ranked by severity:
- **Red** — Critical: Immediate action required
- **Amber** — Warning: Investigate within hours
- **Blue** — Info: Awareness items

Each card includes a **Memory** section showing how similar situations were resolved before.

### What Changed — Last 24h

Per-pillar summary of recent changes across your cloud environment.

### Operational Memory — Patterns Detected

Table showing recurring patterns the platform has identified:
- **Occurrences**: How many times the pattern appeared
- **Auto-resolved**: How many were resolved without human intervention
- **Avg resolve time**: Mean time to resolution
- **Trend**: Improving, stable, or new pattern

### What's Working Well

Green checklist of healthy operational areas.

---

## CloudOps

### Workload Tabs

Switch between workload types using the top tabs:
- **All Workloads** — Overview across all types
- **Compute/VMs** — Virtual machine instances
- **Kubernetes** — GKE/EKS clusters and node pools
- **Databases** — Cloud SQL, AlloyDB, Spanner, etc.
- **Serverless** — Cloud Functions, Cloud Run, Lambda
- **Data & AI** — BigQuery, Dataflow, data pipelines

### Overview vs. Analysis

Each workload type has two sub-views:
- **Overview** — Current state, health indicators, resource details
- **Analysis** — Deeper metrics: CPU trends, memory utilization, network patterns

### Operational Memory

Every workload section includes a memory panel showing:
- Past incidents affecting this workload type
- How they were resolved
- Whether auto-remediation was applied

### Reading Instance Cards

Each instance shows:
- **Name** and **type** (machine type, node count, etc.)
- **Zone/Region**
- **CPU** and **Memory** utilization bars
- **Status**: Healthy, Warning, or Stopped
- **Monthly cost**
- **Last incident** with timestamp and resolution

Click an instance to expand its full detail panel with Memory context.

---

## FinOps

### Cost Intelligence

The primary tab showing:
- **Total monthly cost** with month-over-month trend
- **Cost by pillar** — breakdown across CloudOps, FinOps, SecOps, DevOps, AIOps
- **Sparklines** — 7-day cost trend per service category
- **Memory context** — what the platform remembers about cost patterns

### Active Anomalies

Cost anomalies detected with correlation to past patterns:
- **Severity badge**: Active (red), Resolved (green), False Positive (grey)
- **Memory correlation**: Percentage match to known patterns
- **Timeline**: When the anomaly started and its progression

### Optimization Memory

Historical optimizations with savings tracking:
- **Applied** — Optimizations already implemented with verified savings
- **Pending** — Recommended optimizations awaiting approval
- **Available** — New optimization opportunities identified

### Forecasting

Projected costs for the next 3 months based on trend analysis.

---

## SecOps

### Security Posture Score

Donut chart showing overall security health (0–100) with breakdown:
- Critical / High / Medium / Low finding counts

### Findings Intelligence

Security findings enriched with Memory:
- **CIS Benchmark** mapping (e.g., CIS 5.2 for SSH rules)
- **Memory count** — how many times this finding type was seen before
- **Last resolution** — what was done to fix it previously
- **Auto-fix confidence** — percentage confidence for automated remediation
- **Memory Note** — detailed resolution history from past incidents

### Severity Filtering

Filter findings by severity level using the filter bar.

### IAM Risk

Identity and access management risk analysis:
- Overprivileged service accounts
- Unused IAM roles
- Cross-project permissions

### Compliance

Framework compliance status:
- CIS Benchmarks
- SOC 2
- ISO 27001
- Progress bars showing passing/failing/not-assessed controls

### Remediation Memory

History of all remediations performed with outcomes.

---

## DevOps

### Change Intelligence

Risk-scored changes across your infrastructure:
- **Risk level**: High (red), Medium (amber), Low (green)
- **Change type**: Config change, scaling event, deployment, etc.
- **Memory context**: Similar changes and their outcomes

### Orchestration

Infrastructure change requests with approval workflow:
- Ticket reference
- Resource and provider
- Estimated cost impact
- Risk assessment
- Memory from similar past requests

### Patch Compliance

Resources needing updates:
- Current vs. target version
- Days behind
- Severity of the patch
- Memory from previous patching cycles

### Deployment Memory

Recent deployment history:
- Success/failure status
- Deployment target
- Summary of what changed
- Historical deployment patterns

---

## AIOps

### AI Agents

Three autonomous agents monitoring your infrastructure:
- **Status**: Active (processing), Investigating (deep analysis), Idle (monitoring)
- **Description**: What the agent does
- **Last action**: Most recent activity
- **Confidence threshold**: Minimum confidence to take automated action

### Query Infrastructure

Natural language query interface:
- Type questions about your infrastructure in plain English
- Quick query suggestions for common questions
- Results displayed inline

### AI Analysis Tools

Grid of specialized analysis capabilities:
- Root cause analysis
- Impact prediction
- Resource optimization
- Security threat modeling
- Cost forecasting
- Capacity planning

### Usage & Governance

AI usage tracking and governance controls:
- Token usage by agent
- Decision audit trail
- Confidence threshold management

---

## Memory

The Memory page is the platform's knowledge base — everything it has learned.

### All Memory

Searchable, filterable list of all memory entries:
- **Timestamp** — when the learning was recorded
- **Pillar** — which ops area it relates to
- **Confidence** — how reliable the memory is (0–100%)
- **Title** — what was learned
- **Applied count** — how many times this knowledge was reused

### Pillar Filter

Filter memories by ops pillar: All / CloudOps / FinOps / SecOps / DevOps

### Incident Patterns

Recurring patterns identified across incidents:
- **Occurrences** — total times the pattern appeared
- **Auto-resolved** — times the platform handled it automatically
- **Avg resolve time** — mean time to resolution
- **Trend** — whether the pattern is improving, stable, or new
- **Activity bars** — visual representation of pattern frequency

### Remediation Library

Proven fix scripts and procedures:
- **Confidence** — reliability score
- **Times applied** — usage count
- **Success rate** — percentage of successful applications
- **Last applied** — most recent use

### Learnings

Cross-pillar insights the platform has derived:
- Connections between different ops areas
- Emerging patterns that span multiple pillars

---

## Assets / CMDB

### Search and Filter

- **Search bar** — filter by asset name, type, or project
- **Provider tabs** — filter by cloud provider (All / GCP / AWS)
- **Sort** — by name, type, cost, or last seen

### Asset Cards

Each asset shows:
- **Name** and service subtitle
- **Type** — VM, Cluster, Bucket, Function, etc.
- **Provider** — GCP, AWS
- **Region**
- **State** — Running, Active, etc.
- **Monthly cost**
- **Project**
- **Last seen** — most recent activity timestamp

---

## Alerts

### Status Filters

- **All** — every alert
- **Active** — currently firing
- **Acknowledged** — team has seen it
- **Resolved** — no longer active

### Alert Cards

Each alert shows:
- **Severity** — Critical (red), Warning (amber), Info (blue)
- **Title** and **description**
- **Resource** affected
- **Time** — when the alert triggered
- **Type** — anomaly type

Click to expand for additional details:
- Baseline vs. current metric values
- Percentage increase
- Related context

---

## Top Bar

The persistent top bar provides:
- **Memory Search** — "Ask Memory anything about your cloud..." input
- **Notifications Bell** — alert indicator
- **User Profile** — shows your email and initials
- **Logout** — end your session

---

## Keyboard and Navigation

- All navigation is via the left sidebar
- Tab interfaces within pages switch content sections
- Search inputs filter data in real-time (local filtering)
- Cards expand/collapse for detail views

---

## For Administrators

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (frontend) |
| `API_URL_INTERNAL` | Backend URL for server components |
| `POSTGRES_*` | Database connection |
| `NEO4J_PASSWORD` | Graph database |
| `JWT_SECRET` | Session signing key |
| `ANTHROPIC_API_KEY` | Claude API for AI features |

### Deployment

Intellicore CMP deploys via Docker Compose with:
- **Caddy** — reverse proxy with automatic TLS
- **Next.js** — frontend (port 3000)
- **FastAPI** — backend (port 8000)
- **PostgreSQL** — relational data
- **Neo4j** — knowledge graph
- **Redis** — sessions and caching

See `deploy/gcp/README.md` for GCP deployment instructions.
