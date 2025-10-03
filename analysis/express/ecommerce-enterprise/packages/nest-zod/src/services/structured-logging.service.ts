import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
  service: string;
  version: string;
  environment: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface LogQuery {
  level?: LogEntry['level'];
  context?: string;
  traceId?: string;
  userId?: string;
  service?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
  search?: string;
  tags?: string[];
}

export interface LogAggregation {
  totalLogs: number;
  logsByLevel: Record<string, number>;
  logsByContext: Record<string, number>;
  logsByService: Record<string, number>;
  errorRate: number;
  averageLogSize: number;
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurrence: Date;
  }>;
  performanceMetrics: {
    averageDuration: number;
    p95Duration: number;
    p99Duration: number;
  };
}

export interface LoggingConfig {
  enableStructuredLogging: boolean;
  enableLogAggregation: boolean;
  enablePerformanceLogging: boolean;
  enableErrorTracking: boolean;
  logLevel: LogEntry['level'];
  maxLogEntries: number;
  logRetentionDays: number;
  enableLogCompression: boolean;
  enableLogIndexing: boolean;
  enableRealTimeLogs: boolean;
  logFormat: 'json' | 'text' | 'both';
  enableLogSampling: boolean;
  samplingRate: number;
  enableLogFiltering: boolean;
  enableLogRouting: boolean;
  enableLogMetrics: boolean;
}

@Injectable()
export class StructuredLoggingService implements OnModuleInit {
  private readonly logger = new Logger(StructuredLoggingService.name);
  
  private logEntries: LogEntry[] = [];
  private logIndex = new Map<string, Set<string>>(); // field -> log IDs
  private logMetrics: LogAggregation = {
    totalLogs: 0,
    logsByLevel: {},
    logsByContext: {},
    logsByService: {},
    errorRate: 0,
    averageLogSize: 0,
    topErrors: [],
    performanceMetrics: {
      averageDuration: 0,
      p95Duration: 0,
      p99Duration: 0,
    },
  };

  private config: LoggingConfig = {
    enableStructuredLogging: true,
    enableLogAggregation: true,
    enablePerformanceLogging: true,
    enableErrorTracking: true,
    logLevel: 'info',
    maxLogEntries: 100000,
    logRetentionDays: 30,
    enableLogCompression: false,
    enableLogIndexing: true,
    enableRealTimeLogs: true,
    logFormat: 'json',
    enableLogSampling: false,
    samplingRate: 0.1,
    enableLogFiltering: true,
    enableLogRouting: false,
    enableLogMetrics: true,
  };

  private startTime = Date.now();
  // private lastCleanup = Date.now();
  private cleanupInterval = 60 * 60 * 1000; // 1 hour

  async onModuleInit() {
    this.logger.log('Structured Logging Service initialized');
    
    if (this.config.enableLogAggregation) {
      this.startLogAggregation();
    }
    
    if (this.config.enableLogMetrics) {
      this.startLogMetrics();
    }
  }

  /**
   * Log a structured entry
   */
  log(
    level: LogEntry['level'],
    message: string,
    context?: string,
    data?: Record<string, unknown>,
    options?: {
      traceId?: string;
      spanId?: string;
      userId?: string;
      requestId?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
      performance?: {
        duration: number;
        memoryUsage: number;
        cpuUsage: number;
      };
    }
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    if (this.config.enableLogSampling && Math.random() > this.config.samplingRate) {
      return;
    }

    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      message,
      context: context || 'default',
      ...(options?.traceId && { traceId: options.traceId }),
      ...(options?.spanId && { spanId: options.spanId }),
      ...(options?.userId && { userId: options.userId }),
      ...(options?.requestId && { requestId: options.requestId }),
      service: 'nest-zod-validation',
      version: '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
      ...(data && { data }),
      ...(options?.performance && { performance: options.performance }),
      ...(options?.tags && { tags: options.tags }),
      ...(options?.metadata && { metadata: options.metadata }),
    };

    // Add error information if level is error or fatal
    if (level === 'error' || level === 'fatal') {
      const errorInfo = this.extractErrorInfo(data?.['error']);
      if (errorInfo) {
        logEntry.error = errorInfo;
      }
    }

    this.addLogEntry(logEntry);
    this.updateLogMetrics(logEntry);
    
