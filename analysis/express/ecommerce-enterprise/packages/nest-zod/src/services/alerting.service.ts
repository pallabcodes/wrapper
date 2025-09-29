import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PerformanceMonitoringService } from './performance-monitoring.service';
import { AdvancedCachingService } from './advanced-caching.service';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (metrics: Record<string, unknown>) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // milliseconds
  channels: string[];
  tags?: string[] | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolvedAt?: Date | undefined;
  status: 'active' | 'resolved' | 'acknowledged';
  data: Record<string, unknown>;
  channels: string[];
  tags?: string[] | undefined;
}

export interface AlertChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'discord' | 'teams' | 'pagerduty';
  config: Record<string, unknown>;
  enabled: boolean;
  rateLimit?: {
    maxAlerts: number;
    timeWindow: number; // milliseconds
  };
}

export interface AlertingConfig {
  enableAlerting: boolean;
  defaultCooldown: number; // milliseconds
  maxAlertsPerRule: number;
  alertRetentionDays: number;
  enableRateLimiting: boolean;
  enableDeduplication: boolean;
  enableEscalation: boolean;
  escalationDelay: number; // milliseconds
}

@Injectable()
export class AlertingService implements OnModuleInit {
  private readonly logger = new Logger(AlertingService.name);
  
  private alertRules = new Map<string, AlertRule>();
  private activeAlerts = new Map<string, Alert>();
  private alertHistory: Alert[] = [];
  private channels = new Map<string, AlertChannel>();
  private lastAlertTimes = new Map<string, number>();
  
  private config: AlertingConfig = {
    enableAlerting: true,
    defaultCooldown: 5 * 60 * 1000, // 5 minutes
    maxAlertsPerRule: 100,
    alertRetentionDays: 30,
    enableRateLimiting: true,
    enableDeduplication: true,
    enableEscalation: true,
    escalationDelay: 15 * 60 * 1000, // 15 minutes
  };

  constructor(
    private readonly performanceMonitoring: PerformanceMonitoringService,
    private readonly cachingService: AdvancedCachingService
  ) {}

  async onModuleInit() {
    this.logger.log('Alerting Service initialized');
    
    if (this.config.enableAlerting) {
      this.setupDefaultRules();
      this.startMonitoring();
    }
  }

