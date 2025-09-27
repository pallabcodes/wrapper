import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

export interface ValidationMetric {
  schemaName: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  dataSize: number;
  errorType?: string;
  cacheHit?: boolean;
}

export interface PerformanceMetrics {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  averageValidationTime: number;
  p95ValidationTime: number;
  p99ValidationTime: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number; // validations per second
  memoryUsage: number;
  cpuUsage: number;
}

export interface SchemaPerformanceStats {
  schemaName: string;
  totalValidations: number;
  averageTime: number;
  successRate: number;
  errorBreakdown: Record<string, number>;
  throughput: number;
  lastUsed: Date;
}

export interface PerformanceAlert {
  type: 'slow_validation' | 'high_error_rate' | 'memory_usage' | 'cpu_usage';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class PerformanceMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(PerformanceMonitoringService.name);
  
  private metrics: ValidationMetric[] = [];
  private schemaStats = new Map<string, SchemaPerformanceStats>();
  private alerts: PerformanceAlert[] = [];
  
  // Configuration
  private config = {
    maxMetricsHistory: 10000,
    alertThresholds: {
      slowValidation: 1000, // 1 second
      highErrorRate: 0.1, // 10%
      memoryUsage: 0.8, // 80%
      cpuUsage: 0.8, // 80%
    },
    enableRealTimeMonitoring: true,
    enableAlerts: true,
    metricsRetentionDays: 7,
  };

  // Performance tracking
  // private startTime = Date.now();
  // private lastCleanup = Date.now();
  // private cleanupInterval = 1000 * 60 * 5; // 5 minutes

  async onModuleInit() {
    this.logger.log('Performance Monitoring Service initialized');
    
    if (this.config.enableRealTimeMonitoring) {
      this.startRealTimeMonitoring();
    }
  }

  /**
   * Record a validation metric
   */
  recordValidation(metric: Omit<ValidationMetric, 'timestamp'>): void {
    const fullMetric: ValidationMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);
    this.updateSchemaStats(fullMetric);
    
    // Check for alerts
    if (this.config.enableAlerts) {
      this.checkAlerts(fullMetric);
    }

    // Cleanup old metrics if needed
    if (this.metrics.length > this.config.maxMetricsHistory) {
      this.cleanupOldMetrics();
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const now = Date.now();
    const timeWindow = 60000; // 1 minute
    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp.getTime() <= timeWindow
    );

    const totalValidations = recentMetrics.length;
    const successfulValidations = recentMetrics.filter(m => m.success).length;
    const failedValidations = totalValidations - successfulValidations;
    
    const durations = recentMetrics.map(m => m.duration);
    const averageValidationTime = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    const sortedDurations = durations.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p99Index = Math.floor(sortedDurations.length * 0.99);
    
    const p95ValidationTime = sortedDurations[p95Index] || 0;
    const p99ValidationTime = sortedDurations[p99Index] || 0;

    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = totalValidations > 0 ? cacheHits / totalValidations : 0;
    
    const errorRate = totalValidations > 0 ? failedValidations / totalValidations : 0;
    
    const throughput = totalValidations / (timeWindow / 1000); // validations per second

