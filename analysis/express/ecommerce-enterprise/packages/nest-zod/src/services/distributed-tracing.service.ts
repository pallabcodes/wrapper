import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string | undefined;
  baggage?: Record<string, string> | undefined;
  tags?: Record<string, string> | undefined;
}

export interface ValidationSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string | undefined;
  operationName: string;
  startTime: number;
  endTime?: number | undefined;
  duration?: number | undefined;
  tags: Record<string, string>;
  logs: Array<{
    timestamp: number;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: any | undefined;
  }>;
  status: 'started' | 'completed' | 'error';
  error?: {
    message: string;
    stack?: string | undefined;
    type: string;
  } | undefined;
}

export interface TraceMetrics {
  totalTraces: number;
  activeSpans: number;
  completedSpans: number;
  errorSpans: number;
  averageSpanDuration: number;
  p95SpanDuration: number;
  p99SpanDuration: number;
  tracesPerSecond: number;
  errorRate: number;
}

export interface TracingConfig {
  enableTracing: boolean;
  samplingRate: number; // 0.0 to 1.0
  maxSpansPerTrace: number;
  spanRetentionMs: number;
  enableBaggage: boolean;
  enableLogs: boolean;
  enableMetrics: boolean;
  jaegerEndpoint?: string;
  zipkinEndpoint?: string;
  datadogEndpoint?: string;
}

@Injectable()
export class DistributedTracingService implements OnModuleInit {
  private readonly logger = new Logger(DistributedTracingService.name);
  
  private activeSpans = new Map<string, ValidationSpan>();
  private completedSpans: ValidationSpan[] = [];
  private traceMetrics: TraceMetrics = {
    totalTraces: 0,
    activeSpans: 0,
    completedSpans: 0,
    errorSpans: 0,
    averageSpanDuration: 0,
    p95SpanDuration: 0,
    p99SpanDuration: 0,
    tracesPerSecond: 0,
    errorRate: 0,
  };

  private config: TracingConfig = {
    enableTracing: true,
    samplingRate: 1.0,
    maxSpansPerTrace: 1000,
    spanRetentionMs: 24 * 60 * 60 * 1000, // 24 hours
    enableBaggage: true,
    enableLogs: true,
    enableMetrics: true,
  };

  private startTime = Date.now();
  // private lastCleanup = Date.now();
  private cleanupInterval = 5 * 60 * 1000; // 5 minutes

  async onModuleInit() {
    this.logger.log('Distributed Tracing Service initialized');
    
    if (this.config.enableTracing) {
      this.startCleanupInterval();
    }
  }

  /**
   * Start a new validation span
   */
  startSpan(
    operationName: string,
    context?: TraceContext,
    tags?: Record<string, string>
  ): ValidationSpan {
    if (!this.config.enableTracing || Math.random() > this.config.samplingRate) {
      return this.createNoOpSpan(operationName);
    }

    const spanId = this.generateSpanId();
    const traceId = context?.traceId || this.generateTraceId();
    const parentSpanId = context?.parentSpanId;

    const span: ValidationSpan = {
      spanId,
      traceId,
      parentSpanId,
      operationName,
      startTime: Date.now(),
      tags: {
        'operation.name': operationName,
        'service.name': 'nest-zod-validation',
        'service.version': '1.0.0',
        ...tags,
        ...context?.tags,
      },
      logs: [],
      status: 'started',
    };

    this.activeSpans.set(spanId, span);
    this.traceMetrics.activeSpans++;
    this.traceMetrics.totalTraces++;

    if (this.config.enableLogs) {
      this.addSpanLog(spanId, 'info', 'Span started', { operationName, traceId });
    }

    return span;
  }

  /**
   * Complete a validation span
   */
  completeSpan(
    spanId: string,
    status: 'completed' | 'error' = 'completed',
    error?: Error,
    tags?: Record<string, string>
  ): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      this.logger.warn(`Span ${spanId} not found`);
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    if (tags) {
      span.tags = { ...span.tags, ...tags };
    }

    if (error) {
      span.error = {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name,
      };
      span.tags['error'] = 'true';
      span.tags['error.type'] = error.constructor.name;
      span.tags['error.message'] = error.message;
    }

