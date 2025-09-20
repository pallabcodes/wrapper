import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertingService } from './alerting.service';
import { MetricsService } from './metrics.service';
import { HealthCheckService } from './health-check.service';

@Injectable()
export class MonitoringScheduler {
  private readonly logger = new Logger(MonitoringScheduler.name);

  constructor(
    private readonly alertingService: AlertingService,
    private readonly metricsService: MetricsService,
    private readonly healthCheckService: HealthCheckService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async evaluateAlerts(): Promise<void> {
    try {
      this.logger.debug('Evaluating alert rules');
      await this.alertingService.evaluateRules();
    } catch (error) {
      this.logger.error('Failed to evaluate alerts', error);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupMetrics(): Promise<void> {
    try {
      this.logger.debug('Cleaning up old metrics data');
      this.metricsService.cleanup();
    } catch (error) {
      this.logger.error('Failed to cleanup metrics', error);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async recordSystemMetrics(): Promise<void> {
    try {
      // Record system-level metrics
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Memory metrics
      this.metricsService.setGauge('system.memory.heap_used_mb', Math.round(memoryUsage.heapUsed / 1024 / 1024));
      this.metricsService.setGauge('system.memory.heap_total_mb', Math.round(memoryUsage.heapTotal / 1024 / 1024));
      this.metricsService.setGauge('system.memory.rss_mb', Math.round(memoryUsage.rss / 1024 / 1024));
      this.metricsService.setGauge('system.memory.external_mb', Math.round(memoryUsage.external / 1024 / 1024));
      this.metricsService.setGauge('system.memory.array_buffers_mb', Math.round(memoryUsage.arrayBuffers / 1024 / 1024));

      // Calculate memory usage percentage (assuming 512MB limit)
      const maxMemoryMB = 512;
      const memoryUsagePercent = (memoryUsage.rss / 1024 / 1024 / maxMemoryMB) * 100;
      this.metricsService.setGauge('system.memory.usage_percent', memoryUsagePercent);

      // CPU metrics
      this.metricsService.setGauge('system.cpu.user_time', cpuUsage.user);
      this.metricsService.setGauge('system.cpu.system_time', cpuUsage.system);

      // Process metrics
      this.metricsService.setGauge('system.process.uptime_seconds', process.uptime());
      this.metricsService.setGauge('system.process.pid', process.pid);
      this.metricsService.setGauge('system.process.version', parseFloat(process.version.slice(1)));

      // Event loop lag measurement
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
        this.metricsService.recordHistogram('system.event_loop_lag', lag);
      });

    } catch (error) {
      this.logger.error('Failed to record system metrics', error);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async performHealthCheck(): Promise<void> {
    try {
      this.logger.debug('Performing scheduled health check');
      const health = await this.healthCheckService.checkHealth({ detailed: false });
      
      // Record health status as metrics
      this.metricsService.setGauge('system.health.status', health.status === 'healthy' ? 1 : 0);
      this.metricsService.setGauge('system.health.checks_total', health.summary.total);
      this.metricsService.setGauge('system.health.checks_healthy', health.summary.healthy);
      this.metricsService.setGauge('system.health.checks_unhealthy', health.summary.unhealthy);
      this.metricsService.setGauge('system.health.checks_degraded', health.summary.degraded);

      if (health.status !== 'healthy') {
        this.logger.warn('Health check failed', {
          status: health.status,
          summary: health.summary,
          checks: health.checks.map(c => ({ name: c.name, status: c.status, message: c.message })),
        });
      }
    } catch (error) {
      this.logger.error('Failed to perform health check', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async generateMetricsReport(): Promise<void> {
    try {
      this.logger.debug('Generating metrics report');
      const snapshot = this.metricsService.getSnapshot();
      const activeAlerts = this.alertingService.getActiveAlerts();
      
      this.logger.log('Metrics report generated', {
        timestamp: snapshot.timestamp,
        counters: Object.keys(snapshot.counters).length,
        gauges: Object.keys(snapshot.gauges).length,
        histograms: Object.keys(snapshot.histograms).length,
        rates: Object.keys(snapshot.rates).length,
        activeAlerts: activeAlerts.length,
      });

      // Log top metrics for monitoring
      const topCounters = Object.entries(snapshot.counters)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      
      const topGauges = Object.entries(snapshot.gauges)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      if (topCounters.length > 0) {
        this.logger.log('Top counters', { counters: topCounters });
      }

      if (topGauges.length > 0) {
        this.logger.log('Top gauges', { gauges: topGauges });
      }

      if (activeAlerts.length > 0) {
        this.logger.warn('Active alerts', {
          alerts: activeAlerts.map(a => ({
            id: a.id,
            severity: a.severity,
            message: a.message,
            timestamp: a.timestamp,
          })),
        });
      }
    } catch (error) {
      this.logger.error('Failed to generate metrics report', error);
    }
  }
}
