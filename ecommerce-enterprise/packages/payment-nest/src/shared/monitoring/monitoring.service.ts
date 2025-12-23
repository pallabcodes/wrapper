import { Injectable, Logger } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(private readonly metricsService: MetricsService) {}

  async recordPaymentCreated(provider: string, amount: number, currency: string): Promise<void> {
    this.metricsService.incrementPaymentCreated(provider, currency);
    this.metricsService.recordPaymentAmount(amount, currency);
    this.logger.log(`Payment created: ${provider} - ${amount} ${currency}`);
  }

  async recordPaymentCompleted(provider: string, amount: number, currency: string): Promise<void> {
    this.metricsService.incrementPaymentCompleted(provider, currency);
    this.metricsService.recordPaymentAmount(amount, currency);
    this.logger.log(`Payment completed: ${provider} - ${amount} ${currency}`);
  }

  async recordPaymentFailed(provider: string, error: string): Promise<void> {
    this.metricsService.incrementPaymentFailed(provider, error);
    this.logger.error(`Payment failed: ${provider} - ${error}`);
  }

  async recordWebhookProcessed(provider: string, eventType: string): Promise<void> {
    this.metricsService.incrementWebhookProcessed(provider, eventType);
    this.logger.log(`Webhook processed: ${provider} - ${eventType}`);
  }

  async recordWebhookFailed(provider: string, error: string): Promise<void> {
    this.metricsService.incrementWebhookFailed(provider, error);
    this.logger.error(`Webhook failed: ${provider} - ${error}`);
  }

  async recordAnalyticsProcessed(metricType: string): Promise<void> {
    this.metricsService.incrementAnalyticsProcessed(metricType);
    this.logger.log(`Analytics processed: ${metricType}`);
  }

  async recordError(error: Error, context?: string): Promise<void> {
    this.metricsService.incrementError(context || 'unknown');
    this.logger.error(`Error occurred: ${error.message}`, error.stack, context);
  }

  async recordRequestDuration(method: string, route: string, duration: number, statusCode: number): Promise<void> {
    this.metricsService.recordRequestDuration(method, route, duration, statusCode);
  }

  async recordDatabaseQuery(query: string, duration: number, success: boolean): Promise<void> {
    this.metricsService.recordDatabaseQuery(query, duration, success);
  }

  async recordCacheHit(key: string): Promise<void> {
    this.metricsService.incrementCacheHit();
    this.logger.debug(`Cache hit: ${key}`);
  }

  async recordCacheMiss(key: string): Promise<void> {
    this.metricsService.incrementCacheMiss();
    this.logger.debug(`Cache miss: ${key}`);
  }
}