    if (this.config.enableLogs) {
      this.addSpanLog(spanId, 'info', 'Span completed', { 
        duration: span.duration, 
        status,
        error: error?.message 
      });
    }

    // Move to completed spans
    this.activeSpans.delete(spanId);
    this.completedSpans.push(span);
    this.traceMetrics.activeSpans--;
    this.traceMetrics.completedSpans++;

    if (status === 'error') {
      this.traceMetrics.errorSpans++;
    }

    // Update metrics
    this.updateTraceMetrics();

    // Check if we need to cleanup old spans
    if (this.completedSpans.length > this.config.maxSpansPerTrace) {
      this.cleanupOldSpans();
    }
  }

  /**
   * Add a log entry to a span
   */
  addSpanLog(
    spanId: string,
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    data?: any
  ): void {
    if (!this.config.enableLogs) return;

    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.logs.push({
      timestamp: Date.now(),
      level,
      message,
      data,
    });
  }

  /**
   * Add tags to a span
   */
  addSpanTags(spanId: string, tags: Record<string, string>): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.tags = { ...span.tags, ...tags };
  }

  /**
   * Create a child span
   */
  createChildSpan(
    parentSpanId: string,
    operationName: string,
    tags?: Record<string, string>
  ): ValidationSpan | null {
    const parentSpan = this.activeSpans.get(parentSpanId);
    if (!parentSpan) {
      this.logger.warn(`Parent span ${parentSpanId} not found`);
      return null;
    }

    const context: TraceContext = {
      spanId: parentSpan.spanId,
      traceId: parentSpan.traceId,
      parentSpanId: parentSpanId,
      baggage: parentSpan.tags,
    };

    return this.startSpan(operationName, context, tags);
  }

  /**
   * Get trace by ID
   */
  getTrace(traceId: string): ValidationSpan[] {
    return this.completedSpans.filter(span => span.traceId === traceId);
  }

  /**
   * Get span by ID
   */
  getSpan(spanId: string): ValidationSpan | undefined {
    return this.activeSpans.get(spanId) || this.completedSpans.find(s => s.spanId === spanId);
  }

  /**
   * Get active spans
   */
  getActiveSpans(): ValidationSpan[] {
    return Array.from(this.activeSpans.values());
  }

  /**
   * Get trace metrics
   */
  getTraceMetrics(): TraceMetrics {
    return { ...this.traceMetrics };
  }

  /**
   * Search spans by criteria
   */
  searchSpans(criteria: {
    operationName?: string;
    traceId?: string;
    status?: 'started' | 'completed' | 'error';
    startTime?: Date;
    endTime?: Date;
    tags?: Record<string, string>;
    limit?: number;
  }): ValidationSpan[] {
    let results = [...this.activeSpans.values(), ...this.completedSpans];

    if (criteria.operationName) {
      results = results.filter(span => span.operationName.includes(criteria.operationName!));
    }

    if (criteria.traceId) {
      results = results.filter(span => span.traceId === criteria.traceId);
    }

    if (criteria.status) {
      results = results.filter(span => span.status === criteria.status);
    }

    if (criteria.startTime) {
      results = results.filter(span => span.startTime >= criteria.startTime!.getTime());
    }

    if (criteria.endTime) {
      results = results.filter(span => span.startTime <= criteria.endTime!.getTime());
    }

    if (criteria.tags) {
      results = results.filter(span => {
        return Object.entries(criteria.tags!).every(([key, value]) => 
          span.tags[key] === value
        );
      });
    }

    if (criteria.limit) {
      results = results.slice(0, criteria.limit);
    }

    return results.sort((a, b) => b.startTime - a.startTime);
  }

  /**
   * Get trace timeline
   */
  getTraceTimeline(traceId: string): Array<{
    span: ValidationSpan;
    level: number;
    parent?: ValidationSpan | undefined;
  }> {
    const spans = this.getTrace(traceId);
    const timeline: Array<{ span: ValidationSpan; level: number; parent?: ValidationSpan | undefined }> = [];
    // const spanMap = new Map(spans.map(span => [span.spanId, span]));

    // Build hierarchy
    const rootSpans = spans.filter(span => !span.parentSpanId);
    
    const buildTimeline = (span: ValidationSpan, level: number, parent?: ValidationSpan | undefined) => {
      timeline.push({ span, level, parent: parent || undefined });
      
      const children = spans.filter(s => s.parentSpanId === span.spanId);
      children.forEach(child => buildTimeline(child, level + 1, span));
    };

    rootSpans.forEach(span => buildTimeline(span, 0));

    return timeline.sort((a, b) => a.span.startTime - b.span.startTime);
  }

  /**
   * Export trace data
   */
  exportTraceData(format: 'json' | 'jaeger' | 'zipkin' = 'json'): string {
    const data = {
      traces: this.completedSpans,
      activeSpans: this.activeSpans,
      metrics: this.traceMetrics,
      exportedAt: new Date(),
    };

    switch (format) {
      case 'jaeger':
        return this.convertToJaegerFormat(data);
      case 'zipkin':
        return this.convertToZipkinFormat(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Update trace metrics
   */
  private updateTraceMetrics(): void {
    const completedSpans = this.completedSpans;
    const durations = completedSpans.map(span => span.duration || 0);
    
    this.traceMetrics.averageSpanDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    const sortedDurations = durations.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p99Index = Math.floor(sortedDurations.length * 0.99);
    
    this.traceMetrics.p95SpanDuration = sortedDurations[p95Index] || 0;
    this.traceMetrics.p99SpanDuration = sortedDurations[p99Index] || 0;

    this.traceMetrics.errorRate = this.traceMetrics.completedSpans > 0 
      ? this.traceMetrics.errorSpans / this.traceMetrics.completedSpans 
      : 0;

    const uptime = Date.now() - this.startTime;
    this.traceMetrics.tracesPerSecond = this.traceMetrics.totalTraces / (uptime / 1000);
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupOldSpans();
    }, this.cleanupInterval);
  }

  /**
   * Cleanup old spans
   */
  private cleanupOldSpans(): void {
    const cutoff = Date.now() - this.config.spanRetentionMs;
    const initialCount = this.completedSpans.length;
    
    this.completedSpans = this.completedSpans.filter(span => span.startTime >= cutoff);
    
    const removedCount = initialCount - this.completedSpans.length;
    if (removedCount > 0) {
      this.logger.debug(`Cleaned up ${removedCount} old spans`);
    }
  }

  /**
   * Generate span ID
   */
  private generateSpanId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Create a no-op span for when tracing is disabled
   */
  private createNoOpSpan(operationName: string): ValidationSpan {
    return {
      spanId: 'no-op',
      traceId: 'no-op',
      operationName,
      startTime: Date.now(),
      tags: {},
      logs: [],
      status: 'started',
    };
  }

  /**
   * Convert to Jaeger format
   */
  private convertToJaegerFormat(data: any): string {
    // Simplified Jaeger format conversion
    const jaegerSpans = data.traces.map((span: ValidationSpan) => ({
      traceID: span.traceId,
      spanID: span.spanId,
      parentSpanID: span.parentSpanId,
      operationName: span.operationName,
      startTime: span.startTime * 1000, // Convert to microseconds
      duration: (span.duration || 0) * 1000,
      tags: Object.entries(span.tags).map(([key, value]) => ({
        key,
        value,
        type: 'string',
      })),
      logs: span.logs.map(log => ({
        timestamp: log.timestamp * 1000,
        fields: [
          { key: 'level', value: log.level, type: 'string' },
          { key: 'message', value: log.message, type: 'string' },
        ],
      })),
    }));

    return JSON.stringify({ data: jaegerSpans }, null, 2);
  }

  /**
   * Convert to Zipkin format
   */
  private convertToZipkinFormat(data: any): string {
    // Simplified Zipkin format conversion
    const zipkinSpans = data.traces.map((span: ValidationSpan) => ({
      traceId: span.traceId,
      id: span.spanId,
      parentId: span.parentSpanId,
      name: span.operationName,
      timestamp: span.startTime * 1000, // Convert to microseconds
      duration: (span.duration || 0) * 1000,
      tags: span.tags,
      annotations: span.logs.map(log => ({
        timestamp: log.timestamp * 1000,
        value: log.message,
      })),
    }));

    return JSON.stringify(zipkinSpans, null, 2);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TracingConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log('Tracing configuration updated');
  }

  /**
   * Get configuration
   */
  getConfig(): TracingConfig {
    return { ...this.config };
  }
}
