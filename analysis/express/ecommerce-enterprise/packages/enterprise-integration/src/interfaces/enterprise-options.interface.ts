export interface EnterpriseIntegrationOptions {
  sap?: SAPOptions;
  salesforce?: SalesforceOptions;
  cache?: CacheOptions;
  retry?: RetryOptions;
  monitoring?: MonitoringOptions;
}

export interface SAPOptions {
  enabled: boolean;
  connection: SAPConnectionOptions;
  rfc?: RFCOptions;
  odata?: ODataOptions;
  idoc?: IDocOptions;
  authentication?: SAPAuthOptions;
}

export interface SAPConnectionOptions {
  host: string;
  port: number;
  client: string;
  user: string;
  password: string;
  systemNumber?: string;
  applicationServer?: string;
  messageServer?: string;
  group?: string;
  logonGroup?: string;
}

export interface RFCOptions {
  enabled: boolean;
  functions: string[];
  timeout?: number;
  poolSize?: number;
}

export interface ODataOptions {
  enabled: boolean;
  baseUrl: string;
  version?: string;
  timeout?: number;
  batchSize?: number;
}

export interface IDocOptions {
  enabled: boolean;
  inboundPort?: number;
  outboundPort?: number;
  messageTypes: string[];
  timeout?: number;
}

export interface SAPAuthOptions {
  type: 'basic' | 'sso' | 'certificate';
  ssoTicket?: string;
  certificate?: string;
  privateKey?: string;
}

export interface SalesforceOptions {
  enabled: boolean;
  connection: SalesforceConnectionOptions;
  api?: SalesforceAPIOptions;
  webhook?: SalesforceWebhookOptions;
  bulk?: SalesforceBulkOptions;
}

export interface SalesforceConnectionOptions {
  loginUrl: string;
  username: string;
  password: string;
  securityToken: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

export interface SalesforceAPIOptions {
  version: string;
  timeout?: number;
  retryAttempts?: number;
  batchSize?: number;
}

export interface SalesforceWebhookOptions {
  enabled: boolean;
  events: string[];
  endpoint: string;
  secret?: string;
}

export interface SalesforceBulkOptions {
  enabled: boolean;
  batchSize: number;
  concurrency: number;
  timeout?: number;
}

export interface CacheOptions {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  provider: 'redis' | 'memory';
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
}

export interface RetryOptions {
  enabled: boolean;
  maxAttempts: number;
  delay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

export interface MonitoringOptions {
  enabled: boolean;
  metrics: boolean;
  logging: boolean;
  tracing: boolean;
}

export interface EnterpriseData {
  id: string;
  source: 'sap' | 'salesforce' | 'internal';
  type: string;
  data: Record<string, any>;
  metadata: {
    timestamp: Date;
    version: string;
    checksum: string;
    syncStatus: 'pending' | 'synced' | 'conflict' | 'error';
  };
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: SyncError[];
  duration: number;
}

export interface SyncError {
  recordId: string;
  error: string;
  code: string;
  timestamp: Date;
}

export interface ConflictResolution {
  strategy: 'source_wins' | 'target_wins' | 'manual' | 'merge';
  rules: ConflictRule[];
}

export interface ConflictRule {
  field: string;
  condition: string;
  action: 'source' | 'target' | 'merge' | 'skip';
}
