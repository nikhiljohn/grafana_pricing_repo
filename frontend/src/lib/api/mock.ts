/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Mock data provider                              */
/*  Maps API endpoint paths to realistic data extracted from the page  */
/*  components.  When the real backend is ready, only client.ts needs  */
/*  to change — the shapes stay identical.                             */
/* ------------------------------------------------------------------ */

import type {
  OpsScore,
  AttentionItem,
  ChangeItem,
  WorkloadHealth,
  MemoryPattern,
  VmInstance,
  Incident,
  ServerlessFunction,
  Pipeline,
  CostByPillar,
  CostAnomaly,
  Optimization,
  MonthlyTrend,
  Forecast,
  SecurityFinding,
  IamIdentity,
  ComplianceFramework,
  Remediation,
  RiskScoredChange,
  OrchestrationRequest,
  PatchResource,
  DeployEvent,
  AiAgent,
  AgentActivityEntry,
  AuditTrailEntry,
  MemoryEntry,
  IncidentPattern,
  RemediationLibraryEntry,
  Learning,
  Asset,
  Alert,
} from './types';

/* ================================================================== */
/*  Command Center                                                     */
/* ================================================================== */

const commandCenterScores: OpsScore[] = [
  { pillar: 'CloudOps', score: 94, status: 'healthy', note: '' },
  { pillar: 'FinOps', score: 78, status: 'warning', note: 'cost anomaly detected' },
  { pillar: 'SecOps', score: 89, status: 'healthy', note: '' },
  { pillar: 'DevOps', score: 96, status: 'healthy', note: '' },
  { pillar: 'AIOps', score: null, status: 'active', note: '3 agents running' },
];

const commandCenterAttention: AttentionItem[] = [
  {
    id: 'att-1',
    pillar: 'SecOps',
    severity: 'critical',
    title: '5 security groups allow SSH from internet (CIS 5.2)',
    memory: 'Similar finding resolved across 3 accounts last month → remediation script available',
  },
  {
    id: 'att-2',
    pillar: 'FinOps',
    severity: 'warning',
    title: 'BigQuery cost spike +340% in last 4h',
    memory: 'Matches Jul 15 ETL spike pattern. Root cause last time: unoptimized JOIN on 2TB table. Suggested fix: apply same query optimization',
  },
  {
    id: 'att-3',
    pillar: 'CloudOps',
    severity: 'warning',
    title: 'Bastion-Host network egress anomalous (3.3σ)',
    memory: 'Last occurrence was a false positive from backup job. Confidence: 72% false positive',
  },
  {
    id: 'att-4',
    pillar: 'DevOps',
    severity: 'info',
    title: '4 orchestration requests pending approval',
    memory: 'Oldest: 2h (CL-36: GCP VM provision, est. $45/mo, low risk)',
  },
];

const commandCenterChanges: ChangeItem[] = [
  { pillar: 'CloudOps', detail: '23 VMs stable, 1 auto-scaled (clens-dev CPU spike → e2-standard-4, resolved 8 min)' },
  { pillar: 'FinOps', detail: '$637 current month spend, +8% MoM. BigQuery anomaly flagged.' },
  { pillar: 'SecOps', detail: '342 findings, 12 are recurrences of resolved patterns. Posture score: 89 → 87 (2 new SSH groups)' },
  { pillar: 'DevOps', detail: '47 deployments, 0 failures. Patch compliance: 78% (3 critical pending)' },
  { pillar: 'AIOps', detail: '847 tokens used, 3 auto-remediations triggered, 2 successful' },
];

const commandCenterWorkloads: WorkloadHealth[] = [
  { type: 'Compute / VMs', icon: 'server', count: 23, healthy: 21, warning: 2, cost: 368, lastIncident: 'CPU spike on clens-dev (3d ago, auto-resolved)' },
  { type: 'Kubernetes', icon: 'k8s', count: 0, healthy: 0, warning: 0, cost: 0, lastIncident: 'No clusters discovered' },
  { type: 'Databases', icon: 'database', count: 1, healthy: 1, warning: 0, cost: 15, lastIncident: 'Connection pool exhaustion (7d ago, resolved)' },
  { type: 'Serverless', icon: 'lambda', count: 12, healthy: 12, warning: 0, cost: 86, lastIncident: 'Cold start latency >2s (14d ago, mitigated with min instances)' },
  { type: 'Data & AI', icon: 'brain', count: 3, healthy: 2, warning: 1, cost: 28, lastIncident: 'BigQuery slot exhaustion (5d ago, auto-scaled)' },
];

const commandCenterMemoryPatterns: MemoryPattern[] = [
  { name: 'CPU spike before auto-scale', occurrences: 7, autoResolved: 100, avgResolveMin: 8, trend: 'stable' },
  { name: 'BigQuery ETL cost spike', occurrences: 3, autoResolved: 67, avgResolveMin: 22, trend: 'new' },
  { name: 'SSH security group creation', occurrences: 12, autoResolved: 100, avgResolveMin: 2, trend: 'improving' },
  { name: 'Connection pool exhaustion', occurrences: 2, autoResolved: 50, avgResolveMin: 18, trend: 'new' },
  { name: 'Friday deployment failures', occurrences: 5, autoResolved: 0, avgResolveMin: 0, trend: 'stable' },
];

/* ================================================================== */
/*  CloudOps                                                           */
/* ================================================================== */

