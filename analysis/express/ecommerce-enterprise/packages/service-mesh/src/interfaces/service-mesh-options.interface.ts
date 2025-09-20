export interface ServiceMeshOptions {
  global?: boolean;
  serviceName: string;
  servicePort: number;
  serviceHost?: string;
  discovery?: {
    type: 'consul' | 'etcd' | 'redis' | 'static';
    consul?: {
      host: string;
      port: number;
      token?: string;
    };
    etcd?: {
      hosts: string[];
      auth?: {
        username: string;
        password: string;
      };
    };
    redis?: {
      host: string;
      port: number;
      password?: string;
    };
    static?: {
      services: Record<string, ServiceInstance[]>;
    };
  };
  loadBalancer?: {
    algorithm: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' | 'random';
    healthCheck?: {
      enabled: boolean;
      interval: number;
      timeout: number;
      path: string;
    };
  };
  circuitBreaker?: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
  };
  retry?: {
    enabled: boolean;
    maxAttempts: number;
    backoffStrategy: 'fixed' | 'exponential' | 'linear';
    baseDelay: number;
    maxDelay: number;
  };
  timeout?: {
    default: number;
    services: Record<string, number>;
  };
  metrics?: {
    enabled: boolean;
    port: number;
    path: string;
  };
  auth?: {
    enabled: boolean;
    tokenHeader: string;
    serviceToken: string;
  };
}

export interface ServiceInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  health: 'healthy' | 'unhealthy' | 'unknown';
  lastSeen: Date;
  metadata?: Record<string, any>;
  tags?: string[];
  weight?: number;
}
