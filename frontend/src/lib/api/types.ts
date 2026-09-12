/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Shared data types                               */
/*  Every API endpoint returns data shaped by one of these interfaces. */
/* ------------------------------------------------------------------ */

/* ── Command Center ─────────────────────────────────────────────────── */

export interface OpsScore {
  pillar: string;
  score: number | null;
  status: 'healthy' | 'warning' | 'critical' | 'active';
  note: string;
}

export interface AttentionItem {
  id: string;
  pillar: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  memory: string;
}

export interface ChangeItem {
  pillar: string;
  detail: string;
}

export interface WorkloadHealth {
  type: string;
  icon: string;
  count: number;
  healthy: number;
  warning: number;
  cost: number;
  lastIncident: string;
}

export interface MemoryPattern {
  name: string;
  occurrences: number;
  autoResolved: number;
  avgResolveMin: number;
  trend: 'improving' | 'stable' | 'new';
}

/* ── CloudOps ───────────────────────────────────────────────────────── */

export interface VmInstance {
  name: string;
  type: string;
  zone: string;
  cpu: number;
  memory: number;
  status: 'healthy' | 'warning' | 'stopped';
  cost: string;
  lastIncident: string;
}

export interface Incident {
  time: string;
  workload: string;
  resource: string;
  issue: string;
  resolution: string;
  duration: string;
  status: string;
  statusColor: string;
}

export interface ServerlessFunction {
  name: string;
  runtime: string;
  region: string;
  invocations: string;
  avgLatency: string;
  errorRate: string;
  cost: string;
}

export interface Pipeline {
  name: string;
  type: string;
  lastRun: string;
  duration: string;
  status: 'healthy' | 'warning';
  nextRun: string;
  cost: string;
}

/** GKE / Cloud Run estate — Tower B. */
export interface KubernetesCluster {
  name: string;
  project: string;
  mode: 'Standard' | 'Autopilot';
  env: 'Production' | 'Non-Production';
  version: string;
  nodes: number;
  pods: number;
  /** Node-pool utilisation, percent. */
  cpu: number;
  memory: number;
  status: 'healthy' | 'warning' | 'critical';
  cost: string;
  notes: string;
  lastEvent: string;
}

/** Cloud SQL estate — Tower C. */
export interface DatabaseInstance {
  name: string;
  engine: string;
  tier: string;
  /** Logical databases carried by the instance. */
  hosts: string;
  ha: boolean;
  pitr: boolean;
  connections: number;
  maxConnections: number;
  cpu: number;
  storageUsedGb: number;
  storageGb: number;
  status: 'healthy' | 'warning' | 'critical';
  cost: string;
  /** Set when a version upgrade is contractually required. */
  upgradeTo: string | null;
  lastEvent: string;
}

/* ── FinOps ─────────────────────────────────────────────────────────── */

export interface CostByPillar {
  pillar: string;
  cost: number;
  breakdown: string;
  memory: string;
  trend: number[];
}

export interface CostAnomaly {
  id: string;
  title: string;
  severity: 'active' | 'resolved' | 'false_positive';
  timeAgo: string;
  service: string;
  extra: string;
  memory: string;
  confidence: string | null;
  suggestedFix: string | null;
  timeline: string[];
}

export interface Optimization {
  title: string;
  appliedDate: string | null;
  savingsPerMonth: number;
  status: 'applied' | 'pending' | 'available';
  memory: string;
}

export interface MonthlyTrend {
  month: string;
  cost: number;
}

export interface Forecast {
  month: string;
  cost: number;
  note: string;
}

/* ── Cloud Security ─────────────────────────────────────────────────── */

export interface SecurityFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  resource: string;
  account: string;
  cisCheck: string;
  memoryCount: number;
  lastResolution: string;
  confidence: number;
  memoryNote: string;
  autoFixAvailable: boolean;
  actions: string[];
}

export interface IamIdentity {
  name: string;
  type: string;
  risk: 'high' | 'medium' | 'low';
  lastActive: string;
  memory: string;
}

export interface ComplianceFramework {
  name: string;
  pct: number;
  passing: number;
  failing: number;
  notAssessed: number;
  total: number;
}

export interface Remediation {
  date: string;
  finding: string;
  action: string;
  result: string;
  timeToResolve: string;
}

/* ── DevOps ─────────────────────────────────────────────────────────── */

export interface RiskScoredChange {
  time: string;
  resource: string;
  resourceType: string;
  changeType: string;
  risk: 'low' | 'medium' | 'high';
  memory: string;
}

export interface OrchestrationRequest {
  ticket: string;
  request: string;
  resource: string;
  provider: string;
  estCost: string;
  risk: 'low' | 'medium' | 'high';
  status: string;
  memory: string;
}

export interface PatchResource {
  resource: string;
  type: string;
  current: string;
  target: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  daysBehind: number;
  memory: string;
}

export interface DeployEvent {
  time: string;
  name: string;
  target: string;
  success: boolean;
  summary: string;
}

/* ── AIOps ──────────────────────────────────────────────────────────── */

export interface AiAgent {
  name: string;
  status: 'active' | 'investigating' | 'idle';
  description: string;
  lastAction: string;
  confidenceThreshold: number;
}

export interface AgentActivityEntry {
  time: string;
  agent: string;
  action: string;
  result: string;
}

export interface AuditTrailEntry {
  time: string;
  decision: string;
  reasoning: string;
  outcome: string;
}

/* ── Memory ─────────────────────────────────────────────────────────── */

export interface MemoryEntry {
  id: string;
  timestamp: string;
  pillar: string;
  confidence: number;
  title: string;
  context: string;
  learning: string;
  appliedCount: number;
  appliedNote?: string;
}

export interface IncidentPattern {
  name: string;
  occurrences: number;
  autoResolved: number;
  avgResolveMin: number;
  trend: 'improving' | 'stable' | 'new';
  bars: number[];
}

export interface RemediationLibraryEntry {
  fix: string;
  confidence: number;
  timesApplied: number;
  successRate: string;
  lastApplied: string;
  pillar: string;
}

export interface Learning {
  insight: string;
  crossPillar: string;
}

/* ── Assets ─────────────────────────────────────────────────────────── */

export interface Asset {
  name: string;
  subtitle: string;
  type: string;
  provider: string;
  region: string;
  state: string;
  cost: number;
  project: string;
  lastSeen: string;
}

/* ── Alerts ─────────────────────────────────────────────────────────── */

export interface Alert {
  id: string;
  title: string;
  severity: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  description: string;
  resource: string;
  time: string;
  type: string;
  baseline: string;
  current: string;
  increase: string;
}