const cloudopsWorkloads: VmInstance[] = [
  { name: 'clens-dev', type: 'e2-standard-2', zone: 'asia-south1-c', cpu: 87, memory: 72, status: 'warning', cost: '$54', lastIncident: 'CPU spike 95% (3d ago)' },
  { name: 'cloudlens-dev-new', type: 'e2-standard-2', zone: 'asia-south1-c', cpu: 45, memory: 61, status: 'healthy', cost: '$54', lastIncident: 'None' },
  { name: 'connectiq', type: 'e2-medium', zone: 'us-central1-a', cpu: 32, memory: 48, status: 'healthy', cost: '$34', lastIncident: 'None' },
  { name: 'cl-icore', type: 'e2-standard-4', zone: 'asia-south1-b', cpu: 56, memory: 70, status: 'healthy', cost: '$107', lastIncident: 'None' },
  { name: 'bastion-host', type: 'e2-micro', zone: 'us-central1-a', cpu: 12, memory: 34, status: 'healthy', cost: '$8', lastIncident: 'Egress anomaly (21d ago)' },
  { name: 'monitoring-agent', type: 'e2-small', zone: 'asia-south1-c', cpu: 28, memory: 55, status: 'stopped', cost: '$0', lastIncident: 'None' },
];

const cloudopsIncidents: Incident[] = [
  { time: '3d ago', workload: 'Compute', resource: 'clens-dev', issue: 'CPU utilization 95% sustained', resolution: 'Auto-scaled to e2-standard-4, load balanced', duration: '8 min', status: 'Resolved', statusColor: 'bg-green-50 text-green-700' },
  { time: '5d ago', workload: 'Data & AI', resource: 'BigQuery pipeline', issue: 'Slot exhaustion during ETL', resolution: 'Autoscaling slots enabled, query optimized', duration: '22 min', status: 'Resolved', statusColor: 'bg-green-50 text-green-700' },
  { time: '7d ago', workload: 'Database', resource: 'pgsql', issue: 'Connection pool max (100) hit', resolution: 'Pool size increased to 200, connection leak fixed', duration: '18 min', status: 'Resolved', statusColor: 'bg-green-50 text-green-700' },
  { time: '14d ago', workload: 'Serverless', resource: 'process-orders', issue: 'Cold start >2s (p99)', resolution: 'Min instances set to 3, memory increased to 512MB', duration: 'N/A (config)', status: 'Mitigated', statusColor: 'bg-blue-50 text-blue-700' },
  { time: '21d ago', workload: 'Compute', resource: 'bastion-host', issue: 'Network egress anomaly 170k+', resolution: 'Traffic analyzed — legitimate backup job, alert threshold adjusted', duration: '4 min', status: 'False positive', statusColor: 'bg-slate-100 text-slate-600' },
];

const cloudopsServerless: ServerlessFunction[] = [
  { name: 'process-orders', runtime: 'Node.js 20', region: 'us-central1', invocations: '4,218', avgLatency: '132ms', errorRate: '0.02%', cost: '$24' },
  { name: 'send-notifications', runtime: 'Python 3.12', region: 'us-central1', invocations: '2,891', avgLatency: '89ms', errorRate: '0%', cost: '$18' },
  { name: 'resize-images', runtime: 'Go 1.22', region: 'asia-south1', invocations: '1,456', avgLatency: '245ms', errorRate: '0.01%', cost: '$15' },
  { name: 'sync-inventory', runtime: 'Node.js 20', region: 'us-central1', invocations: '812', avgLatency: '178ms', errorRate: '0%', cost: '$12' },
  { name: 'webhook-handler', runtime: 'Python 3.12', region: 'europe-west1', invocations: '3,344', avgLatency: '56ms', errorRate: '0%', cost: '$10' },
  { name: 'data-export', runtime: 'Node.js 20', region: 'us-central1', invocations: '96', avgLatency: '1,120ms', errorRate: '0%', cost: '$7' },
];

const cloudopsPipelines: Pipeline[] = [
  { name: 'etl-daily', type: 'Dataflow', lastRun: 'Today 06:00', duration: '42 min', status: 'healthy', nextRun: 'Tomorrow 06:00', cost: '$12' },
  { name: 'ml-training-weekly', type: 'Vertex AI', lastRun: 'Jul 28, 02:00', duration: '3h 18 min', status: 'warning', nextRun: 'Aug 4, 02:00', cost: '$11' },
  { name: 'data-export-hourly', type: 'BigQuery', lastRun: 'Today 11:00', duration: '8 min', status: 'healthy', nextRun: 'Today 12:00', cost: '$5' },
];

/* ================================================================== */
/*  FinOps                                                             */
/* ================================================================== */

const finopsCosts: CostByPillar[] = [
  { pillar: 'CloudOps', cost: 368, breakdown: 'Compute $280, Networking $58, Storage $30', memory: 'Committed use discounts saved $67/mo on project A since applying in May. Compute costs stabilized after right-sizing in April.', trend: [290, 310, 320, 340, 355, 368] },
  { pillar: 'FinOps overhead', cost: 0, breakdown: 'Platform cost absorbed in MRR', memory: 'No direct cost. FinOps tooling and analysis overhead is included in Searce managed services MRR.', trend: [0, 0, 0, 0, 0, 0] },
  { pillar: 'SecOps', cost: 42, breakdown: 'SCC Premium, Wiz', memory: 'Stable, no anomalies. SCC Premium enabled since Feb. Wiz license fixed cost, renews in Q1.', trend: [40, 41, 42, 42, 42, 42] },
  { pillar: 'DevOps', cost: 86, breakdown: 'Cloud Build, Artifact Registry, Functions', memory: 'Switched to 2nd gen Functions in June, saved $12/mo on cold starts. Build minutes stable after caching improvements.', trend: [95, 98, 96, 94, 98, 86] },
  { pillar: 'AIOps', cost: 28, breakdown: 'Vertex AI, BigQuery ML', memory: 'Active anomaly on BigQuery (see above). Vertex AI spend growing with increased model training runs. Review reserved slots by Q4.', trend: [18, 20, 22, 24, 25, 28] },
];

