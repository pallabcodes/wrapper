import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// Note: WebSocket dependencies are optional and handled via .d.ts file
// import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
import { PerformanceMonitoringService } from './performance-monitoring.service';
import { AdvancedCachingService } from './advanced-caching.service';
import { SchemaRegistryService } from './schema-registry.service';

export interface DashboardMetrics {
  timestamp: Date;
  performance: {
    totalValidations: number;
    successfulValidations: number;
    failedValidations: number;
    averageValidationTime: number;
    p95ValidationTime: number;
    p99ValidationTime: number;
    cacheHitRate: number;
    errorRate: number;
    throughput: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  cache: {
    schemaCache: { size: number; maxSize: number; hitRate: number };
    validationCache: { size: number; maxSize: number; hitRate: number };
    memoryUsage: number;
  };
  schemas: {
    totalSchemas: number;
    activeSchemas: number;
    mostUsedSchemas: Array<{ name: string; usageCount: number }>;
    recentlyUsedSchemas: Array<{ name: string; lastUsed: Date }>;
  };
  alerts: Array<{
    type: string;
    message: string;
    severity: string;
    timestamp: Date;
  }>;
}

export interface DashboardConfig {
  updateInterval: number; // milliseconds
  maxClients: number;
  enableRealTimeUpdates: boolean;
  enableHistoricalData: boolean;
  historicalDataRetention: number; // hours
}

@Injectable()
// @WebSocketGateway({
//   cors: {
//     origin: '*',
//   },
//   namespace: '/metrics-dashboard',
// })
export class MetricsDashboardService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsDashboardService.name);
  
  // @WebSocketServer()
  server: any; // Using any to avoid dependency issues

  private clients = new Map<string, any>(); // Using any to avoid dependency issues
  private updateInterval!: NodeJS.Timeout;
  private historicalData: DashboardMetrics[] = [];
  
  private config: DashboardConfig = {
    updateInterval: 1000, // 1 second
    maxClients: 100,
    enableRealTimeUpdates: true,
    enableHistoricalData: true,
    historicalDataRetention: 24, // 24 hours
  };

  constructor(
    private readonly performanceMonitoring: PerformanceMonitoringService,
    private readonly cachingService: AdvancedCachingService,
    private readonly schemaRegistry: SchemaRegistryService
  ) {}

  async onModuleInit() {
    this.logger.log('Metrics Dashboard Service initialized');
    
    if (this.config.enableRealTimeUpdates) {
      this.startRealTimeUpdates();
    }
  }

  async onModuleDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.logger.log('Metrics Dashboard Service destroyed');
  }

  /**
   * Handle client connection
   */
  handleConnection(client: any) {
    if (this.clients.size >= this.config.maxClients) {
      client.emit('error', { message: 'Maximum clients reached' });
      client.disconnect();
      return;
    }

    this.clients.set(client.id, client);
    this.logger.log(`Client connected: ${client.id} (${this.clients.size} total)`);

    // Send initial data
    this.sendInitialData(client);

    client.on('disconnect', () => {
      this.clients.delete(client.id);
      this.logger.log(`Client disconnected: ${client.id} (${this.clients.size} total)`);
    });
  }

  /**
   * Handle client subscription to specific metrics
   */
  // @SubscribeMessage('subscribe')
  handleSubscribe(client: any, data: { metrics: string[] }) {
    client.join(`metrics:${data.metrics.join(',')}`);
    this.logger.log(`Client ${client.id} subscribed to: ${data.metrics.join(', ')}`);
  }

  /**
   * Handle client unsubscription
   */
  // @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: any, data: { metrics: string[] }) {
    data.metrics.forEach(metric => {
      client.leave(`metrics:${metric}`);
    });
    this.logger.log(`Client ${client.id} unsubscribed from: ${data.metrics.join(', ')}`);
  }

  /**
   * Handle client request for historical data
   */
  // @SubscribeMessage('getHistoricalData')
  handleGetHistoricalData(client: any, data: { hours: number }) {
    const hours = Math.min(data.hours || 1, this.config.historicalDataRetention);
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const historicalData = this.historicalData.filter(
      entry => entry.timestamp >= cutoff
    );

    client.emit('historicalData', {
      data: historicalData,
      hours,
      totalPoints: historicalData.length,
    });
  }

  /**
   * Handle client request for specific schema metrics
   */
  // @SubscribeMessage('getSchemaMetrics')
  handleGetSchemaMetrics(client: any, data: { schemaName?: string }) {
    const schemaStats = this.performanceMonitoring.getSchemaStats(data.schemaName);
    client.emit('schemaMetrics', {
      schemaName: data.schemaName || 'all',
      stats: schemaStats,
    });
  }

  /**
   * Handle client request for performance trends
   */
  // @SubscribeMessage('getPerformanceTrends')
  handleGetPerformanceTrends(client: any, data: { minutes: number }) {
    const trends = this.performanceMonitoring.getPerformanceTrends(data.minutes || 60);
    client.emit('performanceTrends', {
      minutes: data.minutes || 60,
      trends,
    });
  }

  /**
   * Start real-time updates
   */
  private startRealTimeUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.broadcastMetrics();
    }, this.config.updateInterval);
  }

  /**
   * Broadcast metrics to all connected clients
   */
  private async broadcastMetrics(): Promise<void> {
    if (this.clients.size === 0) {
      return;
    }

    try {
      const metrics = await this.collectMetrics();
      
      // Store historical data
      if (this.config.enableHistoricalData) {
        this.historicalData.push(metrics);
        this.cleanupHistoricalData();
      }

      // Broadcast to all clients
      this.server.emit('metrics', metrics);

      // Broadcast to specific metric subscribers
      this.broadcastSpecificMetrics(metrics);

    } catch (error) {
      this.logger.error('Error broadcasting metrics:', error);
    }
  }

  /**
   * Broadcast specific metrics to subscribed clients
   */
  private broadcastSpecificMetrics(metrics: DashboardMetrics): void {
    // Performance metrics
    this.server.to('metrics:performance').emit('performance', metrics.performance);
    
    // Cache metrics
    this.server.to('metrics:cache').emit('cache', metrics.cache);
    
    // Schema metrics
    this.server.to('metrics:schemas').emit('schemas', metrics.schemas);
    
    // Alerts
    this.server.to('metrics:alerts').emit('alerts', metrics.alerts);
  }

  /**
   * Collect all metrics
   */
  private async collectMetrics(): Promise<DashboardMetrics> {
    const performance = this.performanceMonitoring.getPerformanceMetrics();
    const cache = this.cachingService.getCacheStatistics();
    const schemaUsage = this.schemaRegistry.getUsageStats();
    const alerts = this.performanceMonitoring.getAlerts();

    return {
      timestamp: new Date(),
      performance: {
        totalValidations: performance.totalValidations,
        successfulValidations: performance.successfulValidations,
        failedValidations: performance.failedValidations,
        averageValidationTime: performance.averageValidationTime,
        p95ValidationTime: performance.p95ValidationTime,
        p99ValidationTime: performance.p99ValidationTime,
        cacheHitRate: performance.cacheHitRate,
        errorRate: performance.errorRate,
        throughput: performance.throughput,
        memoryUsage: performance.memoryUsage,
        cpuUsage: performance.cpuUsage,
      },
      cache: {
        schemaCache: {
          size: cache.schemaCache.size,
          maxSize: cache.schemaCache.maxSize,
          hitRate: cache.metrics.hitRate,
        },
        validationCache: {
          size: cache.validationCache.size,
          maxSize: cache.validationCache.maxSize,
          hitRate: cache.metrics.hitRate,
        },
        memoryUsage: cache.metrics.memoryUsage,
      },
      schemas: {
        totalSchemas: schemaUsage.totalSchemas,
        activeSchemas: schemaUsage.activeSchemas,
        mostUsedSchemas: schemaUsage.mostUsedSchemas,
        recentlyUsedSchemas: schemaUsage.recentlyUsedSchemas,
      },
      alerts: alerts.map(alert => ({
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        timestamp: alert.timestamp,
      })),
    };
  }

  /**
   * Send initial data to a client
   */
  private async sendInitialData(client: any): Promise<void> {
    try {
      const metrics = await this.collectMetrics();
      client.emit('initialData', metrics);
    } catch (error) {
      this.logger.error('Error sending initial data:', error);
      client.emit('error', { message: 'Failed to load initial data' });
    }
  }

  /**
   * Cleanup old historical data
   */
  private cleanupHistoricalData(): void {
    const cutoff = new Date(Date.now() - this.config.historicalDataRetention * 60 * 60 * 1000);
    this.historicalData = this.historicalData.filter(entry => entry.timestamp >= cutoff);
  }

  /**
   * Get dashboard statistics
   */
  getDashboardStats(): {
    connectedClients: number;
    historicalDataPoints: number;
    uptime: number;
    lastUpdate: Date;
  } {
    return {
      connectedClients: this.clients.size,
      historicalDataPoints: this.historicalData.length,
      uptime: Date.now() - this.startTime,
      lastUpdate: this.historicalData.length > 0 
        ? this.historicalData[this.historicalData.length - 1]?.timestamp || new Date()
        : new Date(),
    };
  }

  /**
   * Update dashboard configuration
   */
  updateConfig(config: Partial<DashboardConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (this.config.enableRealTimeUpdates) {
      this.startRealTimeUpdates();
    }
    
    this.logger.log('Dashboard configuration updated');
  }

  /**
   * Force metrics update
   */
  async forceUpdate(): Promise<DashboardMetrics> {
    const metrics = await this.collectMetrics();
    this.server.emit('metrics', metrics);
    return metrics;
  }

  /**
   * Get historical data
   */
  getHistoricalData(hours: number = 1): DashboardMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.historicalData.filter(entry => entry.timestamp >= cutoff);
  }

  /**
   * Export dashboard data
   */
  exportDashboardData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      currentMetrics: this.historicalData[this.historicalData.length - 1],
      historicalData: this.historicalData,
      dashboardStats: this.getDashboardStats(),
      exportedAt: new Date(),
    };

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(_data: any): string {
    // Simplified CSV conversion for dashboard data
    const headers = [
      'timestamp',
      'totalValidations',
      'successfulValidations',
      'failedValidations',
      'averageValidationTime',
      'cacheHitRate',
      'errorRate',
      'throughput',
      'memoryUsage',
      'cpuUsage'
    ];

    const rows = this.historicalData.map(entry => [
      entry.timestamp.toISOString(),
      entry.performance.totalValidations,
      entry.performance.successfulValidations,
      entry.performance.failedValidations,
      entry.performance.averageValidationTime,
      entry.performance.cacheHitRate,
      entry.performance.errorRate,
      entry.performance.throughput,
      entry.performance.memoryUsage,
      entry.performance.cpuUsage,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private startTime = Date.now();
}
