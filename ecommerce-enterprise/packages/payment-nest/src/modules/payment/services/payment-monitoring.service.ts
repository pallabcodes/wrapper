/**
 * Payment Monitoring Service
 * 
 * Real-time payment monitoring, analytics, and alerting
 * with comprehensive dashboards and reporting.
 */

import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';

// Monitoring Schemas
export const PaymentMetricsSchema = z.object({
  timestamp: z.string().datetime(),
  totalPayments: z.number().int().min(0),
  successfulPayments: z.number().int().min(0),
  failedPayments: z.number().int().min(0),
  pendingPayments: z.number().int().min(0),
  totalVolume: z.number().positive(),
  averageAmount: z.number().positive(),
  successRate: z.number().min(0).max(1),
  fraudRate: z.number().min(0).max(1),
  averageProcessingTime: z.number().positive(),
  topProviders: z.array(z.object({
    provider: z.string(),
    count: z.number().int().min(0),
    percentage: z.number().min(0).max(1),
    volume: z.number().positive(),
  })),
  topMethods: z.array(z.object({
    method: z.string(),
    count: z.number().int().min(0),
    percentage: z.number().min(0).max(1),
    volume: z.number().positive(),
  })),
  hourlyDistribution: z.array(z.object({
    hour: z.number().int().min(0).max(23),
    count: z.number().int().min(0),
    volume: z.number().positive(),
  })),
  geographicDistribution: z.array(z.object({
    country: z.string(),
    count: z.number().int().min(0),
    percentage: z.number().min(0).max(1),
    volume: z.number().positive(),
  })),
});

export const AlertConfigSchema = z.object({
  enabled: z.boolean().default(true),
  thresholds: z.object({
    successRate: z.number().min(0).max(1).default(0.95),
    fraudRate: z.number().min(0).max(1).default(0.05),
    averageProcessingTime: z.number().positive().default(5000),
    errorRate: z.number().min(0).max(1).default(0.02),
  }),
  notifications: z.object({
    email: z.boolean().default(true),
    slack: z.boolean().default(false),
    webhook: z.boolean().default(false),
    sms: z.boolean().default(false),
  }),
  recipients: z.array(z.string().email()).min(1),
  cooldownPeriod: z.number().int().positive().default(300), // 5 minutes
});

