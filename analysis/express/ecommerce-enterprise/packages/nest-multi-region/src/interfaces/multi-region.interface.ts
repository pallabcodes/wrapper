export interface RegionConfig {
  id: string;
  name: string;
  location: {
    country: string;
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  endpoints: {
    api: string;
    health: string;
    replication: string;
  };
  status: 'active' | 'inactive' | 'maintenance' | 'failed';
  priority: number;
  capacity: {
    maxConnections: number;
    currentConnections: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  latency: {
    average: number;
    p95: number;
    p99: number;
  };
  lastHealthCheck: Date;
  features: string[];
}

export interface ReplicationConfig {
  enabled: boolean;
  strategy: 'master-slave' | 'master-master' | 'eventual-consistency';
  regions: string[];
  conflictResolution: 'last-write-wins' | 'first-write-wins' | 'custom';
  syncInterval: number; // milliseconds
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface DataReplication {
  id: string;
  sourceRegion: string;
  targetRegion: string;
  dataType: string;
  dataId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  retryCount: number;
  error?: string;
}

export interface LoadBalancerConfig {
  strategy: 'round-robin' | 'least-connections' | 'latency' | 'geographic';
  healthCheck: {
    enabled: boolean;
    interval: number;
    timeout: number;
    path: string;
  };
  failover: {
    enabled: boolean;
    threshold: number;
    cooldown: number;
  };
  stickySessions: boolean;
  maxRetries: number;
}

export interface RegionHealth {
  regionId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
  issues: string[];
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

export interface GlobalLoadBalancer {
  id: string;
  name: string;
  strategy: 'geographic' | 'latency' | 'round-robin';
  regions: RegionConfig[];
  healthChecks: RegionHealth[];
  routingRules: RoutingRule[];
  failoverConfig: FailoverConfig;
}

export interface RoutingRule {
  id: string;
  condition: {
    path?: string;
    method?: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
  };
  target: {
    regionId: string;
    weight: number;
  };
  priority: number;
}

export interface FailoverConfig {
  enabled: boolean;
  primaryRegion: string;
  secondaryRegions: string[];
  healthCheckThreshold: number;
  failoverDelay: number;
  recoveryDelay: number;
  autoRecovery: boolean;
}

export interface DataSyncStatus {
  regionId: string;
  lastSync: Date;
  pendingOperations: number;
  failedOperations: number;
  syncRate: number; // operations per second
  lag: number; // milliseconds
  conflicts: DataConflict[];
}

export interface DataConflict {
  id: string;
  dataType: string;
  dataId: string;
  regions: string[];
  versions: {
    region: string;
    data: any;
    timestamp: Date;
  }[];
  resolution?: {
    strategy: string;
    resolvedBy: string;
    resolvedAt: Date;
    finalData: any;
  };
}

export interface MultiRegionMetrics {
  totalRegions: number;
  activeRegions: number;
  totalRequests: number;
  averageLatency: number;
  errorRate: number;
  dataSyncStatus: DataSyncStatus[];
  regionHealth: RegionHealth[];
  replicationQueue: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

export interface RegionEvent {
  id: string;
  type: 'region-up' | 'region-down' | 'region-maintenance' | 'data-sync' | 'conflict-detected' | 'failover';
  regionId: string;
  timestamp: Date;
  data: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
}
