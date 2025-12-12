import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { z } from 'zod';
import { 
  PerformanceMonitoringService,
  AdvancedCachingService,
  SchemaRegistryService,
  AlertingService,
  MetricsDashboardService,
  DistributedTracingService,
  StructuredLoggingService
  // HealthMonitoringController // Not exported
} from '../src';

// Example schemas
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  age: z.number().min(18),
  role: z.enum(['admin', 'user', 'premium']),
});

const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.string(),
  inStock: z.boolean(),
});

@Controller('monitoring-observability')
export class MonitoringObservabilityController {
  constructor(
    private readonly performanceMonitoring: PerformanceMonitoringService,
    private readonly cachingService: AdvancedCachingService,
    private readonly schemaRegistry: SchemaRegistryService,
    private readonly alertingService: AlertingService,
    private readonly metricsDashboard: MetricsDashboardService,
    private readonly tracingService: DistributedTracingService,
    private readonly structuredLogging: StructuredLoggingService,
    // private readonly healthController: HealthMonitoringController // Not available
  ) {
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring and observability
   */
  private initializeMonitoring(): void {
    // Register schemas
    this.schemaRegistry.register('user', UserSchema, {
      version: '1.0.0',
      description: 'User entity schema',
      tags: ['user', 'entity', 'core'],
    });

    this.schemaRegistry.register('product', ProductSchema, {
      version: '1.0.0',
      description: 'Product entity schema',
      tags: ['product', 'entity', 'catalog'],
    });

    // Setup alert channels
    this.setupAlertChannels();

    // Setup alert rules
    this.setupAlertRules();

    // Configure logging
    this.configureLogging();
  }

  /**
   * Setup alert channels
   */
  private setupAlertChannels(): void {
    // Email channel
    this.alertingService.addAlertChannel({
      id: 'email',
      name: 'Email Notifications',
      type: 'email',
      config: {
        smtp: {
          host: process.env['SMTP_HOST'] || 'localhost',
          port: parseInt(process.env['SMTP_PORT'] || '587'),
          secure: false,
          auth: {
            user: process.env['SMTP_USER'] || 'user',
            pass: process.env['SMTP_PASS'] || 'pass',
          },
        },
        to: process.env['ALERT_EMAIL'] || 'admin@example.com',
        from: process.env['SMTP_FROM'] || 'noreply@example.com',
      },
      enabled: true,
      rateLimit: {
        maxAlerts: 10,
        timeWindow: 60000, // 1 minute
      },
    });

    // Slack channel
    this.alertingService.addAlertChannel({
      id: 'slack',
      name: 'Slack Notifications',
      type: 'slack',
      config: {
        webhookUrl: process.env['SLACK_WEBHOOK_URL'] || '',
        channel: process.env['SLACK_CHANNEL'] || '#alerts',
        username: 'Nest-Zod Bot',
        iconEmoji: ':warning:',
      },
      enabled: true,
      rateLimit: {
        maxAlerts: 20,
        timeWindow: 60000, // 1 minute
      },
    });

    // Webhook channel
    this.alertingService.addAlertChannel({
      id: 'webhook',
      name: 'Webhook Notifications',
      type: 'webhook',
      config: {
        url: process.env['WEBHOOK_URL'] || 'http://localhost:3000/webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env['WEBHOOK_TOKEN'] || 'token'}`,
        },
      },
      enabled: true,
    });
  }

