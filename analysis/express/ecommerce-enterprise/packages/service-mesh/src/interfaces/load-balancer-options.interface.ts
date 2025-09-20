export interface LoadBalancerOptions {
  algorithm?: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' | 'random';
  clientIp?: string;
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    path: string;
  };
}