const finopsAnomalies: CostAnomaly[] = [
  {
    id: 'anom-1',
    title: 'BigQuery cost spike: +340% in last 4 hours',
    severity: 'active',
    timeAgo: '4 hours ago',
    service: 'BigQuery',
    extra: '$42 estimated overspend',
    memory: 'This matches the ETL spike pattern from Jul 15 (30d ago). That incident cost $42 extra and was caused by an unoptimized JOIN on the 2TB analytics.events table. The query scanned the full table instead of using the _PARTITIONDATE filter. Resolution on Jul 15: Added partition filter and optimized JOIN, reducing scan from 2TB to 45GB. Processing time dropped from 8min to 22sec.',
    confidence: '88% same root cause',
    suggestedFix: 'Apply same partition filter to current query pipeline. The offending query is in the nightly ETL DAG (airflow-prod/dags/etl_analytics.py, line 142).',
    timeline: [
      'Jul 30 02:00 — ETL DAG triggered (normal schedule)',
      'Jul 30 02:04 — BigQuery scan exceeded 1TB threshold',
      'Jul 30 02:12 — Cost anomaly detected by Intellicore',
      'Jul 30 02:15 — Pattern matched to Jul 15 incident (88% confidence)',
    ],
  },
  {
    id: 'anom-2',
    title: 'Compute Engine egress +85% WoW',
    severity: 'resolved',
    timeAgo: '5 days ago',
    service: 'Compute Engine',
    extra: 'Resolved in 2h',
    memory: 'Cross-region replication job was running without compression between us-central1 and europe-west1. The backup sync for project-b was transferring ~180GB/day uncompressed. Resolution: Added gzip compression to the replication pipeline, reducing transfer to ~35GB/day. Egress normalized within 2 hours of applying the fix.',
    confidence: null,
    suggestedFix: null,
    timeline: [
      'Jul 25 08:00 — Egress anomaly detected (+85% vs 7-day avg)',
      'Jul 25 08:30 — Root cause identified: uncompressed cross-region replication',
      'Jul 25 09:15 — Compression applied to replication pipeline',
      'Jul 25 10:00 — Egress normalized, anomaly resolved',
    ],
  },
  {
    id: 'anom-3',
    title: 'Cloud Storage class mismatch',
    severity: 'false_positive',
    timeAgo: '14 days ago',
    service: 'Cloud Storage',
    extra: 'Partial action taken',
    memory: 'Flagged 14 Standard class buckets with <1 access/month as candidates for Nearline. Analysis showed 8 of 14 are compliance-required hot storage (SOC2 audit logs, PCI transaction records) that must remain in Standard class per policy. 6 buckets moved to Nearline ($12/mo saved), 8 kept as Standard with documented justification.',
    confidence: null,
    suggestedFix: null,
    timeline: [
      'Jul 16 — 14 buckets flagged for storage class mismatch',
      'Jul 17 — Analysis revealed 8 compliance-required buckets',
      'Jul 18 — 6 eligible buckets moved to Nearline',
      'Jul 18 — Detection rules updated to exclude compliance tags',
    ],
  },
];

const finopsOptimizations: Optimization[] = [
  { title: 'Committed use discount on Compute Engine', appliedDate: 'May 12', savingsPerMonth: 67, status: 'applied', memory: 'ROI breakeven reached in 3 weeks. 1-year CUD on n2-standard-8 for project-a production workloads.' },
  { title: 'Switch Cloud Functions to 2nd gen', appliedDate: 'Jun 3', savingsPerMonth: 12, status: 'applied', memory: 'Cold start p99 also improved 2.1s to 340ms. Migrated 14 functions across 3 services with zero downtime.' },
  { title: 'Delete 3 unattached persistent disks', appliedDate: 'Jun 15', savingsPerMonth: 18, status: 'applied', memory: 'Disks were orphaned after VM migration in May. 2x 200GB SSD + 1x 500GB standard. No snapshots referenced them.' },
  { title: 'Right-size clens-dev to e2-standard-4', appliedDate: 'Jul 27', savingsPerMonth: 8, status: 'applied', memory: 'Applied after CPU spike incident on Jul 25. Peak usage was only 22% on previous e2-standard-8. Downsized with zero performance impact.' },
  { title: 'Apply partition filter to BigQuery ETL', appliedDate: null, savingsPerMonth: 42, status: 'pending', memory: 'Same fix resolved Jul 15 spike. Current ETL pipeline scans full 2TB table on each run. Adding partition filter would reduce scan to ~45GB.' },
  { title: 'Cloud SQL committed use discount', appliedDate: null, savingsPerMonth: 22, status: 'available', memory: 'Requires 1-yr commitment, payback in 4 months. db-custom-4-16384 instance running 24/7 for 11 months. Usage pattern is stable.' },
  { title: 'Lifecycle policies on 14 Storage buckets', appliedDate: null, savingsPerMonth: 12, status: 'available', memory: 'Standard class with <1 access/month identified for Nearline. 8 of 14 buckets are compliance-required hot storage (excluded). 6 eligible buckets total 1.8TB.' },
];

const finopsMonthlyTrend: MonthlyTrend[] = [
  { month: 'Feb', cost: 480 },
  { month: 'Mar', cost: 520 },
  { month: 'Apr', cost: 510 },
  { month: 'May', cost: 560 },
  { month: 'Jun', cost: 590 },
  { month: 'Jul', cost: 637 },
];