  /**
   * Add an alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.logger.log(`Added alert rule: ${rule.name}`);
  }

  /**
   * Remove an alert rule
   */
  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    this.logger.log(`Removed alert rule: ${ruleId}`);
  }

  /**
   * Update an alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      const updatedRule = { ...rule, ...updates };
      this.alertRules.set(ruleId, updatedRule);
      this.logger.log(`Updated alert rule: ${ruleId}`);
    }
  }

  /**
   * Add an alert channel
   */
  addAlertChannel(channel: AlertChannel): void {
    this.channels.set(channel.id, channel);
    this.logger.log(`Added alert channel: ${channel.name}`);
  }

  /**
   * Remove an alert channel
   */
  removeAlertChannel(channelId: string): void {
    this.channels.delete(channelId);
    this.logger.log(`Removed alert channel: ${channelId}`);
  }

  /**
   * Update an alert channel
   */
  updateAlertChannel(channelId: string, updates: Partial<AlertChannel>): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      const updatedChannel = { ...channel, ...updates };
      this.channels.set(channelId, updatedChannel);
      this.logger.log(`Updated alert channel: ${channelId}`);
    }
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, userId?: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'acknowledged';
      this.logger.log(`Alert acknowledged: ${alertId} by ${userId || 'unknown'}`);
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, userId?: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      this.activeAlerts.delete(alertId);
      this.alertHistory.push(alert);
      this.logger.log(`Alert resolved: ${alertId} by ${userId || 'unknown'}`);
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit?: number): Alert[] {
    const history = this.alertHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: Alert['severity']): Alert[] {
    return [...this.activeAlerts.values(), ...this.alertHistory].filter(
      alert => alert.severity === severity
    );
  }

  /**
   * Get alerts by rule
   */
  getAlertsByRule(ruleId: string): Alert[] {
    return [...this.activeAlerts.values(), ...this.alertHistory].filter(
      alert => alert.ruleId === ruleId
    );
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(): {
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    acknowledgedAlerts: number;
    alertsBySeverity: Record<string, number>;
    alertsByRule: Record<string, number>;
    averageResolutionTime: number;
  } {
    const allAlerts = [...this.activeAlerts.values(), ...this.alertHistory];
    const resolvedAlerts = allAlerts.filter(alert => alert.status === 'resolved');
    
    const alertsBySeverity = allAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const alertsByRule = allAlerts.reduce((acc, alert) => {
      acc[alert.ruleId] = (acc[alert.ruleId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageResolutionTime = resolvedAlerts.length > 0
      ? resolvedAlerts.reduce((acc, alert) => {
          if (alert.resolvedAt) {
            return acc + (alert.resolvedAt.getTime() - alert.timestamp.getTime());
          }
          return acc;
        }, 0) / resolvedAlerts.length
      : 0;

    return {
      totalAlerts: allAlerts.length,
      activeAlerts: this.activeAlerts.size,
      resolvedAlerts: resolvedAlerts.length,
      acknowledgedAlerts: allAlerts.filter(alert => alert.status === 'acknowledged').length,
      alertsBySeverity,
      alertsByRule,
      averageResolutionTime,
    };
  }

  /**
   * Start monitoring for alerts
   */
  private startMonitoring(): void {
    setInterval(() => {
      this.checkAlertRules();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check all alert rules
   */
  private async checkAlertRules(): Promise<void> {
    if (!this.config.enableAlerting) return;

    const performanceMetrics = this.performanceMonitoring.getPerformanceMetrics();
    const cacheStats = this.cachingService.getCacheStatistics();
    const schemaStats = this.performanceMonitoring.getSchemaStats();

    const metrics = {
      performance: performanceMetrics,
      cache: cacheStats,
      schemas: schemaStats,
    };

    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      try {
        if (rule.condition(metrics)) {
          await this.triggerAlert(rule, metrics);
        } else {
          // Check if we should resolve any active alerts for this rule
          this.checkAlertResolution(ruleId);
        }
      } catch (error) {
        this.logger.error(`Error checking alert rule ${ruleId}:`, error);
      }
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule, metrics: Record<string, unknown>): Promise<void> {
    const now = Date.now();
    const lastAlertTime = this.lastAlertTimes.get(rule.id) || 0;
    
    // Check cooldown
    if (now - lastAlertTime < rule.cooldown) {
      return;
    }

    // Check rate limiting
    if (this.config.enableRateLimiting && this.isRateLimited(rule)) {
      return;
    }

    // Check deduplication
    if (this.config.enableDeduplication && this.isDuplicateAlert(rule)) {
      return;
    }

    const alert: Alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      message: this.generateAlertMessage(rule, metrics),
      severity: rule.severity,
      timestamp: new Date(),
      status: 'active',
      data: metrics,
      channels: rule.channels,
      tags: rule.tags || undefined,
    };

    this.activeAlerts.set(alert.id, alert);
    this.lastAlertTimes.set(rule.id, now);

    // Send alerts to channels
    await this.sendAlertToChannels(alert);

    this.logger.warn(`Alert triggered: ${rule.name} - ${alert.message}`);
  }

  /**
   * Check if alert should be resolved
   */
  private checkAlertResolution(ruleId: string): void {
    const activeAlerts = Array.from(this.activeAlerts.values())
      .filter(alert => alert.ruleId === ruleId);

    for (const alert of activeAlerts) {
      // Check if alert has been active for too long and should be escalated
      if (this.config.enableEscalation) {
        const alertAge = Date.now() - alert.timestamp.getTime();
        if (alertAge > this.config.escalationDelay && alert.status === 'active') {
          this.escalateAlert(alert);
        }
      }
    }
  }

  /**
   * Escalate an alert
   */
  private escalateAlert(alert: Alert): void {
    // Increase severity
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    const currentIndex = severityOrder.indexOf(alert.severity);
    if (currentIndex < severityOrder.length - 1) {
      alert.severity = severityOrder[currentIndex + 1] as Alert['severity'];
      alert.message = `[ESCALATED] ${alert.message}`;
      
      // Send escalated alert
      this.sendAlertToChannels(alert);
      
      this.logger.warn(`Alert escalated: ${alert.id} to ${alert.severity}`);
    }
  }

  /**
   * Send alert to channels
   */
  private async sendAlertToChannels(alert: Alert): Promise<void> {
    for (const channelId of alert.channels) {
      const channel = this.channels.get(channelId);
      if (!channel || !channel.enabled) continue;

      try {
        await this.sendToChannel(channel, alert);
      } catch (error) {
        this.logger.error(`Failed to send alert to channel ${channelId}:`, error);
      }
    }
  }

  /**
   * Send alert to specific channel
   */
  private async sendToChannel(channel: AlertChannel, alert: Alert): Promise<void> {
    const message = this.formatAlertMessage(alert, channel.type);
    
    switch (channel.type) {
      case 'email':
        await this.sendEmailAlert(channel, message);
        break;
      case 'slack':
        await this.sendSlackAlert(channel, message);
        break;
      case 'webhook':
        await this.sendWebhookAlert(channel, message);
        break;
      case 'discord':
        await this.sendDiscordAlert(channel, message);
        break;
      case 'teams':
        await this.sendTeamsAlert(channel, message);
        break;
      case 'pagerduty':
        await this.sendPagerDutyAlert(channel, message);
        break;
      default:
        this.logger.warn(`Unknown channel type: ${channel.type}`);
    }
  }

  /**
   * Format alert message for different channels
   */
  private formatAlertMessage(alert: Alert, channelType: string): string | Record<string, unknown> {
    const severityEmoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '🚨',
    };

    const baseMessage = `${severityEmoji[alert.severity]} **${alert.severity.toUpperCase()}** - ${alert.message}`;
    
    switch (channelType) {
      case 'slack':
        return {
          text: baseMessage,
          attachments: [{
            color: this.getSeverityColor(alert.severity),
            fields: [
              { title: 'Rule ID', value: alert.ruleId, short: true },
              { title: 'Timestamp', value: alert.timestamp.toISOString(), short: true },
              { title: 'Severity', value: alert.severity, short: true },
            ],
          }],
        };
      case 'discord':
        return {
          embeds: [{
            title: `${severityEmoji[alert.severity]} ${alert.severity.toUpperCase()} Alert`,
            description: alert.message,
            color: this.getSeverityColor(alert.severity),
            fields: [
              { name: 'Rule ID', value: alert.ruleId, inline: true },
              { name: 'Timestamp', value: alert.timestamp.toISOString(), inline: true },
            ],
            timestamp: alert.timestamp.toISOString(),
          }],
        };
      default:
        return baseMessage;
    }
  }

  /**
   * Get severity color for channels
   */
  private getSeverityColor(severity: Alert['severity']): string {
    const colors = {
      low: '#ffeb3b',
      medium: '#ff9800',
      high: '#f44336',
      critical: '#d32f2f',
    };
    return colors[severity];
  }

  /**
   * Check if alert is rate limited
   */
  private isRateLimited(rule: AlertRule): boolean {
    const channelId = rule.channels[0];
    if (!channelId) return false;
    
    const channel = this.channels.get(channelId);
    if (!channel?.rateLimit) return false;

    const now = Date.now();
    const timeWindow = channel.rateLimit.timeWindow;
    const maxAlerts = channel.rateLimit.maxAlerts;
    
    // Count alerts in time window
    const recentAlerts = this.alertHistory.filter(
      alert => alert.ruleId === rule.id && 
      (now - alert.timestamp.getTime()) <= timeWindow
    );

    return recentAlerts.length >= maxAlerts;
  }

  /**
   * Check if alert is duplicate
   */
  private isDuplicateAlert(rule: AlertRule): boolean {
    const recentAlerts = this.alertHistory.filter(
      alert => alert.ruleId === rule.id &&
      (Date.now() - alert.timestamp.getTime()) <= rule.cooldown
    );

    return recentAlerts.length > 0;
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, _metrics: Record<string, unknown>): string {
    return `${rule.name}: ${rule.description}`;
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultRules(): void {
    // High error rate alert
    this.addAlertRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      description: 'Validation error rate is above threshold',
      condition: (metrics) => {
        const perf = (metrics['performance'] as { errorRate?: number }) || {};
        return (perf.errorRate ?? 0) > 0.1;
      },
      severity: 'high',
      enabled: true,
      cooldown: 5 * 60 * 1000,
      channels: ['default'],
      tags: ['performance', 'error'],
    });

    // Slow validation alert
    this.addAlertRule({
      id: 'slow_validation',
      name: 'Slow Validation',
      description: 'Average validation time is above threshold',
      condition: (metrics) => {
        const perf = (metrics['performance'] as { averageValidationTime?: number }) || {};
        return (perf.averageValidationTime ?? 0) > 1000;
      },
      severity: 'medium',
      enabled: true,
      cooldown: 10 * 60 * 1000,
      channels: ['default'],
      tags: ['performance', 'latency'],
    });

    // High memory usage alert
    this.addAlertRule({
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      description: 'Memory usage is above threshold',
      condition: (metrics) => {
        const perf = (metrics['performance'] as { memoryUsage?: number }) || {};
        return (perf.memoryUsage ?? 0) > 0.8;
      },
      severity: 'high',
      enabled: true,
      cooldown: 5 * 60 * 1000,
      channels: ['default'],
      tags: ['performance', 'memory'],
    });

    // Low cache hit rate alert
    this.addAlertRule({
      id: 'low_cache_hit_rate',
      name: 'Low Cache Hit Rate',
      description: 'Cache hit rate is below threshold',
      condition: (metrics) => {
        const perf = (metrics['performance'] as { cacheHitRate?: number }) || {};
        return (perf.cacheHitRate ?? 1) < 0.5;
      },
      severity: 'medium',
      enabled: true,
      cooldown: 15 * 60 * 1000,
      channels: ['default'],
      tags: ['performance', 'cache'],
    });
  }

  /**
   * Placeholder methods for different channel types
   */
  private async sendEmailAlert(_channel: AlertChannel, message: string | Record<string, unknown>): Promise<void> {
    // Implement email sending
    this.logger.log(`Email alert sent: ${message}`);
  }

  private async sendSlackAlert(_channel: AlertChannel, message: string | Record<string, unknown>): Promise<void> {
    // Implement Slack webhook
    this.logger.log(`Slack alert sent: ${message}`);
  }

  private async sendWebhookAlert(_channel: AlertChannel, message: string | Record<string, unknown>): Promise<void> {
    // Implement webhook sending
    this.logger.log(`Webhook alert sent: ${message}`);
  }

  private async sendDiscordAlert(_channel: AlertChannel, message: string | Record<string, unknown>): Promise<void> {
    // Implement Discord webhook
    this.logger.log(`Discord alert sent: ${message}`);
  }

  private async sendTeamsAlert(_channel: AlertChannel, message: string | Record<string, unknown>): Promise<void> {
    // Implement Teams webhook
    this.logger.log(`Teams alert sent: ${message}`);
  }

  private async sendPagerDutyAlert(_channel: AlertChannel, message: string | Record<string, unknown>): Promise<void> {
    // Implement PagerDuty API
    this.logger.log(`PagerDuty alert sent: ${message}`);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AlertingConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log('Alerting configuration updated');
  }

  /**
   * Get configuration
   */
  getConfig(): AlertingConfig {
    return { ...this.config };
  }
}
