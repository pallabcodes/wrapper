export interface EventStreamingConfig {
  provider: 'kafka' | 'rabbitmq' | 'redis';
  kafka?: {
    clientId: string;
    brokers: string[];
    ssl?: boolean;
    sasl?: {
      mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
      username: string;
      password: string;
    };
    retry?: {
      initialRetryTime: number;
      retries: number;
    };
  };
  rabbitmq?: {
    url: string;
    exchange: string;
    queue: string;
    routingKey: string;
    options?: {
      durable: boolean;
      autoDelete: boolean;
      messageTtl: number;
    };
  };
  redis?: {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
  };
}

export interface EventMessage {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  data: any;
  metadata?: {
    correlationId?: string;
    causationId?: string;
    version?: string;
    schema?: string;
    publishedAt?: string;
    originalError?: string;
    deadLetterReason?: string;
  };
  headers?: Record<string, any>;
}

export interface EventHandler {
  eventType: string;
  handler: (message: EventMessage) => Promise<void>;
  options?: {
    retry?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    deadLetterQueue?: string;
  };
}

export interface EventPublisher {
  publish(topic: string, message: EventMessage): Promise<void>;
  publishBatch(topic: string, messages: EventMessage[]): Promise<void>;
}

export interface EventSubscriber {
  subscribe(topic: string, handler: EventHandler): Promise<void>;
  unsubscribe(topic: string, eventType: string): Promise<void>;
  getSubscriptions(): Map<string, EventHandler[]>;
}

export interface EventStreamingMetrics {
  totalEvents: number;
  publishedEvents: number;
  consumedEvents: number;
  failedEvents: number;
  averageLatency: number;
  throughput: number;
  errorRate: number;
  topics: {
    [topic: string]: {
      events: number;
      consumers: number;
      lastActivity: Date;
    };
  };
}

export interface EventStreamingHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  provider: string;
  connected: boolean;
  lastCheck: Date;
  metrics: EventStreamingMetrics;
  issues: string[];
}

export interface EventStreamingOptions {
  enableMetrics: boolean;
  enableHealthChecks: boolean;
  enableRetry: boolean;
  enableDeadLetterQueue: boolean;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  flushInterval: number;
  compression: boolean;
  encryption: boolean;
}