const finopsForecast: Forecast[] = [
  { month: 'Aug', cost: 680, note: 'Assumes BigQuery anomaly resolved and partition filter applied. Compute stable with existing CUDs.' },
  { month: 'Sep', cost: 650, note: 'CUD savings fully amortized + Cloud SQL CUD applied. Functions optimization running full month.' },
  { month: 'Oct', cost: 620, note: 'All available recommendations applied. Storage lifecycle policies in effect for full billing cycle.' },
];

/* ================================================================== */
/*  SecOps                                                             */
/* ================================================================== */

const secopsFindings: SecurityFinding[] = [
  {
    id: 'sec-1', severity: 'critical',
    title: "Security group 'Testing-SSH-Demo' allows SSH from internet",
    resource: 'Testing-SSH-Demo', account: '010863548913', cisCheck: 'CIS 5.2',
    memoryCount: 12, lastResolution: 'Restricted to VPN CIDR 10.0.0.0/8',
    confidence: 96, memoryNote: 'Resolved 12 times across 3 accounts. Last fix: Restricted to VPN CIDR 10.0.0.0/8. Auto-fix confidence: 96%',
    autoFixAvailable: true, actions: ['Auto-Fix', 'Investigate'],
  },
  {
    id: 'sec-2', severity: 'critical',
    title: "Security group 'launch-wizard-110' allows SSH from internet",
    resource: 'launch-wizard-110', account: '010863548913', cisCheck: 'CIS 5.2',
    memoryCount: 12, lastResolution: 'Restricted to VPN CIDR 10.0.0.0/8',
    confidence: 96, memoryNote: 'Same pattern — auto-fix will apply identical CIDR restriction',
    autoFixAvailable: true, actions: ['Auto-Fix'],
  },
  {
    id: 'sec-3', severity: 'critical',
    title: "S3 bucket 'testhydpdf' public access not blocked",
    resource: 'testhydpdf', account: '010863548913', cisCheck: 'CIS 2.1.2',
    memoryCount: 5, lastResolution: 'Enable Block Public Access',
    confidence: 94, memoryNote: 'Resolved 5 times. Fix: Enable Block Public Access. No data access impact in past applications.',
    autoFixAvailable: true, actions: ['Auto-Fix'],
  },
  {
    id: 'sec-4', severity: 'high',
    title: "Cloud SQL instance 'pgsql' allows public connections",
    resource: 'pgsql', account: 'searce-sandbox', cisCheck: 'CIS 6.5',
    memoryCount: 0, lastResolution: '',
    confidence: 45, memoryNote: 'First occurrence. Similar finding on AWS RDS resolved by adding authorized networks only.',
    autoFixAvailable: false, actions: ['Investigate'],
  },
  {
    id: 'sec-5', severity: 'high',
    title: "IAM user 'deploy-bot' has admin privileges",
    resource: 'deploy-bot', account: 'searce-sandbox', cisCheck: 'CIS 1.16',
    memoryCount: 8, lastResolution: 'Create custom role with least-privilege',
    confidence: 88, memoryNote: 'Over-privileged service accounts found 8 times. Resolution: Create custom role with least-privilege. Avg time to resolve: 25 min.',
    autoFixAvailable: true, actions: ['Generate Role'],
  },
  {
    id: 'sec-6', severity: 'medium',
    title: 'Cloud Storage bucket missing lifecycle policy',
    resource: '14 buckets', account: 'searce-sandbox', cisCheck: 'CIS 2.2',
    memoryCount: 6, lastResolution: 'Moved to Nearline storage class',
    confidence: 72, memoryNote: '6 of 14 moved to Nearline in Jun (FinOps finding). 8 require Standard for compliance.',
    autoFixAvailable: false, actions: ['Review'],
  },
  {
    id: 'sec-7', severity: 'medium',
    title: 'Logging not enabled on 3 VPC networks',
    resource: '3 VPC networks', account: 'searce-sandbox', cisCheck: 'CIS 3.7',
    memoryCount: 0, lastResolution: '',
    confidence: 0, memoryNote: 'New finding. No prior resolution history.',
    autoFixAvailable: false, actions: ['Investigate'],
  },
];

const secopsIam: IamIdentity[] = [
  { name: 'deploy-bot', type: 'Service Account', risk: 'high', lastActive: '2h ago', memory: 'Admin since creation. Memory: 8 similar cases resolved with custom roles.' },
  { name: 'ci-pipeline', type: 'Service Account', risk: 'medium', lastActive: '1d ago', memory: 'Has storage.admin, only uses storage.objectViewer' },
  { name: 'test-user@searce.com', type: 'User', risk: 'medium', lastActive: '30d ago', memory: 'Inactive. Memory: Inactive users disabled after 90d per policy.' },
  { name: 'backup-sa', type: 'Service Account', risk: 'low', lastActive: '6h ago', memory: 'Appropriately scoped' },
  { name: 'monitoring-sa', type: 'Service Account', risk: 'low', lastActive: '1h ago', memory: 'Appropriately scoped' },
];

const secopsCompliance: ComplianceFramework[] = [
  { name: 'CIS Benchmark v1.4', pct: 89, passing: 38, failing: 5, notAssessed: 0, total: 43 },
  { name: 'NIST 800-53', pct: 84, passing: 92, failing: 18, notAssessed: 10, total: 120 },
  { name: 'ISO 27001', pct: 91, passing: 104, failing: 10, notAssessed: 0, total: 114 },
];