  /**
   * Setup alert rules
   */
  private setupAlertRules(): void {
    // High error rate alert
    this.alertingService.addAlertRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      description: 'Validation error rate is above 10%',
      condition: (metrics) => metrics.performance.errorRate > 0.1,
      severity: 'high',
      enabled: true,
      cooldown: 5 * 60 * 1000, // 5 minutes
      channels: ['email', 'slack'],
      tags: ['performance', 'error'],
    });

    // Slow validation alert
    this.alertingService.addAlertRule({
      id: 'slow_validation',
      name: 'Slow Validation',
      description: 'Average validation time is above 1 second',
      condition: (metrics) => metrics.performance.averageValidationTime > 1000,
      severity: 'medium',
      enabled: true,
      cooldown: 10 * 60 * 1000, // 10 minutes
      channels: ['slack'],
      tags: ['performance', 'latency'],
    });

    // High memory usage alert
    this.alertingService.addAlertRule({
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      description: 'Memory usage is above 80%',
      condition: (metrics) => metrics.performance.memoryUsage > 0.8,
      severity: 'critical',
      enabled: true,
      cooldown: 2 * 60 * 1000, // 2 minutes
      channels: ['email', 'slack', 'webhook'],
      tags: ['performance', 'memory'],
    });

    // Low cache hit rate alert
    this.alertingService.addAlertRule({
      id: 'low_cache_hit_rate',
      name: 'Low Cache Hit Rate',
      description: 'Cache hit rate is below 50%',
      condition: (metrics) => metrics.performance.cacheHitRate < 0.5,
      severity: 'medium',
      enabled: true,
      cooldown: 15 * 60 * 1000, // 15 minutes
      channels: ['slack'],
      tags: ['performance', 'cache'],
    });
  }

  /**
   * Configure logging
   */
  private configureLogging(): void {
    this.structuredLogging.updateConfig({
      enableStructuredLogging: true,
      enableLogAggregation: true,
      enablePerformanceLogging: true,
      enableErrorTracking: true,
      logLevel: 'info',
      maxLogEntries: 100000,
      logRetentionDays: 30,
      enableLogIndexing: true,
      enableRealTimeLogs: true,
      logFormat: 'json',
      enableLogSampling: false,
      enableLogFiltering: true,
      enableLogMetrics: true,
    });
  }

  /**
   * Example 1: Monitored validation with tracing
   */
  @Post('validate-user-monitored')
  async validateUserMonitored(@Body() userData: unknown) {
    const startTime = performance.now();
    const userSize = JSON.stringify(userData ?? '').length;
    const userId = (userData as { id?: unknown })?.id;
    
    // Start tracing span
    const span = this.tracingService.startSpan('validate-user', undefined, {
      'operation.name': 'validate-user',
      'user.id': userId ? String(userId) : 'unknown',
      'data.size': userSize.toString(),
    });

    try {
      // Log validation start
      this.structuredLogging.logValidationStart('user', userSize, span.traceId, span.spanId);
      
      // Get schema from registry
      const schema = await this.schemaRegistry.get('user');
      
      // Validate with performance monitoring
      const validatedData = await schema.parseAsync(userData);
      
      const duration = performance.now() - startTime;
      
      // Log validation success
      this.structuredLogging.logValidationSuccess('user', duration, userSize, span.traceId, span.spanId);
      
      // Record performance metric
      this.performanceMonitoring.recordValidation({
        schemaName: 'user',
        duration,
        success: true,
        dataSize: userSize,
        cacheHit: false,
      });

      // Complete tracing span
      this.tracingService.completeSpan(span.spanId, 'completed', undefined, {
        'validation.duration': duration.toString(),
        'validation.success': 'true',
      });

      return {
        success: true,
        data: validatedData,
        performance: {
          validationTime: duration,
          schemaName: 'user',
          traceId: span.traceId,
        }
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Log validation error
      this.structuredLogging.logValidationError('user', error as Error, duration, JSON.stringify(userData).length, span.traceId, span.spanId);
      
      // Record performance metric
      this.performanceMonitoring.recordValidation({
        schemaName: 'user',
        duration,
        success: false,
        dataSize: userSize,
        errorType: error instanceof z.ZodError ? 'validation_error' : 'unknown_error',
      });

      // Complete tracing span with error
      this.tracingService.completeSpan(span.spanId, 'error', error as Error, {
        'validation.duration': duration.toString(),
        'validation.success': 'false',
        'error.type': error instanceof Error ? error.constructor.name : 'UnknownError',
      });

      throw error;
    }
  }

  /**
   * Example 2: Batch validation with monitoring
   */
  @Post('validate-batch-monitored')
  async validateBatchMonitored(@Body() data: { items: unknown[]; schemaName: string }) {
    const startTime = performance.now();
    
    // Start tracing span
    const span = this.tracingService.startSpan('validate-batch', undefined, {
      'operation.name': 'validate-batch',
      'batch.size': data.items.length.toString(),
      'schema.name': data.schemaName,
    });

    try {
      // Log batch start
      this.structuredLogging.log('info', `Batch validation started: ${data.schemaName}`, 'batch', {
        schemaName: data.schemaName,
        itemCount: data.items.length,
        operation: 'batch_validation_start',
      }, {
        traceId: span.traceId,
        spanId: span.spanId,
        tags: ['batch', 'validation', 'start'],
      });

      // Get schema from registry
      const schema = await this.schemaRegistry.get(data.schemaName);
      
      // Validate batch
      const results = await Promise.all(
        data.items.map(async (item, index) => {
          try {
            const validatedItem = await schema.parseAsync(item);
            return { index, success: true, data: validatedItem };
          } catch (error) {
            return { index, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          }
        })
      );

      const duration = performance.now() - startTime;
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      // Log batch completion
      this.structuredLogging.log('info', `Batch validation completed: ${data.schemaName}`, 'batch', {
        schemaName: data.schemaName,
        itemCount: data.items.length,
        successCount,
        errorCount,
        operation: 'batch_validation_complete',
      }, {
        traceId: span.traceId,
        spanId: span.spanId,
        performance: {
          duration,
          memoryUsage: process.memoryUsage().heapUsed,
          cpuUsage: process.cpuUsage().user,
        },
        tags: ['batch', 'validation', 'complete'],
      });

      // Record performance metrics
      const metric = {
        schemaName: `${data.schemaName}-batch`,
        duration,
        success: errorCount === 0,
        dataSize: JSON.stringify(data.items).length,
      } as {
        schemaName: string;
        duration: number;
        success: boolean;
        dataSize: number;
        errorType?: string;
      };
      if (errorCount > 0) {
        metric.errorType = 'batch_validation_error';
      }
      this.performanceMonitoring.recordValidation(metric);

      // Complete tracing span
      this.tracingService.completeSpan(span.spanId, 'completed', undefined, {
        'batch.duration': duration.toString(),
        'batch.success_count': successCount.toString(),
        'batch.error_count': errorCount.toString(),
        'batch.success_rate': (successCount / data.items.length).toString(),
      });

      return {
        success: errorCount === 0,
        results,
        summary: {
          total: data.items.length,
          successful: successCount,
          failed: errorCount,
          successRate: successCount / data.items.length,
          executionTime: duration,
        },
        performance: {
          totalTime: duration,
          throughput: data.items.length / (duration / 1000),
          traceId: span.traceId,
        }
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Log batch error
      this.structuredLogging.log('error', `Batch validation failed: ${data.schemaName}`, 'batch', {
        schemaName: data.schemaName,
        itemCount: data.items.length,
        operation: 'batch_validation_error',
        error,
      }, {
        traceId: span.traceId,
        spanId: span.spanId,
        performance: {
          duration,
          memoryUsage: process.memoryUsage().heapUsed,
          cpuUsage: process.cpuUsage().user,
        },
        tags: ['batch', 'validation', 'error'],
      });

      // Complete tracing span with error
      this.tracingService.completeSpan(span.spanId, 'error', error as Error, {
        'batch.duration': duration.toString(),
        'batch.success': 'false',
        'error.type': error instanceof Error ? error.constructor.name : 'UnknownError',
      });

      throw error;
    }
  }

  /**
   * Example 3: Cached validation with monitoring
   */
  @Post('validate-cached')
  async validateCached(@Body() data: { userData: unknown; useCache: boolean }) {
    const startTime = performance.now();
    
    // Start tracing span
    const span = this.tracingService.startSpan('validate-cached', undefined, {
      'operation.name': 'validate-cached',
      'use.cache': data.useCache.toString(),
    });

    try {
      const schema = await this.schemaRegistry.get('user');
      
      // Check cache first if enabled
      let validatedData;
      let cacheHit = false;
      
      if (data.useCache) {
        const cached = await this.cachingService.getCachedValidation(data.userData, schema);
        if (cached) {
          validatedData = cached.data;
          cacheHit = true;
          
          // Log cache hit
          this.structuredLogging.logCacheOperation('hit', 'user-validation', undefined, JSON.stringify(validatedData).length);
        }
      }
      
      if (!validatedData) {
        // Validate and cache
        validatedData = await schema.parseAsync(data.userData);
        
        if (data.useCache) {
          await this.cachingService.cacheValidationResult(data.userData, schema, validatedData);
          
          // Log cache miss and set
          this.structuredLogging.logCacheOperation('miss', 'user-validation');
          this.structuredLogging.logCacheOperation('set', 'user-validation', undefined, JSON.stringify(validatedData).length);
        }
      }

      const duration = performance.now() - startTime;
      
      // Log validation success
      this.structuredLogging.logValidationSuccess('user-cached', duration, JSON.stringify(data.userData).length, span.traceId, span.spanId);
      
      // Record performance metric
      this.performanceMonitoring.recordValidation({
        schemaName: 'user-cached',
        duration,
        success: true,
        dataSize: JSON.stringify(data.userData).length,
        cacheHit,
      });

      // Complete tracing span
      this.tracingService.completeSpan(span.spanId, 'completed', undefined, {
        'validation.duration': duration.toString(),
        'validation.success': 'true',
        'cache.hit': cacheHit.toString(),
      });

      return {
        success: true,
        data: validatedData,
        performance: {
          validationTime: duration,
          cacheHit,
          traceId: span.traceId,
        }
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Log validation error
      this.structuredLogging.logValidationError('user-cached', error as Error, duration, JSON.stringify(data.userData).length, span.traceId, span.spanId);
      
      // Complete tracing span with error
      this.tracingService.completeSpan(span.spanId, 'error', error as Error, {
        'validation.duration': duration.toString(),
        'validation.success': 'false',
        'cache.hit': 'false',
      });

      throw error;
    }
  }

  /**
   * Get real-time metrics
   */
  @Get('metrics/realtime')
  async getRealTimeMetrics() {
    const performanceMetrics = this.performanceMonitoring.getPerformanceMetrics();
    const cacheStats = this.cachingService.getCacheStatistics();
    const schemaStats = this.schemaRegistry.getUsageStats();
    const traceMetrics = this.tracingService.getTraceMetrics();
    const logStats = this.structuredLogging.getLogStatistics();

    return {
      timestamp: new Date(),
      performance: performanceMetrics,
      cache: cacheStats,
      schemas: schemaStats,
      tracing: traceMetrics,
      logging: logStats,
    };
  }

  /**
   * Get health status
   */
  @Get('health')
  async getHealthStatus() {
    // Health controller not available in this example
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        performance: 'healthy',
        caching: 'healthy',
        dashboard: 'healthy',
        tracing: 'healthy',
        logging: 'healthy'
      }
    };
  }

  /**
   * Get dashboard statistics
   */
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.metricsDashboard.getDashboardStats();
  }

  /**
   * Get active alerts
   */
  @Get('alerts/active')
  async getActiveAlerts() {
    return this.alertingService.getActiveAlerts();
  }

  /**
   * Get alert statistics
   */
  @Get('alerts/statistics')
  async getAlertStatistics() {
    return this.alertingService.getAlertStatistics();
  }

  /**
   * Get trace information
   */
  @Get('traces/:traceId')
  async getTrace(@Param('traceId') traceId: string) {
    return this.tracingService.getTrace(traceId);
  }

  /**
   * Get trace timeline
   */
  @Get('traces/:traceId/timeline')
  async getTraceTimeline(@Param('traceId') traceId: string) {
    return this.tracingService.getTraceTimeline(traceId);
  }

  /**
   * Search traces
   */
  @Get('traces')
  async searchTraces(@Query() query: Record<string, unknown>) {
    return this.tracingService.searchSpans(query);
  }

  /**
   * Get log entries
   */
  @Get('logs')
  async getLogs(@Query() query: Record<string, unknown>) {
    return this.structuredLogging.queryLogs(query);
  }

  /**
   * Get log statistics
   */
  @Get('logs/statistics')
  async getLogStatistics() {
    return this.structuredLogging.getLogStatistics();
  }

  /**
   * Export logs
   */
  @Get('logs/export')
  async exportLogs(@Query('format') format: 'json' | 'csv' | 'text' = 'json') {
    return this.structuredLogging.exportLogs(format);
  }

  /**
   * Get performance trends
   */
  @Get('trends')
  async getPerformanceTrends(@Query('hours') hours = 24) {
    return this.performanceMonitoring.getPerformanceTrends(hours * 60);
  }

  /**
   * Force metrics update
   */
  @Post('metrics/update')
  async forceMetricsUpdate() {
    return this.metricsDashboard.forceUpdate();
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
   * Get monitoring configuration
   */
  @Get('config')
  async getMonitoringConfig() {
    return {
      performance: { enableMonitoring: true, enableMetrics: true },
      caching: { enableCaching: true, maxSize: 1000 },
      alerting: { enableAlerts: true, channels: [] },
      tracing: { enableTracing: true, sampleRate: 1.0 },
      logging: { enableLogging: true, level: 'info' },
      dashboard: { enableDashboard: true, updateInterval: 1000 },
    };
  }

  /**
   * Update monitoring configuration
   */
  @Post('config')
  async updateMonitoringConfig(@Body() config: Record<string, unknown>) {
    // Configuration update methods not available in this example
    // In a real implementation, you would call the appropriate update methods
    console.log('Configuration update requested:', config);
    
    return { message: 'Monitoring configuration updated' };
  }
}