export const RealTimeAlertSchema = z.object({
  alertId: z.string().uuid(),
  type: z.enum(['SUCCESS_RATE', 'FRAUD_RATE', 'PROCESSING_TIME', 'ERROR_RATE', 'VOLUME_SPIKE', 'CUSTOM']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  message: z.string().min(1),
  value: z.number(),
  threshold: z.number(),
  timestamp: z.string().datetime(),
  resolved: z.boolean().default(false),
  resolvedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Monitoring Interfaces
export interface PaymentMetrics {
  timestamp: Date;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  totalVolume: number;
  averageAmount: number;
  successRate: number;
  fraudRate: number;
  averageProcessingTime: number;
  topProviders: Array<{
    provider: string;
    count: number;
    percentage: number;
    volume: number;
  }>;
  topMethods: Array<{
    method: string;
    count: number;
    percentage: number;
    volume: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    count: number;
    volume: number;
  }>;
  geographicDistribution: Array<{
    country: string;
    count: number;
    percentage: number;
    volume: number;
  }>;
}

export interface RealTimeAlert {
  alertId: string;
  type: 'SUCCESS_RATE' | 'FRAUD_RATE' | 'PROCESSING_TIME' | 'ERROR_RATE' | 'VOLUME_SPIKE' | 'CUSTOM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface MonitoringDashboard {
  realTimeMetrics: PaymentMetrics;
  historicalMetrics: Array<{
    date: string;
    metrics: PaymentMetrics;
  }>;
  activeAlerts: RealTimeAlert[];
  systemHealth: {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  trends: {
    successRateTrend: Array<{ date: string; value: number }>;
    volumeTrend: Array<{ date: string; value: number }>;
    fraudTrend: Array<{ date: string; value: number }>;
  };
}

@Injectable()
export class PaymentMonitoringService {
  private readonly logger = new Logger(PaymentMonitoringService.name);
  private readonly metricsHistory: PaymentMetrics[] = [];
  private readonly activeAlerts: RealTimeAlert[] = [];
  private readonly alertConfig: z.infer<typeof AlertConfigSchema>;
  private readonly alertCooldowns = new Map<string, Date>();

  constructor() {
    this.alertConfig = {
      enabled: true,
      thresholds: {
        successRate: 0.95,
        fraudRate: 0.05,
        averageProcessingTime: 5000,
        errorRate: 0.02,
      },
      notifications: {
        email: true,
        slack: false,
        webhook: false,
        sms: false,
      },
      recipients: ['admin@enterprise.com'],
      cooldownPeriod: 300,
    };
  }

  /**
   * Record payment event for monitoring
   */
  async recordPaymentEvent(
    event: {
      type: 'CREATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
      paymentId: string;
      amount: number;
      currency: string;
      provider: string;
      method: string;
      processingTime?: number;
      fraudDetected?: boolean;
      country?: string;
      userId: string;
      tenantId: string;
    }
  ): Promise<void> {
    this.logger.debug(`Recording payment event: ${event.type} for payment ${event.paymentId}`);

    // Update real-time metrics
    await this.updateRealTimeMetrics(event);

    // Check for alerts
    await this.checkAlerts();

    // Store in metrics history (keep last 24 hours)
    const currentMetrics = await this.getCurrentMetrics();
    this.metricsHistory.push(currentMetrics);

    // Clean up old metrics (keep last 24 hours)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filteredHistory = this.metricsHistory.filter(metrics => metrics.timestamp > cutoffTime);
    this.metricsHistory.splice(0, this.metricsHistory.length - filteredHistory.length);
  }

  /**
   * Get real-time monitoring dashboard
   */
  async getMonitoringDashboard(tenantId: string): Promise<MonitoringDashboard> {
    const realTimeMetrics = await this.getCurrentMetrics();
    const historicalMetrics = this.getHistoricalMetrics(24); // Last 24 hours
    const activeAlerts = this.getActiveAlerts();
    const systemHealth = await this.getSystemHealth();
    const trends = await this.getTrends();

    return {
      realTimeMetrics,
      historicalMetrics,
      activeAlerts,
      systemHealth,
      trends,
    };
  }

  /**
   * Get payment metrics for a specific time range
   */
  async getPaymentMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    granularity: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'hourly'
  ): Promise<PaymentMetrics[]> {
    // Filter metrics by date range
    const filteredMetrics = this.metricsHistory.filter(metrics => 
      metrics.timestamp >= startDate && metrics.timestamp <= endDate
    );

    // Aggregate by granularity if needed
    if (granularity !== 'hourly') {
      return this.aggregateMetrics(filteredMetrics, granularity);
    }

    return filteredMetrics;
  }

  /**
   * Configure monitoring alerts
   */
  async configureAlerts(
    tenantId: string,
    config: Partial<z.infer<typeof AlertConfigSchema>>
  ): Promise<void> {
    this.alertConfig.enabled = config.enabled ?? this.alertConfig.enabled;
    this.alertConfig.thresholds = { ...this.alertConfig.thresholds, ...config.thresholds };
    this.alertConfig.notifications = { ...this.alertConfig.notifications, ...config.notifications };
    this.alertConfig.recipients = config.recipients ?? this.alertConfig.recipients;
    this.alertConfig.cooldownPeriod = config.cooldownPeriod ?? this.alertConfig.cooldownPeriod;

    this.logger.log(`Alert configuration updated for tenant ${tenantId}`);
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    uptime: number;
    responseTime: number;
    errorRate: number;
  }> {
    const currentMetrics = await this.getCurrentMetrics();
    
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    
    if (currentMetrics.successRate < this.alertConfig.thresholds.successRate) {
      status = 'CRITICAL';
    } else if (currentMetrics.fraudRate > this.alertConfig.thresholds.fraudRate) {
      status = 'WARNING';
    } else if (currentMetrics.averageProcessingTime > this.alertConfig.thresholds.averageProcessingTime) {
      status = 'WARNING';
    }

    return {
      status,
      uptime: 99.9, // Mock uptime percentage
      responseTime: currentMetrics.averageProcessingTime,
      errorRate: 1 - currentMetrics.successRate,
    };
  }

  /**
   * Update real-time metrics based on payment event
   */
  private async updateRealTimeMetrics(event: Record<string, unknown>): Promise<void> {
    // This would typically update a real-time metrics store like Redis
    // For now, we'll simulate the update
    this.logger.debug(`Updating real-time metrics for event: ${event.type}`);
  }

  /**
   * Get current metrics snapshot
   */
  private async getCurrentMetrics(): Promise<PaymentMetrics> {
    // Mock current metrics - in production, this would query the metrics store
    return {
      timestamp: new Date(),
      totalPayments: 1250,
      successfulPayments: 1180,
      failedPayments: 45,
      pendingPayments: 25,
      totalVolume: 1250000,
      averageAmount: 1000,
      successRate: 0.944,
      fraudRate: 0.036,
      averageProcessingTime: 1200,
      topProviders: [
        { provider: 'STRIPE', count: 500, percentage: 0.4, volume: 500000 },
        { provider: 'PAYPAL', count: 400, percentage: 0.32, volume: 400000 },
        { provider: 'BRAINTREE', count: 350, percentage: 0.28, volume: 350000 },
      ],
      topMethods: [
        { method: 'CREDIT_CARD', count: 800, percentage: 0.64, volume: 800000 },
        { method: 'DEBIT_CARD', count: 300, percentage: 0.24, volume: 300000 },
        { method: 'DIGITAL_WALLET', count: 150, percentage: 0.12, volume: 150000 },
      ],
      hourlyDistribution: this.generateHourlyDistribution(),
      geographicDistribution: [
        { country: 'US', count: 600, percentage: 0.48, volume: 600000 },
        { country: 'CA', count: 200, percentage: 0.16, volume: 200000 },
        { country: 'GB', count: 150, percentage: 0.12, volume: 150000 },
        { country: 'DE', count: 100, percentage: 0.08, volume: 100000 },
        { country: 'FR', count: 100, percentage: 0.08, volume: 100000 },
        { country: 'AU', count: 100, percentage: 0.08, volume: 100000 },
      ],
    };
  }

  /**
   * Get historical metrics
   */
  private getHistoricalMetrics(hours: number): Array<{ date: string; metrics: PaymentMetrics }> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory
      .filter(metrics => metrics.timestamp > cutoffTime)
      .map(metrics => ({
        date: metrics.timestamp.toISOString(),
        metrics,
      }));
  }

  /**
   * Get active alerts
   */
  private getActiveAlerts(): RealTimeAlert[] {
    return this.activeAlerts.filter(alert => !alert.resolved);
  }

  /**
   * Get trends data
   */
  private async getTrends(): Promise<{
    successRateTrend: Array<{ date: string; value: number }>;
    volumeTrend: Array<{ date: string; value: number }>;
    fraudTrend: Array<{ date: string; value: number }>;
  }> {
    const historicalMetrics = this.getHistoricalMetrics(24);
    
    return {
      successRateTrend: historicalMetrics.map(h => ({
        date: h.date,
        value: h.metrics.successRate,
      })),
      volumeTrend: historicalMetrics.map(h => ({
        date: h.date,
        value: h.metrics.totalVolume,
      })),
      fraudTrend: historicalMetrics.map(h => ({
        date: h.date,
        value: h.metrics.fraudRate,
      })),
    };
  }

  /**
   * Check for alerts based on current metrics
   */
  private async checkAlerts(): Promise<void> {
    if (!this.alertConfig.enabled) return;

    const currentMetrics = await this.getCurrentMetrics();
    const now = new Date();

    // Check success rate alert
    if (currentMetrics.successRate < this.alertConfig.thresholds.successRate) {
      await this.createAlert({
        type: 'SUCCESS_RATE',
        severity: 'CRITICAL',
        message: `Success rate ${(currentMetrics.successRate * 100).toFixed(1)}% below threshold ${(this.alertConfig.thresholds.successRate * 100).toFixed(1)}%`,
        value: currentMetrics.successRate,
        threshold: this.alertConfig.thresholds.successRate,
        timestamp: now,
      });
    }

    // Check fraud rate alert
    if (currentMetrics.fraudRate > this.alertConfig.thresholds.fraudRate) {
      await this.createAlert({
        type: 'FRAUD_RATE',
        severity: 'HIGH',
        message: `Fraud rate ${(currentMetrics.fraudRate * 100).toFixed(1)}% above threshold ${(this.alertConfig.thresholds.fraudRate * 100).toFixed(1)}%`,
        value: currentMetrics.fraudRate,
        threshold: this.alertConfig.thresholds.fraudRate,
        timestamp: now,
      });
    }

    // Check processing time alert
    if (currentMetrics.averageProcessingTime > this.alertConfig.thresholds.averageProcessingTime) {
      await this.createAlert({
        type: 'PROCESSING_TIME',
        severity: 'MEDIUM',
        message: `Average processing time ${currentMetrics.averageProcessingTime}ms above threshold ${this.alertConfig.thresholds.averageProcessingTime}ms`,
        value: currentMetrics.averageProcessingTime,
        threshold: this.alertConfig.thresholds.averageProcessingTime,
        timestamp: now,
      });
    }
  }

  /**
   * Create a new alert
   */
  private async createAlert(alertData: Omit<RealTimeAlert, 'alertId' | 'resolved'>): Promise<void> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const alert: RealTimeAlert = {
      ...alertData,
      alertId,
      resolved: false,
    };

    // Check cooldown period
    const cooldownKey = `${alertData.type}_${alertData.severity}`;
    const lastAlert = this.alertCooldowns.get(cooldownKey);
    
    if (lastAlert && (Date.now() - lastAlert.getTime()) < (this.alertConfig.cooldownPeriod * 1000)) {
      this.logger.debug(`Alert ${alertId} suppressed due to cooldown period`);
      return;
    }

    this.activeAlerts.push(alert);
    this.alertCooldowns.set(cooldownKey, new Date());

    this.logger.warn(`Alert created: ${alert.message}`);

    // Send notifications
    await this.sendAlertNotifications(alert);
  }

  /**
   * Send alert notifications
   */
  private async sendAlertNotifications(alert: RealTimeAlert): Promise<void> {
    const message = `[${alert.severity}] ${alert.message}`;

    if (this.alertConfig.notifications.email) {
      await this.sendEmailNotification(message, alert);
    }

    if (this.alertConfig.notifications.slack) {
      await this.sendSlackNotification(message, alert);
    }

    if (this.alertConfig.notifications.webhook) {
      await this.sendWebhookNotification(message, alert);
    }

    if (this.alertConfig.notifications.sms) {
      await this.sendSMSNotification(message, alert);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(message: string, alert: RealTimeAlert): Promise<void> {
    this.logger.log(`Email notification sent: ${message}`);
    // In production, this would send actual emails
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(message: string, alert: RealTimeAlert): Promise<void> {
    this.logger.log(`Slack notification sent: ${message}`);
    // In production, this would send to Slack
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(message: string, alert: RealTimeAlert): Promise<void> {
    this.logger.log(`Webhook notification sent: ${message}`);
    // In production, this would send to configured webhooks
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(message: string, alert: RealTimeAlert): Promise<void> {
    this.logger.log(`SMS notification sent: ${message}`);
    // In production, this would send SMS
  }

  /**
   * Aggregate metrics by granularity
   */
  private aggregateMetrics(metrics: PaymentMetrics[], granularity: string): PaymentMetrics[] {
    // Mock aggregation - in production, this would properly aggregate metrics
    return metrics;
  }

  /**
   * Generate hourly distribution data
   */
  private generateHourlyDistribution(): Array<{ hour: number; count: number; volume: number }> {
    const distribution = [];
    for (let hour = 0; hour < 24; hour++) {
      // Mock data - in production, this would be calculated from actual data
      const count = Math.floor(Math.random() * 100) + 10;
      const volume = count * (Math.random() * 1000 + 100);
      distribution.push({ hour, count, volume });
    }
    return distribution;
  }
}
