import { Controller, Get, Post, Body, Query, Logger } from '@nestjs/common';
import { HealthCheckService } from './health-check.service';
import { MetricsService } from './metrics.service';
import { AlertingService } from './alerting.service';
import { SystemHealth, MetricsSnapshot, AlertRule, Alert } from './health-check.types';

@Controller('monitoring')
export class MonitoringController {
  private readonly logger = new Logger(MonitoringController.name);

  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly metricsService: MetricsService,
    private readonly alertingService: AlertingService,
  ) {}

  @Get('health')
  async getHealth(@Query('detailed') detailed?: string): Promise<SystemHealth> {
    this.logger.debug('Health check requested', { detailed });
    
    const health = await this.healthCheckService.checkHealth({
      detailed: detailed === 'true',
    });

    this.logger.log('Health check completed', {
      status: health.status,
      checksCount: health.checks.length,
      summary: health.summary,
    });

    return health;
  }

  @Get('metrics')
  async getMetrics(): Promise<MetricsSnapshot> {
    this.logger.debug('Metrics requested');
    
    const snapshot = this.metricsService.getSnapshot();
    
    this.logger.log('Metrics snapshot generated', {
      timestamp: snapshot.timestamp,
      countersCount: Object.keys(snapshot.counters).length,
      gaugesCount: Object.keys(snapshot.gauges).length,
      histogramsCount: Object.keys(snapshot.histograms).length,
      ratesCount: Object.keys(snapshot.rates).length,
    });

    return snapshot;
  }

  @Get('alerts')
  async getAlerts(): Promise<{
    active: Alert[];
    history: Alert[];
    rules: AlertRule[];
  }> {
    this.logger.debug('Alerts requested');
    
    const active = this.alertingService.getActiveAlerts();
    const history = this.alertingService.getAlertHistory(50);
    const rules = this.alertingService.getRules();

    this.logger.log('Alerts retrieved', {
      activeCount: active.length,
      historyCount: history.length,
      rulesCount: rules.length,
    });

    return { active, history, rules };
  }

  @Post('alerts/rules')
  async createAlertRule(@Body() rule: AlertRule): Promise<{ success: boolean; rule: AlertRule }> {
    this.logger.log('Creating alert rule', { name: rule.name, condition: rule.condition });
    
    this.alertingService.addRule(rule);
    
    this.logger.log('Alert rule created successfully', { ruleId: rule.id });
    
    return { success: true, rule };
  }

  @Post('alerts/rules/:ruleId')
  async updateAlertRule(
    @Body() rule: AlertRule,
  ): Promise<{ success: boolean; rule: AlertRule }> {
    this.logger.log('Updating alert rule', { ruleId: rule.id, name: rule.name });
    
    this.alertingService.updateRule(rule);
    
    this.logger.log('Alert rule updated successfully', { ruleId: rule.id });
    
    return { success: true, rule };
  }

  @Post('alerts/rules/:ruleId/delete')
  async deleteAlertRule(@Query('ruleId') ruleId: string): Promise<{ success: boolean }> {
    this.logger.log('Deleting alert rule', { ruleId });
    
    this.alertingService.removeRule(ruleId);
    
    this.logger.log('Alert rule deleted successfully', { ruleId });
    
    return { success: true };
  }

  @Post('alerts/evaluate')
  async evaluateAlerts(): Promise<{ success: boolean; evaluated: number }> {
    this.logger.log('Evaluating alert rules');
    
    await this.alertingService.evaluateRules();
    
    const rulesCount = this.alertingService.getRules().length;
    
    this.logger.log('Alert rules evaluated', { rulesCount });
    
    return { success: true, evaluated: rulesCount };
  }

  @Get('status')
  async getStatus(): Promise<{
    health: SystemHealth;
    metrics: MetricsSnapshot;
    alerts: { active: number; total: number };
    uptime: number;
  }> {
    this.logger.debug('Status dashboard requested');
    
    const [health, metrics] = await Promise.all([
      this.healthCheckService.checkHealth({ detailed: false }),
      this.metricsService.getSnapshot(),
    ]);
    
    const activeAlerts = this.alertingService.getActiveAlerts();
    const allRules = this.alertingService.getRules();
    
    const status = {
      health,
      metrics,
      alerts: {
        active: activeAlerts.length,
        total: allRules.length,
      },
      uptime: process.uptime(),
    };

    this.logger.log('Status dashboard generated', {
      healthStatus: health.status,
      activeAlerts: activeAlerts.length,
      uptime: status.uptime,
    });

    return status;
  }

  @Post('metrics/reset')
  async resetMetrics(): Promise<{ success: boolean }> {
    this.logger.log('Resetting all metrics');
    
    this.metricsService.resetAll();
    
    this.logger.log('Metrics reset successfully');
    
    return { success: true };
  }

  @Post('metrics/cleanup')
  async cleanupMetrics(): Promise<{ success: boolean }> {
    this.logger.log('Cleaning up old metrics data');
    
    this.metricsService.cleanup();
    
    this.logger.log('Metrics cleanup completed');
    
    return { success: true };
  }
}
