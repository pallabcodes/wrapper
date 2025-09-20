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

