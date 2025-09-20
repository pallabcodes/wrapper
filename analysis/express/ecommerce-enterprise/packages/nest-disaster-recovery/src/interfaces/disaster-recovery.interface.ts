export interface BackupConfig {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  schedule: string; // cron expression
  retention: {
    days: number;
    weeks: number;
    months: number;
  };
  compression: boolean;
  encryption: boolean;
  encryptionKey?: string;
  destinations: BackupDestination[];
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface BackupDestination {
  id: string;
  type: 'local' | 's3' | 'azure' | 'gcp' | 'ftp' | 'sftp';
  config: {
    path?: string;
    bucket?: string;
    region?: string;
    accessKey?: string;
    secretKey?: string;
    endpoint?: string;
    container?: string;
    connectionString?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
  };
  priority: number;
  enabled: boolean;
}

export interface BackupJob {
  id: string;
  configId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  size?: number;
  compressedSize?: number;
  destinations: BackupDestinationResult[];
  error?: string;
  metadata: {
    filesCount: number;
    tablesCount: number;
    databasesCount: number;
    version: string;
  };
}

export interface BackupDestinationResult {
  destinationId: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  size?: number;
  path?: string;
  url?: string;
  error?: string;
}

export interface RestoreJob {
  id: string;
  backupJobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  targetEnvironment: string;
  targetDatabase?: string;
  targetTables?: string[];
  pointInTime?: Date;
  error?: string;
  progress: {
    current: number;
    total: number;
    percentage: number;
    currentFile?: string;
  };
}

export interface DisasterRecoveryPlan {
  id: string;
  name: string;
  description: string;
  rto: number; // Recovery Time Objective in minutes
  rpo: number; // Recovery Point Objective in minutes
  priority: 'critical' | 'high' | 'medium' | 'low';
  components: DRComponent[];
  procedures: DRProcedure[];
  contacts: DRContact[];
  lastTested?: Date;
  nextTest?: Date;
  status: 'active' | 'inactive' | 'testing';
}

export interface DRComponent {
  id: string;
  name: string;
  type: 'database' | 'application' | 'infrastructure' | 'network' | 'storage';
  criticality: 'critical' | 'important' | 'standard';
  dependencies: string[];
  backupConfigId: string;
  restoreConfig: {
    environment: string;
    resources: string[];
    dependencies: string[];
  };
}

export interface DRProcedure {
  id: string;
  name: string;
  description: string;
  order: number;
  type: 'backup' | 'restore' | 'failover' | 'failback' | 'validation';
  steps: DRStep[];
  estimatedDuration: number; // in minutes
  dependencies: string[];
  automated: boolean;
}

export interface DRStep {
  id: string;
  description: string;
  command?: string;
  script?: string;
  parameters?: Record<string, any>;
  timeout?: number;
  retryCount?: number;
  critical: boolean;
}

export interface DRContact {
  id: string;
  name: string;
  role: 'incident_manager' | 'technical_lead' | 'database_admin' | 'system_admin' | 'business_owner';
  email: string;
  phone: string;
  escalationLevel: number;
  available24x7: boolean;
}

export interface DisasterRecoveryTest {
  id: string;
  planId: string;
  type: 'tabletop' | 'simulation' | 'full_test';
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  results: DRTestResult[];
  issues: DRTestIssue[];
  recommendations: string[];
  nextTestDate?: Date;
}

export interface DRTestResult {
  componentId: string;
  procedureId: string;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  duration: number;
  details: string;
  metrics: {
    rto: number;
    rpo: number;
    dataLoss: number;
  };
}

export interface DRTestIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  componentId: string;
  procedureId: string;
  description: string;
  impact: string;
  resolution: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  dueDate?: Date;
}

export interface BusinessContinuityPlan {
  id: string;
  name: string;
  description: string;
  businessImpact: {
    financial: number;
    operational: number;
    reputational: number;
  };
  criticalProcesses: CriticalProcess[];
  recoveryStrategies: RecoveryStrategy[];
  communicationPlan: CommunicationPlan;
  testingSchedule: TestingSchedule;
  lastReview: Date;
  nextReview: Date;
  status: 'active' | 'draft' | 'archived';
}

export interface CriticalProcess {
  id: string;
  name: string;
  description: string;
  owner: string;
  mttr: number; // Mean Time To Recovery in hours
  mtbf: number; // Mean Time Between Failures in hours
  dependencies: string[];
  resources: string[];
  sla: {
    availability: number; // percentage
    performance: number; // response time in ms
  };
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  type: 'preventive' | 'detective' | 'corrective';
  description: string;
  implementation: string;
  cost: number;
  effectiveness: number; // percentage
  timeline: number; // days
}

export interface CommunicationPlan {
  id: string;
  stakeholders: Stakeholder[];
  channels: CommunicationChannel[];
  templates: CommunicationTemplate[];
  escalationMatrix: EscalationMatrix;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  contactInfo: {
    email: string;
    phone: string;
    alternatePhone?: string;
  };
  notificationPreferences: string[];
  criticality: 'critical' | 'important' | 'standard';
}

export interface CommunicationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'phone' | 'slack' | 'teams' | 'webhook';
  config: Record<string, any>;
  priority: number;
  reliability: number; // percentage
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'incident' | 'status' | 'resolution' | 'test';
  subject: string;
  body: string;
  variables: string[];
}

export interface EscalationMatrix {
  levels: EscalationLevel[];
  timeouts: number[]; // in minutes
}

export interface EscalationLevel {
  level: number;
  contacts: string[];
  criteria: string[];
  actions: string[];
}

export interface TestingSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string; // HH:MM format
  duration: number; // in hours
  type: 'automated' | 'manual' | 'hybrid';
}

export interface DisasterRecoveryMetrics {
  rto: {
    target: number;
    actual: number;
    trend: 'improving' | 'stable' | 'degrading';
  };
  rpo: {
    target: number;
    actual: number;
    trend: 'improving' | 'stable' | 'degrading';
  };
  availability: {
    current: number;
    target: number;
    uptime: number;
    downtime: number;
  };
  backup: {
    successRate: number;
    averageDuration: number;
    totalSize: number;
    retentionCompliance: number;
  };
  restore: {
    successRate: number;
    averageDuration: number;
    dataIntegrity: number;
  };
  testing: {
    lastTest: Date;
    nextTest: Date;
    passRate: number;
    issuesCount: number;
  };
}
