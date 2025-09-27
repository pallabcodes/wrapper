import { Injectable } from '@nestjs/common';
import { Counter, Histogram, register } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly paymentCreated = new Counter({
    name: 'payment_created_total',
    help: 'Total number of payments created',
    labelNames: ['provider', 'currency'],
  });

  private readonly paymentCompleted = new Counter({
    name: 'payment_completed_total',
    help: 'Total number of payments completed',
    labelNames: ['provider', 'currency'],
  });

  private readonly paymentFailed = new Counter({
    name: 'payment_failed_total',
    help: 'Total number of payments failed',
    labelNames: ['provider', 'error'],
  });

  private readonly paymentAmount = new Histogram({
    name: 'payment_amount',
    help: 'Payment amounts',
    labelNames: ['currency'],
    buckets: [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000],
  });

  private readonly webhookProcessed = new Counter({
    name: 'webhook_processed_total',
    help: 'Total number of webhooks processed',
    labelNames: ['provider', 'event_type'],
  });

  private readonly webhookFailed = new Counter({
    name: 'webhook_failed_total',
    help: 'Total number of webhooks failed',
    labelNames: ['provider', 'error'],
  });

  private readonly analyticsProcessed = new Counter({
    name: 'analytics_processed_total',
    help: 'Total number of analytics processed',
    labelNames: ['metric_type'],
  });

  private readonly errors = new Counter({
    name: 'errors_total',
    help: 'Total number of errors',
    labelNames: ['context'],
  });

  private readonly requestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
  });

  private readonly databaseQueryDuration = new Histogram({
    name: 'database_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['query', 'success'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  });

  private readonly cacheHits = new Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
  });

  private readonly cacheMisses = new Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
  });

  private readonly activeConnections = new Counter({
    name: 'active_connections_total',
    help: 'Total number of active connections',
  });

  constructor() {
    register.registerMetric(this.paymentCreated);
    register.registerMetric(this.paymentCompleted);
    register.registerMetric(this.paymentFailed);
    register.registerMetric(this.paymentAmount);
    register.registerMetric(this.webhookProcessed);
    register.registerMetric(this.webhookFailed);
    register.registerMetric(this.analyticsProcessed);
    register.registerMetric(this.errors);
    register.registerMetric(this.requestDuration);
    register.registerMetric(this.databaseQueryDuration);
    register.registerMetric(this.cacheHits);
    register.registerMetric(this.cacheMisses);
    register.registerMetric(this.activeConnections);
  }

  incrementPaymentCreated(provider: string, currency: string): void {
    this.paymentCreated.inc({ provider, currency });
  }

  incrementPaymentCompleted(provider: string, currency: string): void {
    this.paymentCompleted.inc({ provider, currency });
  }

  incrementPaymentFailed(provider: string, error: string): void {
    this.paymentFailed.inc({ provider, error });
  }

  recordPaymentAmount(amount: number, currency: string): void {
    this.paymentAmount.observe({ currency }, amount);
  }

  incrementWebhookProcessed(provider: string, eventType: string): void {
    this.webhookProcessed.inc({ provider, event_type: eventType });
  }

  incrementWebhookFailed(provider: string, error: string): void {
    this.webhookFailed.inc({ provider, error });
  }

  incrementAnalyticsProcessed(metricType: string): void {
    this.analyticsProcessed.inc({ metric_type: metricType });
  }

  incrementError(context: string): void {
    this.errors.inc({ context });
  }

  recordRequestDuration(method: string, route: string, duration: number, statusCode: number): void {
    this.requestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
  }

  recordDatabaseQuery(query: string, duration: number, success: boolean): void {
    this.databaseQueryDuration.observe({ query, success: success.toString() }, duration);
  }

  incrementCacheHit(): void {
    this.cacheHits.inc();
  }

  incrementCacheMiss(): void {
    this.cacheMisses.inc();
  }

  setActiveConnections(count: number): void {
    // For Counter, we'll just increment by the count
    // Note: This is a simplified approach for active connections
    this.activeConnections.inc(count);
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