    return {
      totalValidations,
      successfulValidations,
      failedValidations,
      averageValidationTime,
      p95ValidationTime,
      p99ValidationTime,
      cacheHitRate,
      errorRate,
      throughput,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage(),
    };
  }

  /**
   * Get schema-specific performance stats
   */
  getSchemaStats(schemaName?: string): SchemaPerformanceStats[] {
    if (schemaName) {
      const stats = this.schemaStats.get(schemaName);
      return stats ? [stats] : [];
    }
    
    return Array.from(this.schemaStats.values());
  }

  /**
   * Get performance alerts
   */
  getAlerts(severity?: PerformanceAlert['severity']): PerformanceAlert[] {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity);
    }
    return [...this.alerts];
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(olderThanHours = 24): void {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp.getTime() > cutoff);
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(timeWindowMinutes = 60): {
    timeSeries: Array<{
      timestamp: Date;
      metrics: PerformanceMetrics;
    }>;
    trends: {
      validationTime: 'increasing' | 'decreasing' | 'stable';
      errorRate: 'increasing' | 'decreasing' | 'stable';
      throughput: 'increasing' | 'decreasing' | 'stable';
    };
  } {
    const now = Date.now();
    // const windowMs = timeWindowMinutes * 60 * 1000;
    // const intervalMs = 5 * 60 * 1000; // 5-minute intervals
    
    const timeSeries: Array<{ timestamp: Date; metrics: PerformanceMetrics }> = [];
    
    for (let i = 0; i < timeWindowMinutes; i += 5) {
      const intervalStart = now - (i + 5) * 60 * 1000;
      const intervalEnd = now - i * 60 * 1000;
      
      const intervalMetrics = this.metrics.filter(
        m => m.timestamp.getTime() >= intervalStart && m.timestamp.getTime() < intervalEnd
      );
      
      const metrics = this.calculateMetricsForInterval(intervalMetrics);
      timeSeries.push({
        timestamp: new Date(intervalStart),
        metrics,
      });
    }

    // Calculate trends
    const trends = this.calculateTrends(timeSeries);

    return { timeSeries, trends };
  }

  /**
   * Export performance data
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      metrics: this.metrics,
      schemaStats: Array.from(this.schemaStats.entries()),
      alerts: this.alerts,
      exportedAt: new Date(),
    };

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = [];
    this.schemaStats.clear();
    this.alerts = [];
    // this.startTime = Date.now();
    this.logger.log('All performance metrics reset');
  }

  /**
   * Update schema statistics
   */
  private updateSchemaStats(metric: ValidationMetric): void {
    const existing = this.schemaStats.get(metric.schemaName);
    
    if (existing) {
      existing.totalValidations++;
      existing.averageTime = 
        (existing.averageTime * (existing.totalValidations - 1) + metric.duration) / 
        existing.totalValidations;
      existing.successRate = 
        (existing.successRate * (existing.totalValidations - 1) + (metric.success ? 1 : 0)) / 
        existing.totalValidations;
      existing.lastUsed = metric.timestamp;
      
      if (!metric.success && metric.errorType) {
        existing.errorBreakdown[metric.errorType] = 
          (existing.errorBreakdown[metric.errorType] || 0) + 1;
      }
    } else {
      this.schemaStats.set(metric.schemaName, {
        schemaName: metric.schemaName,
        totalValidations: 1,
        averageTime: metric.duration,
        successRate: metric.success ? 1 : 0,
        errorBreakdown: metric.errorType ? { [metric.errorType]: 1 } : {},
        throughput: 0,
        lastUsed: metric.timestamp,
      });
    }
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(metric: ValidationMetric): void {
    // Slow validation alert
    if (metric.duration > this.config.alertThresholds.slowValidation) {
      this.addAlert({
        type: 'slow_validation',
        message: `Slow validation detected: ${metric.schemaName} took ${metric.duration}ms`,
        threshold: this.config.alertThresholds.slowValidation,
        currentValue: metric.duration,
        timestamp: metric.timestamp,
        severity: metric.duration > this.config.alertThresholds.slowValidation * 2 ? 'high' : 'medium',
      });
    }

    // High error rate alert
    const recentMetrics = this.metrics.filter(
      m => Date.now() - m.timestamp.getTime() <= 60000 // Last minute
    );
    const errorRate = recentMetrics.length > 0 
      ? recentMetrics.filter(m => !m.success).length / recentMetrics.length 
      : 0;

    if (errorRate > this.config.alertThresholds.highErrorRate) {
      this.addAlert({
        type: 'high_error_rate',
        message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        threshold: this.config.alertThresholds.highErrorRate,
        currentValue: errorRate,
        timestamp: metric.timestamp,
        severity: errorRate > this.config.alertThresholds.highErrorRate * 2 ? 'critical' : 'high',
      });
    }
  }

  /**
   * Add a performance alert
   */
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    this.logger.warn(`Performance Alert: ${alert.message}`);
  }

  /**
   * Cleanup old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - (this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
    
    // Keep only recent alerts
    this.clearOldAlerts(24);
  }

  /**
   * Start real-time monitoring
   */
  private startRealTimeMonitoring(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  /**
   * Perform health check
   */
  private performHealthCheck(): void {
    const memoryUsage = this.getMemoryUsage();
    const cpuUsage = this.getCpuUsage();

    // Memory usage alert
    if (memoryUsage > this.config.alertThresholds.memoryUsage) {
      this.addAlert({
        type: 'memory_usage',
        message: `High memory usage detected: ${(memoryUsage * 100).toFixed(1)}%`,
        threshold: this.config.alertThresholds.memoryUsage,
        currentValue: memoryUsage,
        timestamp: new Date(),
        severity: memoryUsage > 0.9 ? 'critical' : 'high',
      });
    }

    // CPU usage alert
    if (cpuUsage > this.config.alertThresholds.cpuUsage) {
      this.addAlert({
        type: 'cpu_usage',
        message: `High CPU usage detected: ${(cpuUsage * 100).toFixed(1)}%`,
        threshold: this.config.alertThresholds.cpuUsage,
        currentValue: cpuUsage,
        timestamp: new Date(),
        severity: cpuUsage > 0.9 ? 'critical' : 'high',
      });
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    const memUsage = process.memoryUsage();
    return memUsage.heapUsed / memUsage.heapTotal;
  }

  /**
   * Get current CPU usage (simplified)
   */
  private getCpuUsage(): number {
    // This is a simplified CPU usage calculation
    // In production, you'd use a more sophisticated method
    return Math.random() * 0.5; // Placeholder
  }

  /**
   * Calculate metrics for a specific interval
   */
  private calculateMetricsForInterval(metrics: ValidationMetric[]): PerformanceMetrics {
    const totalValidations = metrics.length;
    const successfulValidations = metrics.filter(m => m.success).length;
    const failedValidations = totalValidations - successfulValidations;
    
    const durations = metrics.map(m => m.duration);
    const averageValidationTime = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    const sortedDurations = durations.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p99Index = Math.floor(sortedDurations.length * 0.99);
    
    const p95ValidationTime = sortedDurations[p95Index] || 0;
    const p99ValidationTime = sortedDurations[p99Index] || 0;

    const cacheHits = metrics.filter(m => m.cacheHit).length;
    const cacheHitRate = totalValidations > 0 ? cacheHits / totalValidations : 0;
    
    const errorRate = totalValidations > 0 ? failedValidations / totalValidations : 0;
    
    const throughput = totalValidations / 5; // 5-minute interval

    return {
      totalValidations,
      successfulValidations,
      failedValidations,
      averageValidationTime,
      p95ValidationTime,
      p99ValidationTime,
      cacheHitRate,
      errorRate,
      throughput,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage(),
    };
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends(timeSeries: Array<{ timestamp: Date; metrics: PerformanceMetrics }>): {
    validationTime: 'increasing' | 'decreasing' | 'stable';
    errorRate: 'increasing' | 'decreasing' | 'stable';
    throughput: 'increasing' | 'decreasing' | 'stable';
  } {
    if (timeSeries.length < 2) {
      return {
        validationTime: 'stable',
        errorRate: 'stable',
        throughput: 'stable',
      };
    }

    const first = timeSeries[0]?.metrics;
    const last = timeSeries[timeSeries.length - 1]?.metrics;
    
    if (!first || !last) {
      return {
        validationTime: 'stable',
        errorRate: 'stable',
        throughput: 'stable'
      };
    }

    const validationTimeChange = (last.averageValidationTime - first.averageValidationTime) / first.averageValidationTime;
    const errorRateChange = (last.errorRate - first.errorRate) / (first.errorRate || 0.001);
    const throughputChange = (last.throughput - first.throughput) / (first.throughput || 0.001);

    return {
      validationTime: Math.abs(validationTimeChange) < 0.05 ? 'stable' : 
        validationTimeChange > 0 ? 'increasing' : 'decreasing',
      errorRate: Math.abs(errorRateChange) < 0.05 ? 'stable' : 
        errorRateChange > 0 ? 'increasing' : 'decreasing',
      throughput: Math.abs(throughputChange) < 0.05 ? 'stable' : 
        throughputChange > 0 ? 'increasing' : 'decreasing',
    };
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(_data: any): string {
    // Simplified CSV conversion
    const headers = ['timestamp', 'schemaName', 'duration', 'success', 'dataSize', 'errorType', 'cacheHit'];
    const rows = this.metrics.map(m => [
      m.timestamp.toISOString(),
      m.schemaName,
      m.duration,
      m.success,
      m.dataSize,
      m.errorType || '',
      m.cacheHit || false,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}