const secopsRemediations: Remediation[] = [
  { date: 'Jul 27', finding: 'SSH groups (3 accounts)', action: 'Restricted to VPN CIDR', result: 'All resolved', timeToResolve: '12 min' },
  { date: 'Jul 20', finding: 'S3 public access (2 buckets)', action: 'Block Public Access enabled', result: 'Resolved, no impact', timeToResolve: '5 min' },
  { date: 'Jun 15', finding: 'Over-privileged SA (deploy-bot-2)', action: 'Custom role created', result: 'Resolved', timeToResolve: '25 min' },
  { date: 'Jun 3', finding: 'Logging disabled on VPCs', action: 'Enabled VPC flow logs', result: 'Resolved, +$3/mo cost', timeToResolve: '8 min' },
  { date: 'May 22', finding: 'IAM inactive users (4)', action: 'Disabled after review', result: 'Resolved', timeToResolve: '15 min' },
];

/* ================================================================== */
/*  DevOps                                                             */
/* ================================================================== */

const devopsChanges: RiskScoredChange[] = [
  { time: '2h ago', resource: 'clens-dev', resourceType: 'VM', changeType: 'Machine type changed', risk: 'low', memory: 'Memory: Auto-scaled after CPU spike. This is a known recovery pattern.' },
  { time: '4h ago', resource: 'deploy-bot', resourceType: 'IAM', changeType: 'Role binding added', risk: 'high', memory: 'Memory: IAM changes are flagged. deploy-bot already over-privileged (see SecOps).' },
  { time: '6h ago', resource: 'etl-pipeline', resourceType: 'BigQuery', changeType: 'Query pattern changed', risk: 'medium', memory: 'Memory: New query matches pattern that caused Jul 15 cost spike.' },
  { time: '8h ago', resource: 'process-orders', resourceType: 'Function', changeType: 'Min instances set to 3', risk: 'low', memory: 'Memory: Cold start mitigation from incident 14d ago.' },
  { time: '12h ago', resource: 'pgsql', resourceType: 'Cloud SQL', changeType: 'Connection pool increased', risk: 'low', memory: 'Memory: Post-incident fix for connection exhaustion 7d ago.' },
  { time: '18h ago', resource: 'bastion-host', resourceType: 'VM', changeType: 'Firewall rule updated', risk: 'medium', memory: 'Memory: Egress alert was false positive. Rule adjusted to exclude backup CIDR.' },
  { time: '1d ago', resource: 'testhydpdf', resourceType: 'S3', changeType: 'Bucket policy modified', risk: 'high', memory: 'Memory: This bucket has public access finding (CIS 2.1.2). Change needs review.' },
];

const devopsOrchestration: OrchestrationRequest[] = [
  { ticket: 'CL-36', request: 'Provision VM', resource: 'e2-standard-2', provider: 'GCP', estCost: '$45/mo', risk: 'low', status: 'Pending approval', memory: 'Memory: Similar VMs provisioned 12 times. Avg approval time: 1.5h' },
  { ticket: 'CL-35', request: 'Create GCS bucket', resource: 'Standard', provider: 'GCP', estCost: '$2/mo', risk: 'low', status: 'Pending', memory: 'Memory: Recommend lifecycle policy at creation (FinOps learning)' },
  { ticket: 'CL-34', request: 'Add IAM role', resource: 'Editor', provider: 'GCP', estCost: '—', risk: 'high', status: 'Pending', memory: 'Memory: Editor role is over-privileged. Suggest custom role (SecOps learning)' },
  { ticket: 'CL-33', request: 'Scale Cloud Run', resource: '10 instances', provider: 'GCP', estCost: '$120/mo', risk: 'medium', status: 'Pending', memory: 'Memory: Current traffic doesn\'t justify 10 instances. Suggest autoscaler.' },
  { ticket: 'CL-32', request: 'Delete old snapshots', resource: '—', provider: 'GCP', estCost: '-$8/mo', risk: 'low', status: 'Completed', memory: 'Memory: 14 snapshots deleted, matching FinOps recommendation' },
];

const devopsPatches: PatchResource[] = [
  { resource: 'clens-dev', type: 'VM (Ubuntu)', current: '22.04.4', target: '22.04.5', severity: 'critical', daysBehind: 12, memory: 'Memory: Last patched during maintenance window. Requires reboot.' },
  { resource: 'bastion-host', type: 'VM (Ubuntu)', current: '22.04.3', target: '22.04.5', severity: 'critical', daysBehind: 28, memory: 'Memory: Patch delayed due to egress investigation. Safe to proceed now.' },
  { resource: 'pgsql', type: 'Cloud SQL', current: 'POSTGRES_17', target: 'POSTGRES_18', severity: 'high', daysBehind: 45, memory: 'Memory: Major version upgrade. Tested on staging 30d ago — no issues.' },
  { resource: 'connectiq', type: 'VM (Debian)', current: '11.9', target: '12.0', severity: 'medium', daysBehind: 60, memory: 'Memory: Debian 12 upgrade requires app compatibility testing.' },
  { resource: 'monitoring-agent', type: 'VM', current: '22.04.4', target: '22.04.5', severity: 'low', daysBehind: 5, memory: 'Memory: Non-critical, scheduled for next maintenance window.' },
];