    // Emit to real-time subscribers
    if (this.config.enableRealTimeLogs) {
      this.emitLogEntry(logEntry);
    }
  }

  /**
   * Log validation start
   */
  logValidationStart(
    schemaName: string,
    dataSize: number,
    traceId?: string,
    spanId?: string
  ): string {
    const logId = this.generateLogId();
    
    this.log('info', `Validation started: ${schemaName}`, 'validation', {
      schemaName,
      dataSize,
      operation: 'validation_start',
    }, {
      ...(traceId && { traceId }),
      ...(spanId && { spanId }),
      tags: ['validation', 'start'],
    });

    return logId;
  }

  /**
   * Log validation success
   */
  logValidationSuccess(
    schemaName: string,
    duration: number,
    dataSize: number,
    traceId?: string,
    spanId?: string
  ): void {
    this.log('info', `Validation completed: ${schemaName}`, 'validation', {
      schemaName,
      dataSize,
      operation: 'validation_success',
    }, {
      ...(traceId && { traceId }),
      ...(spanId && { spanId }),
      performance: {
        duration,
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: process.cpuUsage().user,
      },
      tags: ['validation', 'success'],
    });
  }

  /**
   * Log validation error
   */
  logValidationError(
    schemaName: string,
    error: Error | z.ZodError,
    duration: number,
    dataSize: number,
    traceId?: string,
    spanId?: string
  ): void {
    this.log('error', `Validation failed: ${schemaName}`, 'validation', {
      schemaName,
      dataSize,
      operation: 'validation_error',
      error,
    }, {
      ...(traceId && { traceId }),
      ...(spanId && { spanId }),
      performance: {
        duration,
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: process.cpuUsage().user,
      },
      tags: ['validation', 'error'],
    });
  }

  /**
   * Log cache operation
   */
  logCacheOperation(
    operation: 'hit' | 'miss' | 'set' | 'delete' | 'clear',
    key: string,
    duration?: number,
    size?: number
  ): void {
    this.log('debug', `Cache ${operation}: ${key}`, 'cache', {
      operation,
      key,
      size,
    }, {
      ...(duration && { performance: { duration, memoryUsage: 0, cpuUsage: 0 } }),
      tags: ['cache', operation],
    });
  }

  /**
   * Log performance metric
   */
  logPerformanceMetric(
    metricName: string,
    value: number,
    unit: string,
    context?: string
  ): void {
    this.log('info', `Performance metric: ${metricName} = ${value}${unit}`, 'performance', {
      metricName,
      value,
      unit,
    }, {
      ...(context && { context }),
      tags: ['performance', 'metric'],
    });
  }

  /**
   * Log alert
   */
  logAlert(
    alertType: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    data?: Record<string, unknown>
  ): void {
    this.log('warn', `Alert: ${message}`, 'alert', {
      alertType,
      message,
      severity,
      ...data,
    }, {
      tags: ['alert', severity],
    });
  }

  /**
   * Query logs
   */
  queryLogs(query: LogQuery): LogEntry[] {
    let results = [...this.logEntries];

    // Filter by level
    if (query.level) {
      results = results.filter(log => log.level === query.level);
    }

    // Filter by context
    if (query.context) {
      results = results.filter(log => log.context === query.context);
    }

    // Filter by trace ID
    if (query.traceId) {
      results = results.filter(log => log.traceId === query.traceId);
    }

    // Filter by user ID
    if (query.userId) {
      results = results.filter(log => log.userId === query.userId);
    }

    // Filter by service
    if (query.service) {
      results = results.filter(log => log.service === query.service);
    }

    // Filter by time range
    if (query.startTime) {
      results = results.filter(log => log.timestamp >= query.startTime!);
    }

    if (query.endTime) {
      results = results.filter(log => log.timestamp <= query.endTime!);
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(log => 
        query.tags!.some(tag => log.tags?.includes(tag))
      );
    }

    // Search in message
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.data && JSON.stringify(log.data).toLowerCase().includes(searchLower)
      );
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    if (query.offset) {
      results = results.slice(query.offset);
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get log aggregation
   */
  getLogAggregation(): LogAggregation {
    return { ...this.logMetrics };
  }

  /**
   * Get log statistics
   */
  getLogStatistics(): {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByContext: Record<string, number>;
    logsByService: Record<string, number>;
    errorRate: number;
    averageLogSize: number;
    topErrors: Array<{
      message: string;
      count: number;
      lastOccurrence: Date;
    }>;
    performanceMetrics: {
      averageDuration: number;
      p95Duration: number;
      p99Duration: number;
    };
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
  } {
    return {
      ...this.logMetrics,
      uptime: Date.now() - this.startTime,
      memoryUsage: process.memoryUsage(),
    };
  }

  /**
   * Export logs
   */
  exportLogs(format: 'json' | 'csv' | 'text' = 'json', query?: LogQuery): string {
    const logs = query ? this.queryLogs(query) : this.logEntries;

    switch (format) {
      case 'csv':
        return this.convertToCSV(logs);
      case 'text':
        return this.convertToText(logs);
      default:
        return JSON.stringify(logs, null, 2);
    }
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logEntries = [];
    this.logIndex.clear();
    this.logMetrics = {
      totalLogs: 0,
      logsByLevel: {},
      logsByContext: {},
      logsByService: {},
      errorRate: 0,
      averageLogSize: 0,
      topErrors: [],
      performanceMetrics: {
        averageDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
      },
    };
    this.logger.log('All logs cleared');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log('Logging configuration updated');
  }

  /**
   * Get configuration
   */
  getConfig(): LoggingConfig {
    return { ...this.config };
  }

  /**
   * Add log entry
   */
  private addLogEntry(logEntry: LogEntry): void {
    this.logEntries.push(logEntry);

    // Index the log entry
    if (this.config.enableLogIndexing) {
      this.indexLogEntry(logEntry);
    }

    // Cleanup old logs if needed
    if (this.logEntries.length > this.config.maxLogEntries) {
      this.cleanupOldLogs();
    }
  }

  /**
   * Index log entry for faster searching
   */
  private indexLogEntry(logEntry: LogEntry): void {
    const fields = ['level', 'context', 'service', 'traceId', 'userId'];
    
    fields.forEach(field => {
      const value = logEntry[field as keyof LogEntry];
      if (value) {
        if (!this.logIndex.has(field)) {
          this.logIndex.set(field, new Set());
        }
        this.logIndex.get(field)!.add(logEntry.id);
      }
    });

    // Index tags
    if (logEntry.tags) {
      logEntry.tags.forEach(_tag => {
        if (!this.logIndex.has('tags')) {
          this.logIndex.set('tags', new Set());
        }
        this.logIndex.get('tags')!.add(logEntry.id);
      });
    }
  }

  /**
   * Update log metrics
   */
  private updateLogMetrics(logEntry: LogEntry): void {
    this.logMetrics.totalLogs++;
    
    // Update level counts
    this.logMetrics.logsByLevel[logEntry.level] = 
      (this.logMetrics.logsByLevel[logEntry.level] || 0) + 1;
    
    // Update context counts
    this.logMetrics.logsByContext[logEntry.context || 'default'] = 
      (this.logMetrics.logsByContext[logEntry.context || 'default'] || 0) + 1;
    
    // Update service counts
    this.logMetrics.logsByService[logEntry.service] = 
      (this.logMetrics.logsByService[logEntry.service] || 0) + 1;
    
    // Update error rate
    const errorLogs = this.logMetrics.logsByLevel['error'] || 0;
    const fatalLogs = this.logMetrics.logsByLevel['fatal'] || 0;
    this.logMetrics.errorRate = (errorLogs + fatalLogs) / this.logMetrics.totalLogs;
    
    // Update average log size
    const logSize = JSON.stringify(logEntry).length;
    this.logMetrics.averageLogSize = 
      (this.logMetrics.averageLogSize * (this.logMetrics.totalLogs - 1) + logSize) / 
      this.logMetrics.totalLogs;
    
    // Update top errors
    if (logEntry.level === 'error' || logEntry.level === 'fatal') {
      this.updateTopErrors(logEntry);
    }
    
    // Update performance metrics
    if (logEntry.performance) {
      this.updatePerformanceMetrics(logEntry.performance);
    }
  }

  /**
   * Update top errors
   */
  private updateTopErrors(logEntry: LogEntry): void {
    const errorMessage = logEntry.error?.message || logEntry.message;
    const existingError = this.logMetrics.topErrors.find(e => e.message === errorMessage);
    
    if (existingError) {
      existingError.count++;
      existingError.lastOccurrence = logEntry.timestamp;
    } else {
      this.logMetrics.topErrors.push({
        message: errorMessage,
        count: 1,
        lastOccurrence: logEntry.timestamp,
      });
    }
    
    // Keep only top 10 errors
    this.logMetrics.topErrors = this.logMetrics.topErrors
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(performance: LogEntry['performance']): void {
    if (!performance) return;
    
    const durations = this.logEntries
      .filter(log => log.performance?.duration)
      .map(log => log.performance!.duration);
    
    if (durations.length > 0) {
      this.logMetrics.performanceMetrics.averageDuration = 
        durations.reduce((a, b) => a + b, 0) / durations.length;
      
      const sortedDurations = durations.sort((a, b) => a - b);
      const p95Index = Math.floor(sortedDurations.length * 0.95);
      const p99Index = Math.floor(sortedDurations.length * 0.99);
      
      this.logMetrics.performanceMetrics.p95Duration = sortedDurations[p95Index] || 0;
      this.logMetrics.performanceMetrics.p99Duration = sortedDurations[p99Index] || 0;
    }
  }

  /**
   * Check if should log based on level
   */
  private shouldLog(level: LogEntry['level']): boolean {
    const levelOrder = ['debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = levelOrder.indexOf(level);
    const configLevelIndex = levelOrder.indexOf(this.config.logLevel);
    
    return currentLevelIndex >= configLevelIndex;
  }

  /**
   * Generate log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Extract error information
   */
  private extractErrorInfo(error: unknown): LogEntry['error'] | undefined {
    if (!error) return undefined;
    
    if (error instanceof Error) {
      return {
        name: error.constructor.name,
        message: error.message,
        ...(error.stack && { stack: error.stack }),
      };
    }
    
    if (error instanceof z.ZodError) {
      return {
        name: 'ZodError',
        message: error.message,
        code: 'VALIDATION_ERROR',
      };
    }
    
    return {
      name: 'UnknownError',
      message: String(error),
    };
  }

  /**
   * Start log aggregation
   */
  private startLogAggregation(): void {
    setInterval(() => {
      this.cleanupOldLogs();
    }, this.cleanupInterval);
  }

  /**
   * Start log metrics
   */
  private startLogMetrics(): void {
    setInterval(() => {
      this.updateLogMetrics({
        id: 'metrics',
        timestamp: new Date(),
        level: 'info',
        message: 'metrics-tick',
        service: 'nest-zod-validation',
        version: '1.0.0',
        environment: process.env['NODE_ENV'] || 'development',
      } as LogEntry);
    }, 60000); // Every minute
  }

  /**
   * Cleanup old logs
   */
  private cleanupOldLogs(): void {
    const cutoff = new Date(Date.now() - this.config.logRetentionDays * 24 * 60 * 60 * 1000);
    const initialCount = this.logEntries.length;
    
    this.logEntries = this.logEntries.filter(log => log.timestamp >= cutoff);
    
    const removedCount = initialCount - this.logEntries.length;
    if (removedCount > 0) {
      this.logger.debug(`Cleaned up ${removedCount} old log entries`);
    }
  }

  /**
   * Emit log entry to real-time subscribers
   */
  private emitLogEntry(logEntry: LogEntry): void {
    // This would integrate with WebSocket or other real-time systems
    // For now, just log to console
    this.logger.debug(`Real-time log: ${logEntry.message}`);
  }

  /**
   * Convert logs to CSV format
   */
  private convertToCSV(logs: LogEntry[]): string {
    const headers = [
      'id',
      'timestamp',
      'level',
      'message',
      'context',
      'traceId',
      'spanId',
      'userId',
      'requestId',
      'service',
      'version',
      'environment',
      'tags',
      'data',
      'error',
      'performance',
    ];

    const rows = logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.level,
      log.message,
      log.context || '',
      log.traceId || '',
      log.spanId || '',
      log.userId || '',
      log.requestId || '',
      log.service,
      log.version,
      log.environment,
      log.tags?.join(',') || '',
      log.data ? JSON.stringify(log.data) : '',
      log.error ? JSON.stringify(log.error) : '',
      log.performance ? JSON.stringify(log.performance) : '',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert logs to text format
   */
  private convertToText(logs: LogEntry[]): string {
    return logs.map(log => {
      let text = `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()} ${log.message}`;
      
      if (log.context) {
        text += ` [${log.context}]`;
      }
      
      if (log.traceId) {
        text += ` [trace:${log.traceId}]`;
      }
      
      if (log.userId) {
        text += ` [user:${log.userId}]`;
      }
      
      if (log.tags && log.tags.length > 0) {
        text += ` [tags:${log.tags.join(',')}]`;
      }
      
      if (log.data) {
        text += `\n  Data: ${JSON.stringify(log.data, null, 2)}`;
      }
      
      if (log.error) {
        text += `\n  Error: ${log.error.name}: ${log.error.message}`;
        if (log.error.stack) {
          text += `\n  Stack: ${log.error.stack}`;
        }
      }
      
      return text;
    }).join('\n');
  }
}
