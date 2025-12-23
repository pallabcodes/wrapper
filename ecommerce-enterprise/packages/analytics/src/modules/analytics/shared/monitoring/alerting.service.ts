import { Injectable, Logger } from '@nestjs/common';
import { AlertRule, Alert, MetricsSnapshot } from './health-check.types';
import { MetricsService } from './metrics.service';

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private readonly rules = new Map<string, AlertRule>();
  private readonly activeAlerts = new Map<string, Alert>();
  private readonly alertHistory: Alert[] = [];

  constructor(
    private readonly metricsService: MetricsService,
  ) {
    this.initializeDefaultRules();
  }

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    this.logger.log(`Added alert rule: ${rule.name}`);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.logger.log(`Removed alert rule: ${ruleId}`);
  }

  updateRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    this.logger.log(`Updated alert rule: ${rule.name}`);
  }

  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  async evaluateRules(): Promise<void> {
    const snapshot = this.metricsService.getSnapshot();
    
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      try {
        const shouldAlert = await this.evaluateRule(rule, snapshot);
        
        if (shouldAlert) {
          await this.triggerAlert(rule, snapshot);
        } else {
          await this.resolveAlert(rule.id);
        }
      } catch (error) {
        this.logger.error(`Error evaluating rule ${rule.name}`, error);
      }
    }
  }

  private async evaluateRule(rule: AlertRule, snapshot: MetricsSnapshot): Promise<boolean> {
    const { condition, threshold } = rule;
    
    // Check cooldown
    if (rule.lastTriggered) {
      const lastTriggered = new Date(rule.lastTriggered);
      const cooldownMs = rule.cooldown * 60 * 1000;
      if (Date.now() - lastTriggered.getTime() < cooldownMs) {
        return false;
      }
    }

    // Evaluate condition based on metrics
    const value = this.getMetricValue(condition, snapshot);
    return value > threshold;
  }

  private getMetricValue(condition: string, snapshot: MetricsSnapshot): number {
    // Simple condition parser - in production, use a proper expression evaluator
    const parts = condition.split('.');
    if (parts.length >= 2) {
      const [type, ...rest] = parts;
      const name = rest.join('.');
      
      switch (type) {
        case 'counter':
          return snapshot.counters[name] || 0;
        case 'gauge':
          return snapshot.gauges[name] || 0;
        case 'rate':
          return snapshot.rates[name] || 0;
        case 'histogram':
          const histogram = snapshot.histograms[name as keyof typeof snapshot.histograms];
          if (!histogram) return 0;
          
          // Support different histogram metrics
          if (name.endsWith('.p95')) return histogram.p95;
          if (name.endsWith('.p99')) return histogram.p99;
          if (name.endsWith('.mean')) return histogram.mean;
          if (name.endsWith('.max')) return histogram.max;
          return histogram.mean;
        default:
          return 0;
      }
    }
    
    return 0;
  }

  private async triggerAlert(rule: AlertRule, snapshot: MetricsSnapshot): Promise<void> {
    const alertId = `${rule.id}-${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      severity: rule.severity,
      message: `${rule.name}: ${rule.condition} exceeded threshold ${rule.threshold}`,
      timestamp: new Date().toISOString(),
      resolved: false,
      metadata: {
        condition: rule.condition,
        threshold: rule.threshold,
        currentValue: this.getMetricValue(rule.condition, snapshot),
        snapshot: {
          timestamp: snapshot.timestamp,
          counters: Object.keys(snapshot.counters).length,
          gauges: Object.keys(snapshot.gauges).length,
          histograms: Object.keys(snapshot.histograms).length,
          rates: Object.keys(snapshot.rates).length,
        },
      },
    };

    this.activeAlerts.set(rule.id, alert);
    this.alertHistory.push(alert);
    
    // Update rule last triggered
    rule.lastTriggered = alert.timestamp;
    this.rules.set(rule.id, rule);

    this.logger.warn(`Alert triggered: ${alert.message}`, {
      alertId,
      ruleId: rule.id,
      severity: rule.severity,
      metadata: alert.metadata,
    });

    // Send notifications
    await this.sendNotifications(alert, rule);
  }

  private async resolveAlert(ruleId: string): Promise<void> {
    const alert = this.activeAlerts.get(ruleId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      
      this.logger.log(`Alert resolved: ${alert.message}`, {
        alertId: alert.id,
        ruleId,
        resolvedAt: alert.resolvedAt,
      });

      this.activeAlerts.delete(ruleId);
    }
  }

  private async sendNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    // In production, integrate with notification services like:
    // - Slack webhooks
    // - PagerDuty
    // - Email services
    // - SMS services
    
    for (const notification of rule.notifications) {
      try {
        await this.sendNotification(notification, alert);
      } catch (error) {
        this.logger.error(`Failed to send notification to ${notification}`, error);
      }
    }
  }

  private async sendNotification(notification: string, alert: Alert): Promise<void> {
    // Mock notification sending
    this.logger.log(`Sending notification to ${notification}: ${alert.message}`);
    
    // In production, implement actual notification logic
    // Example: Slack webhook, email, SMS, etc.
  }

  private initializeDefaultRules(): void {
    // High memory usage alert
    this.addRule({
      id: 'high-memory-usage',
      name: 'High Memory Usage',
      condition: 'gauge.memory_usage_percent',
      threshold: 85,
      severity: 'high',
      enabled: true,
      cooldown: 5,
      notifications: ['slack-alerts', 'email-alerts'],
    });

    // High CPU usage alert
    this.addRule({
      id: 'high-cpu-usage',
      name: 'High CPU Usage',
      condition: 'gauge.cpu_usage_percent',
      threshold: 80,
      severity: 'high',
      enabled: true,
      cooldown: 5,
      notifications: ['slack-alerts'],
    });

    // High error rate alert
    this.addRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      condition: 'rate.error_rate',
      threshold: 0.05, // 5% error rate
      severity: 'critical',
      enabled: true,
      cooldown: 2,
      notifications: ['slack-alerts', 'pagerduty'],
    });

    // High response time alert
    this.addRule({
      id: 'high-response-time',
      name: 'High Response Time',
      condition: 'histogram.response_time.p95',
      threshold: 1000, // 1 second
      severity: 'medium',
      enabled: true,
      cooldown: 10,
      notifications: ['slack-alerts'],
    });

    // Low available memory alert
    this.addRule({
      id: 'low-available-memory',
      name: 'Low Available Memory',
      condition: 'gauge.available_memory_mb',
      threshold: 100, // Less than 100MB available
      severity: 'critical',
      enabled: true,
      cooldown: 2,
      notifications: ['slack-alerts', 'pagerduty'],
    });
  }
}