const devopsDeployments: DeployEvent[] = [
  { time: 'Today 09:14', name: 'deploy-frontend', target: 'Cloud Run', success: true, summary: 'v2.8.1 rolled out. 0 errors in canary.' },
  { time: 'Today 07:30', name: 'terraform-apply', target: 'Infra', success: true, summary: 'Added monitoring dashboard. No drift detected.' },
  { time: 'Yesterday 18:45', name: 'deploy-api', target: 'Cloud Run', success: true, summary: 'v3.2.0 with new /orders endpoint. Latency stable.' },
  { time: 'Yesterday 14:20', name: 'patch-bastion', target: 'VM', success: false, summary: 'Patch failed — egress firewall blocked apt update. Rolled back.' },
  { time: 'Yesterday 10:00', name: 'deploy-etl', target: 'Dataflow', success: true, summary: 'Pipeline v1.4 — added dedup stage. Throughput +12%.' },
  { time: 'Jul 28 16:30', name: 'scale-cloud-run', target: 'Cloud Run', success: true, summary: 'Auto-scaled to 8 instances during traffic spike.' },
  { time: 'Jul 28 11:15', name: 'terraform-apply', target: 'Infra', success: false, summary: 'State lock conflict. Resolved after 3 min retry.' },
  { time: 'Jul 27 09:00', name: 'deploy-ml-model', target: 'Vertex AI', success: true, summary: 'Model v2.1 deployed. Accuracy 94.2% on validation set.' },
];

/* ================================================================== */
/*  AIOps                                                              */
/* ================================================================== */

const aiopsAgents: AiAgent[] = [
  {
    name: 'Security Auto-Remediation Agent',
    status: 'active',
    description: 'Monitoring 342 findings. 23 auto-remediated in 30d. Currently watching: SSH security group creation events.',
    lastAction: 'Restricted SSH group to VPN CIDR (2h ago)',
    confidenceThreshold: 85,
  },
  {
    name: 'Cost Anomaly Agent',
    status: 'investigating',
    description: 'Detected BigQuery +340% spike. Correlating with Memory: matches Jul 15 ETL pattern (88% confidence). Awaiting human approval for fix.',
    lastAction: 'Flagged anomaly, generated fix recommendation (4h ago)',
    confidenceThreshold: 88,
  },
  {
    name: 'Predictive Operations Agent',
    status: 'active',
    description: 'Monitoring 11 metrics across 5 instances. 1 critical anomaly (bastion-host egress). 4 trending toward breach in 22d.',
    lastAction: 'Updated trend prediction for clens-dev CPU (12h ago)',
    confidenceThreshold: 92,
  },
];

const aiopsActivity: AgentActivityEntry[] = [
  { time: '2h ago', agent: 'Security Agent', action: "Auto-restricted SSH group 'launch-wizard-111' to VPN CIDR", result: 'Success' },
  { time: '4h ago', agent: 'Cost Agent', action: 'Detected BigQuery anomaly, generated remediation plan', result: 'Awaiting approval' },
  { time: '8h ago', agent: 'Predictive Agent', action: 'Bastion-host egress classified as false positive (72% confidence)', result: 'Flagged for review' },
  { time: '1d ago', agent: 'Security Agent', action: 'Disabled inactive IAM user test-user@searce.com', result: 'Success' },
  { time: '2d ago', agent: 'Cost Agent', action: 'Applied committed use discount recommendation to project Sea-Sbox', result: 'Success' },
];

const aiopsAuditTrail: AuditTrailEntry[] = [
  { time: '2h ago', decision: 'Auto-restrict SSH security group', reasoning: 'Matched known over-permissive pattern. Memory confidence 91%. No prior regressions from this action type.', outcome: 'Executed' },
  { time: '4h ago', decision: 'Flag BigQuery cost anomaly', reasoning: 'Spend exceeded 3-sigma threshold. Memory matched Jul 15 ETL incident (88%). Auto-fix available but cost > $50 — requires approval.', outcome: 'Awaiting approval' },
  { time: '8h ago', decision: 'Classify bastion egress as false positive', reasoning: 'Traffic pattern matches scheduled backup window. Confidence 72% — below auto-execute threshold. Flagged for human review.', outcome: 'Flagged' },
  { time: '1d ago', decision: 'Disable inactive IAM user', reasoning: 'No login for 90+ days. No active service account keys. Memory shows 4 prior successful deactivations with 0 rollbacks.', outcome: 'Executed' },
  { time: '2d ago', decision: 'Apply CUD recommendation', reasoning: 'Projected savings $1,240/yr. Memory: 3 prior CUD applications, all within 5% of projected savings.', outcome: 'Executed' },
];

/* ================================================================== */
/*  Memory                                                             */
/* ================================================================== */

