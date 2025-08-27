import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { Request, Response } from 'express';

// Initialize default metrics
collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDurationMicroseconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const redisOperationDuration = new Histogram({
  name: 'redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5]
});

export const orderCreationTotal = new Counter({
  name: 'orders_created_total',
  help: 'Total number of orders created',
  labelNames: ['status']
});

export const paymentProcessingTotal = new Counter({
  name: 'payments_processed_total',
  help: 'Total number of payments processed',
  labelNames: ['gateway', 'status']
});

export const userRegistrationTotal = new Counter({
  name: 'users_registered_total',
  help: 'Total number of user registrations',
  labelNames: ['method']
});

export const cacheHitRatio = new Gauge({
  name: 'cache_hit_ratio',
  help: 'Cache hit ratio percentage'
});

export const queueJobDuration = new Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Duration of queue jobs in seconds',
  labelNames: ['job_type', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

export const queueJobTotal = new Counter({
  name: 'queue_jobs_total',
  help: 'Total number of queue jobs',
  labelNames: ['job_type', 'status']
});

// Metrics middleware
export const metricsMiddleware = (req: Request, res: Response, next: Function): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });
  
  next();
};

// Metrics endpoint
export const setupMetrics = () => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.status(500).end(error);
    }
  };
};

// Custom metrics helpers
export const recordDatabaseQuery = (operation: string, table: string, duration: number): void => {
  databaseQueryDuration.labels(operation, table).observe(duration);
};

export const recordRedisOperation = (operation: string, duration: number): void => {
  redisOperationDuration.labels(operation).observe(duration);
};

export const recordOrderCreation = (status: string): void => {
  orderCreationTotal.labels(status).inc();
};

export const recordPaymentProcessing = (gateway: string, status: string): void => {
  paymentProcessingTotal.labels(gateway, status).inc();
};

export const recordUserRegistration = (method: string): void => {
  userRegistrationTotal.labels(method).inc();
};

export const updateCacheHitRatio = (ratio: number): void => {
  cacheHitRatio.set(ratio);
};

export const recordQueueJob = (jobType: string, status: string, duration?: number): void => {
  queueJobTotal.labels(jobType, status).inc();
  if (duration) {
    queueJobDuration.labels(jobType, status).observe(duration);
  }
};

export const updateActiveConnections = (count: number): void => {
  activeConnections.set(count);
};
