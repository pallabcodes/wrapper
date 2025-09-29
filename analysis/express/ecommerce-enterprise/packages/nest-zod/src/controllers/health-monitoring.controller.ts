import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { 
  PerformanceMonitoringService,
  AdvancedCachingService,
  SchemaRegistryService,
  AlertingService,
  MetricsDashboardService,
  DistributedTracingService
} from '../services';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  version: string;
  services: {
    performance: ServiceHealth;
    caching: ServiceHealth;
    schemaRegistry: ServiceHealth;
    alerting: ServiceHealth;
    dashboard: ServiceHealth;
    tracing: ServiceHealth;
  };
  metrics: {
    totalValidations: number;
    errorRate: number;
    averageResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  alerts: {
    active: number;
    critical: number;
    recent: Array<{
      id: string;
      message: string;
      severity: string;
      timestamp: Date;
    }>;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  lastCheck: Date;
  metrics?: Record<string, unknown>;
}

export interface HealthCheckOptions {
  includeMetrics?: boolean;
  includeAlerts?: boolean;
  includeTraces?: boolean;
  timeout?: number;
}

@Controller('health')
export class HealthMonitoringController {
  constructor(
    private readonly performanceMonitoring: PerformanceMonitoringService,
    private readonly cachingService: AdvancedCachingService,
    private readonly schemaRegistry: SchemaRegistryService,
    private readonly alertingService: AlertingService,
    private readonly metricsDashboard: MetricsDashboardService,
    private readonly tracingService: DistributedTracingService
  ) {}

  /**
   * Get overall health status
   */
  @Get()
  async getHealthStatus(@Query() options: HealthCheckOptions = {}): Promise<HealthStatus> {
    
    try {
      const services = await this.checkAllServices();
      const overallStatus = this.determineOverallStatus(services);
      
      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp: new Date(),
        uptime: Date.now() - this.startTime,
        version: '1.0.0',
        services,
        metrics: options.includeMetrics ? await this.getSimpleHealthMetrics() : {
          totalValidations: 0,
          errorRate: 0,
          averageResponseTime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
        },
        alerts: options.includeAlerts ? await this.getSimpleHealthAlerts() : {
          active: 0,
          critical: 0,
          recent: [],
        },
      };

      return healthStatus;
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        uptime: Date.now() - this.startTime,
        version: '1.0.0',
        services: {
          performance: { status: 'unhealthy', message: 'Health check failed', lastCheck: new Date() },
          caching: { status: 'unhealthy', message: 'Health check failed', lastCheck: new Date() },
          schemaRegistry: { status: 'unhealthy', message: 'Health check failed', lastCheck: new Date() },
          alerting: { status: 'unhealthy', message: 'Health check failed', lastCheck: new Date() },
          dashboard: { status: 'unhealthy', message: 'Health check failed', lastCheck: new Date() },
          tracing: { status: 'unhealthy', message: 'Health check failed', lastCheck: new Date() },
        },
        metrics: { totalValidations: 0, errorRate: 0, averageResponseTime: 0, memoryUsage: 0, cpuUsage: 0 },
        alerts: { active: 0, critical: 0, recent: [] },
      };
    }
  }

  /**
   * Get detailed health status for a specific service
   */
  @Get('service/:serviceName')
  async getServiceHealth(
    @Param('serviceName') serviceName: string,
    @Query() _options: HealthCheckOptions = {}
  ): Promise<ServiceHealth> {
    switch (serviceName) {
      case 'performance':
        return await this.checkPerformanceService();
      case 'caching':
        return await this.checkCachingService();
      case 'schema-registry':
        return await this.checkSchemaRegistryService();
      case 'alerting':
        return await this.checkAlertingService();
      case 'dashboard':
        return await this.checkDashboardService();
      case 'tracing':
        return await this.checkTracingService();
      default:
        return {
          status: 'unhealthy',
          message: `Unknown service: ${serviceName}`,
          lastCheck: new Date(),
        };
    }
  }

  /**
   * Get simple health metrics for health status
   */
  private async getSimpleHealthMetrics() {
    const metrics = this.performanceMonitoring.getPerformanceMetrics();
    return {
      totalValidations: metrics.totalValidations,
      errorRate: metrics.errorRate,
      averageResponseTime: metrics.averageValidationTime,
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: process.cpuUsage().user
    };
  }

  /**
   * Get simple health alerts for health status
   */
  private async getSimpleHealthAlerts() {
    const activeAlerts = this.alertingService.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
    const recentAlerts = activeAlerts.slice(0, 5).map(alert => ({
      id: alert.id,
      message: alert.message,
      severity: alert.severity,
      timestamp: alert.timestamp
    }));

    return {
      active: activeAlerts.length,
      critical: criticalAlerts.length,
      recent: recentAlerts
    };
  }

  /**
   * Get health metrics
   */
  @Get('metrics')
  async getHealthMetrics() {
    const performanceMetrics = this.performanceMonitoring.getPerformanceMetrics();
    const cacheStats = this.cachingService.getCacheStatistics();
    const schemaStats = this.schemaRegistry.getUsageStats();
    const traceMetrics = this.tracingService.getTraceMetrics();

    return {
      performance: performanceMetrics,
      cache: cacheStats,
      schemas: schemaStats,
      tracing: traceMetrics,
      system: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage(),
      },
    };
  }

  /**
   * Get health alerts
   */
  @Get('alerts')
  async getHealthAlerts() {
    const activeAlerts = this.alertingService.getActiveAlerts();
    const alertStats = this.alertingService.getAlertStatistics();

    return {
      active: activeAlerts,
      statistics: alertStats,
      recent: this.alertingService.getAlertHistory(10),
    };
  }

  /**
   * Get health trends
   */
  @Get('trends')
  async getHealthTrends(@Query('hours') hours = 24) {
    const trends = this.performanceMonitoring.getPerformanceTrends(hours * 60);
    const dashboardStats = this.metricsDashboard.getDashboardStats();

    return {
      performance: trends,
      dashboard: dashboardStats,
      timeRange: {
        hours,
        startTime: new Date(Date.now() - hours * 60 * 60 * 1000),
        endTime: new Date(),
      },
    };
  }

  /**
   * Get health logs
   */
  @Get('logs')
  async getHealthLogs(@Query('limit') limit = 100) {
    // This would integrate with your logging system
    return {
      logs: [],
      total: 0,
      limit,
      message: 'Log integration not implemented',
    };
  }

  /**
   * Trigger health check
   */
  @Post('check')
  async triggerHealthCheck(@Body() options: HealthCheckOptions = {}) {
    const startTime = Date.now();
    
    try {
      const healthStatus = await this.getHealthStatus(options);
      const duration = Date.now() - startTime;
      
      return {
        ...healthStatus,
        checkDuration: duration,
        triggered: true,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        checkDuration: Date.now() - startTime,
        triggered: true,
      };
    }
  }

  /**
   * Acknowledge alert
   */
  @Post('alerts/:alertId/acknowledge')
  async acknowledgeAlert(
    @Param('alertId') alertId: string,
    @Body() data: { userId?: string }
  ) {
    this.alertingService.acknowledgeAlert(alertId, data.userId);
    return { message: 'Alert acknowledged', alertId };
  }

  /**
   * Resolve alert
   */
  @Post('alerts/:alertId/resolve')
  async resolveAlert(
    @Param('alertId') alertId: string,
    @Body() data: { userId?: string }
  ) {
    this.alertingService.resolveAlert(alertId, data.userId);
    return { message: 'Alert resolved', alertId };
  }

  /**
   * Get health configuration
   */
  @Get('config')
  async getHealthConfig() {
    return {
      performance: { enabled: true, interval: 5000 },
      caching: { enabled: true, ttl: 300000 },
      alerting: { enabled: true, channels: ['email', 'slack'] },
      tracing: { enabled: true, sampleRate: 0.1 },
      dashboard: { enabled: true, refreshInterval: 1000 },
    };
  }

  /**
   * Update health configuration
   */
  @Post('config')
  async updateHealthConfig(@Body() _config: Record<string, unknown>) {
    // Configuration updates would be implemented here
    // For now, just return success
    return { message: 'Health configuration updated' };
  }

  /**
   * Check all services
   */
  private async checkAllServices(): Promise<HealthStatus['services']> {
    const [performance, caching, schemaRegistry, alerting, dashboard, tracing] = await Promise.all([
      this.checkPerformanceService(),
      this.checkCachingService(),
      this.checkSchemaRegistryService(),
      this.checkAlertingService(),
      this.checkDashboardService(),
      this.checkTracingService(),
    ]);

    return {
      performance,
      caching,
      schemaRegistry,
      alerting,
      dashboard,
      tracing,
    };
  }

  /**
   * Check performance service
   */
  private async checkPerformanceService(): Promise<ServiceHealth> {
    try {
      const metrics = this.performanceMonitoring.getPerformanceMetrics();
      const isHealthy = metrics.errorRate < 0.1 && metrics.averageValidationTime < 1000;
      
      return {
        status: isHealthy ? 'healthy' : 'degraded',
        message: isHealthy ? 'Performance metrics are normal' : 'Performance issues detected',
        lastCheck: new Date(),
        metrics: {
          errorRate: metrics.errorRate,
          averageValidationTime: metrics.averageValidationTime,
          throughput: metrics.throughput,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Performance service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Check caching service
   */
  private async checkCachingService(): Promise<ServiceHealth> {
    try {
      const stats = this.cachingService.getCacheStatistics();
      const isHealthy = stats.metrics.hitRate > 0.5;
      
      return {
        status: isHealthy ? 'healthy' : 'degraded',
        message: isHealthy ? 'Cache is performing well' : 'Cache performance issues detected',
        lastCheck: new Date(),
        metrics: {
          hitRate: stats.metrics.hitRate,
          memoryUsage: stats.metrics.memoryUsage,
          schemaCacheSize: stats.schemaCache.size,
          validationCacheSize: stats.validationCache.size,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Caching service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Check schema registry service
   */
  private async checkSchemaRegistryService(): Promise<ServiceHealth> {
    try {
      const stats = this.schemaRegistry.getUsageStats();
      const isHealthy = stats.totalSchemas > 0;
      
      return {
        status: isHealthy ? 'healthy' : 'degraded',
        message: isHealthy ? 'Schema registry is operational' : 'Schema registry issues detected',
        lastCheck: new Date(),
        metrics: {
          totalSchemas: stats.totalSchemas,
          activeSchemas: stats.activeSchemas,
          mostUsedSchemas: stats.mostUsedSchemas.slice(0, 5),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Schema registry service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Check alerting service
   */
  private async checkAlertingService(): Promise<ServiceHealth> {
    try {
      const stats = this.alertingService.getAlertStatistics();
      const isHealthy = stats.activeAlerts < 10;
      
      return {
        status: isHealthy ? 'healthy' : 'degraded',
        message: isHealthy ? 'Alerting system is normal' : 'High number of active alerts',
        lastCheck: new Date(),
        metrics: {
          activeAlerts: stats.activeAlerts,
          totalAlerts: stats.totalAlerts,
          errorRate: stats.averageResolutionTime,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Alerting service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Check dashboard service
   */
  private async checkDashboardService(): Promise<ServiceHealth> {
    try {
      const stats = this.metricsDashboard.getDashboardStats();
      const isHealthy = stats.connectedClients >= 0;
      
      return {
        status: isHealthy ? 'healthy' : 'degraded',
        message: isHealthy ? 'Dashboard is operational' : 'Dashboard issues detected',
        lastCheck: new Date(),
        metrics: {
          connectedClients: stats.connectedClients,
          historicalDataPoints: stats.historicalDataPoints,
          uptime: stats.uptime,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Dashboard service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Check tracing service
   */
  private async checkTracingService(): Promise<ServiceHealth> {
    try {
      const metrics = this.tracingService.getTraceMetrics();
      const isHealthy = metrics.errorRate < 0.1;
      
      return {
        status: isHealthy ? 'healthy' : 'degraded',
        message: isHealthy ? 'Tracing system is operational' : 'Tracing issues detected',
        lastCheck: new Date(),
        metrics: {
          totalTraces: metrics.totalTraces,
          activeSpans: metrics.activeSpans,
          errorRate: metrics.errorRate,
          averageSpanDuration: metrics.averageSpanDuration,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Tracing service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Determine overall health status
   */
  private determineOverallStatus(services: HealthStatus['services']): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(services).map(service => service.status);
    
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }
    
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  }


  private startTime = Date.now();
}