const memoryEntries: MemoryEntry[] = [
  { id: 'mem-1', timestamp: '3d ago', pillar: 'CloudOps', confidence: 94, title: 'CPU spike recovery pattern', context: 'clens-dev hit 95% CPU sustained. Auto-scaled to e2-standard-4 and added load balancing.', learning: 'Sustained CPU > 85% for 5min triggers auto-scale. Recovery time: 8 min.', appliedCount: 7 },
  { id: 'mem-2', timestamp: '5d ago', pillar: 'FinOps', confidence: 88, title: 'BigQuery ETL cost spike', context: 'Scheduled ETL pipeline scanned 2TB due to missing partition filter.', learning: 'Always validate partition filters after pipeline changes. Cost impact: $42 per occurrence.', appliedCount: 3 },
  { id: 'mem-3', timestamp: '7d ago', pillar: 'CloudOps', confidence: 82, title: 'Database connection pool exhaustion', context: 'pgsql hit max connections (100). Application threw connection timeout errors.', learning: 'Monitor active connections. Pool size 200 with connection leak detection prevents recurrence.', appliedCount: 2 },
  { id: 'mem-4', timestamp: '14d ago', pillar: 'CloudOps', confidence: 91, title: 'Serverless cold start mitigation', context: 'process-orders function p99 latency exceeded 2s during traffic burst.', learning: 'Min instances = 3 with 512MB memory eliminates cold start issue. Cost increase: $4/mo.', appliedCount: 1 },
  { id: 'mem-5', timestamp: '21d ago', pillar: 'CloudOps', confidence: 72, title: 'Network egress false positive', context: 'Bastion-host egress anomaly (3.3σ from baseline). Investigation showed legitimate backup job.', learning: 'Backup jobs to cross-region storage trigger egress alerts. Exclude backup CIDR from anomaly detection.', appliedCount: 1 },
  { id: 'mem-6', timestamp: '27d ago', pillar: 'SecOps', confidence: 96, title: 'SSH security group remediation', context: 'Security group allowing SSH from 0.0.0.0/0 detected. Restricted to VPN CIDR 10.0.0.0/8.', learning: 'Auto-remediable with 96% confidence. Average fix time: 2 min. Zero regressions across 12 applications.', appliedCount: 12 },
  { id: 'mem-7', timestamp: '30d ago', pillar: 'FinOps', confidence: 94, title: 'Committed use discount opportunity', context: 'Compute Engine instances running 24/7 for 6+ months identified.', learning: 'CUD provides 30-40% savings for stable workloads. ROI breakeven: 3 weeks.', appliedCount: 1 },
  { id: 'mem-8', timestamp: '45d ago', pillar: 'DevOps', confidence: 91, title: 'Friday deployment risk', context: '5 deployment failures occurred on Fridays in 90-day period vs 2 on other weekdays.', learning: 'Fridays have 23% higher failure rate. Recommend deployment freeze after 3 PM Friday.', appliedCount: 0, appliedNote: 'advisory' },
  { id: 'mem-9', timestamp: '60d ago', pillar: 'SecOps', confidence: 82, title: 'Over-privileged service account pattern', context: 'Service accounts created with Editor/Owner roles as default.', learning: 'Custom roles with least-privilege reduce security findings by 60%. Avg creation time: 25 min.', appliedCount: 8 },
  { id: 'mem-10', timestamp: '90d ago', pillar: 'DevOps', confidence: 85, title: 'Terraform state lock conflict', context: 'Concurrent terraform applies caused state lock conflicts 3 times.', learning: 'Enforce serial applies per workspace. Add pre-apply state lock check to CI pipeline.', appliedCount: 3 },
];

const memoryIncidentPatterns: IncidentPattern[] = [
  { name: 'SSH from Internet', occurrences: 12, autoResolved: 100, avgResolveMin: 2, trend: 'improving', bars: [1, 2, 3, 2, 1, 3] },
  { name: 'CPU Spike → Auto-scale', occurrences: 7, autoResolved: 100, avgResolveMin: 8, trend: 'stable', bars: [1, 1, 2, 1, 1, 1] },
  { name: 'Cost Spike (BigQuery)', occurrences: 3, autoResolved: 67, avgResolveMin: 22, trend: 'new', bars: [0, 0, 1, 0, 1, 1] },
  { name: 'Connection Pool Exhaustion', occurrences: 2, autoResolved: 50, avgResolveMin: 18, trend: 'new', bars: [0, 0, 0, 0, 1, 1] },
  { name: 'Friday Deploy Failures', occurrences: 5, autoResolved: 0, avgResolveMin: 0, trend: 'stable', bars: [1, 0, 1, 1, 1, 1] },
];

const memoryRemediationLibrary: RemediationLibraryEntry[] = [
  { fix: 'Restrict SSH to VPN CIDR', confidence: 96, timesApplied: 12, successRate: '100%', lastApplied: '2h ago', pillar: 'SecOps' },
  { fix: 'Block S3 Public Access', confidence: 94, timesApplied: 5, successRate: '100%', lastApplied: '7d ago', pillar: 'SecOps' },
  { fix: 'Auto-scale VM on CPU spike', confidence: 94, timesApplied: 7, successRate: '100%', lastApplied: '3d ago', pillar: 'CloudOps' },
  { fix: 'Increase connection pool', confidence: 82, timesApplied: 2, successRate: '100%', lastApplied: '7d ago', pillar: 'CloudOps' },
  { fix: 'Apply BigQuery partition filter', confidence: 88, timesApplied: 2, successRate: '100%', lastApplied: '30d ago', pillar: 'FinOps' },
  { fix: 'Disable inactive IAM users', confidence: 90, timesApplied: 4, successRate: '100%', lastApplied: '1d ago', pillar: 'SecOps' },
  { fix: 'Set min instances on Functions', confidence: 91, timesApplied: 1, successRate: '100%', lastApplied: '14d ago', pillar: 'CloudOps' },
];

const memoryLearnings: Learning[] = [
  { insight: 'IAM changes correlate with 40% of security findings within 48h', crossPillar: 'DevOps × SecOps' },
  { insight: 'Cost optimizations that also improve performance have 100% adoption rate', crossPillar: 'FinOps × CloudOps' },
  { insight: 'Auto-remediation with >90% confidence has 100% success rate — zero regressions', crossPillar: 'AIOps × all' },
  { insight: 'The 3 most impactful actions this quarter: CUD ($67/mo saved), SSH auto-fix (12 incidents prevented), BigQuery optimization ($42/incident saved)', crossPillar: 'cross-pillar' },
  { insight: 'MTTR improves by average 22% on second occurrence of any pattern', crossPillar: 'meta-learning' },
];

/* ================================================================== */
/*  Assets                                                             */
/* ================================================================== */

const assets: Asset[] = [
  { name: 'cloudlens-dev-new', subtitle: 'e2-standard-2', type: 'VM Instances', provider: 'GCP', region: 'asia-south1-c', state: 'RUNNING', cost: 53.81, project: '138101788', lastSeen: 'Jul 28, 12:34' },
  { name: 'cl-icore', subtitle: 'e2-standard-2', type: 'VM Instances', provider: 'GCP', region: 'asia-south1-c', state: 'RUNNING', cost: 53.81, project: '138101788', lastSeen: 'Jul 28, 12:34' },
  { name: 'clens-dev', subtitle: 'e2-standard-2', type: 'VM Instances', provider: 'GCP', region: 'asia-south1-b', state: 'RUNNING', cost: 53.81, project: '138101788', lastSeen: 'Jul 28, 12:34' },
  { name: 'Bastion-Host', subtitle: 't2.small · 52.66.236.205', type: 'EC2 Instances', provider: 'AWS', region: 'ap-south-1b', state: 'RUNNING', cost: 18.10, project: '010863548913', lastSeen: 'Jul 28, 12:28' },
  { name: 'pgsql', subtitle: 'POSTGRES_18 · db-f1-micro', type: 'Cloud SQL Instances', provider: 'GCP', region: 'us-central1', state: 'SUSPENDED', cost: 15.33, project: '1087551233922', lastSeen: 'Jul 28, 12:35' },
  { name: 'dns-tester', subtitle: 'Ready: True', type: 'Cloud Run Services', provider: 'GCP', region: 'asia-southeast1', state: 'UNKNOWN', cost: 5.00, project: '138101788', lastSeen: 'Jul 28, 12:34' },
  { name: 'awr-migration-automation', subtitle: 'Ready: True', type: 'Cloud Run Services', provider: 'GCP', region: 'us-central1', state: 'UNKNOWN', cost: 5.00, project: '138101788', lastSeen: 'Jul 28, 12:34' },
];

/* ================================================================== */
/*  Alerts                                                             */
/* ================================================================== */

const alerts: Alert[] = [
  {
    id: 'alert-1', title: 'Cost spike detected: +9.0%', severity: 'warning', status: 'ACTIVE',
    description: "Spend for 'sandbox' increased 9.0% in the last 4h ($772.44 → $842.02/mo). Threshold: 5.0%.",
    resource: 'sandbox', time: 'May 19, 2026 10:33:19', type: 'COST_SPIKE',
    baseline: '$772.44/mo', current: '$842.02/mo', increase: '+9.0%',
  },
  {
    id: 'alert-2', title: 'Cost spike detected: +17.9%', severity: 'warning', status: 'ACTIVE',
    description: "Spend for 'Sea-GCP-Sbox' increased 17.9% in the last 4h ($417.02 → $491.87/mo). Threshold: 5.0%.",
    resource: 'Sea-GCP-Sbox', time: 'May 14, 2026 11:13:55', type: 'COST_SPIKE',
    baseline: '$417.02/mo', current: '$491.87/mo', increase: '+17.9%',
  },
  {
    id: 'alert-3', title: 'Cost spike detected: +1648.1%', severity: 'critical', status: 'ACTIVE',
    description: "Spend for 'Pers-sbox' increased 1648.1% in the last 4h ($13.77 → $240.71/mo). Threshold: 5.0%.",
    resource: 'Pers-sbox', time: 'May 14, 2026 11:10:51', type: 'COST_SPIKE',
    baseline: '$13.77/mo', current: '$240.71/mo', increase: '+1648.1%',
  },
];

/* ================================================================== */
/*  Endpoint → Data mapping                                            */
/* ================================================================== */

const mockData: Record<string, unknown> = {
  // Command Center
  '/command-center/scores': commandCenterScores,
  '/command-center/attention': commandCenterAttention,
  '/command-center/changes': commandCenterChanges,
  '/command-center/workloads': commandCenterWorkloads,
  '/command-center/memory-patterns': commandCenterMemoryPatterns,

  // CloudOps
  '/cloudops/workloads': cloudopsWorkloads,
  '/cloudops/incidents': cloudopsIncidents,
  '/cloudops/serverless': cloudopsServerless,
  '/cloudops/pipelines': cloudopsPipelines,

  // FinOps
  '/finops/costs': finopsCosts,
  '/finops/anomalies': finopsAnomalies,
  '/finops/optimizations': finopsOptimizations,
  '/finops/monthly-trend': finopsMonthlyTrend,
  '/finops/forecast': finopsForecast,

  // SecOps
  '/secops/findings': secopsFindings,
  '/secops/iam': secopsIam,
  '/secops/compliance': secopsCompliance,
  '/secops/remediations': secopsRemediations,

  // DevOps
  '/devops/changes': devopsChanges,
  '/devops/orchestration': devopsOrchestration,
  '/devops/patches': devopsPatches,
  '/devops/deployments': devopsDeployments,

  // AIOps
  '/aiops/agents': aiopsAgents,
  '/aiops/activity': aiopsActivity,
  '/aiops/audit-trail': aiopsAuditTrail,

  // Memory
  '/memory/entries': memoryEntries,
  '/memory/patterns': memoryIncidentPatterns,
  '/memory/remediation-library': memoryRemediationLibrary,
  '/memory/learnings': memoryLearnings,

  // Assets & Alerts
  '/assets': assets,
  '/alerts': alerts,
};

/**
 * Returns mock data for the given endpoint path.
 * Falls back to an empty array for unknown endpoints.
 */
export function getMockData(endpoint: string): unknown {
  return mockData[endpoint] ?? [];
}
