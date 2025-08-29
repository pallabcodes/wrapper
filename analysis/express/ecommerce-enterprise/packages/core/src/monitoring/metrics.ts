/**
 * Metrics & Monitoring - Enterprise Observability
 * 
 * Comprehensive metrics collection and monitoring system.
 * Following internal team patterns for enterprise applications.
 */

import { logger } from '../utils/logger'

// ============================================================================
// METRICS INTERFACES
// ============================================================================

export interface MetricValue {
  value: number
  timestamp: number
  labels?: Record<string, string>
}

export interface Metric {
  name: string
  type: 'counter' | 'gauge' | 'histogram' | 'summary'
  description: string
  values: MetricValue[]
  labels?: Record<string, string>
}

export interface MetricsCollector {
  increment(name: string, value?: number, labels?: Record<string, string>): void
  gauge(name: string, value: number, labels?: Record<string, string>): void
  histogram(name: string, value: number, labels?: Record<string, string>): void
  summary(name: string, value: number, labels?: Record<string, string>): void
  getMetrics(): Metric[]
  reset(): void
}

// ============================================================================
// METRICS COLLECTOR IMPLEMENTATION
// ============================================================================

class MetricsCollectorImpl implements MetricsCollector {
  private metrics: Map<string, Metric> = new Map()

  increment(name: string, value: number = 1, labels?: Record<string, string>): void {
    const metric = this.getOrCreateMetric(name, 'counter', 'Counter metric')
    
    const existingValue = metric.values.find(v => 
      this.areLabelsEqual(v.labels, labels)
    )
    
    if (existingValue) {
      existingValue.value += value
      existingValue.timestamp = Date.now()
    } else {
      metric.values.push({
        value,
        timestamp: Date.now(),
        labels: labels || {}
      })
    }
    
    logger.debug('Metric incremented', { name, value, labels })
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.getOrCreateMetric(name, 'gauge', 'Gauge metric')
    
    const existingValue = metric.values.find(v => 
      this.areLabelsEqual(v.labels, labels)
    )
    
    if (existingValue) {
      existingValue.value = value
      existingValue.timestamp = Date.now()
    } else {
      metric.values.push({
        value,
        timestamp: Date.now(),
        labels: labels || {}
      })
    }
    
    logger.debug('Metric gauge set', { name, value, labels })
  }

  histogram(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.getOrCreateMetric(name, 'histogram', 'Histogram metric')
    
    metric.values.push({
      value,
      timestamp: Date.now(),
      labels: labels || {}
    })
    
    logger.debug('Metric histogram recorded', { name, value, labels })
  }

  summary(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.getOrCreateMetric(name, 'summary', 'Summary metric')
    
    metric.values.push({
      value,
      timestamp: Date.now(),
      labels: labels || {}
    })
    
    logger.debug('Metric summary recorded', { name, value, labels })
  }

  getMetrics(): Metric[] {
    return Array.from(this.metrics.values())
  }

  reset(): void {
    this.metrics.clear()
    logger.info('Metrics reset')
  }

  private getOrCreateMetric(name: string, type: Metric['type'], description: string): Metric {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        name,
        type,
        description,
        values: []
      })
    }
    return this.metrics.get(name)!
  }

  private areLabelsEqual(labels1?: Record<string, string>, labels2?: Record<string, string>): boolean {
    if (!labels1 && !labels2) return true
    if (!labels1 || !labels2) return false
    
    const keys1 = Object.keys(labels1)
    const keys2 = Object.keys(labels2)
    
    if (keys1.length !== keys2.length) return false
    
    return keys1.every(key => labels1[key] === labels2[key])
  }
}

// ============================================================================
// APPLICATION METRICS
// ============================================================================

export class ApplicationMetrics {
  private collector: MetricsCollector

  constructor() {
    this.collector = new MetricsCollectorImpl()
  }

  // Public method to access collector for health checks
  getCollector(): MetricsCollector {
    return this.collector
  }

  // HTTP Request Metrics
  recordHttpRequest(method: string, path: string, statusCode: number, duration: number): void {
    this.collector.increment('http_requests_total', 1, {
      method,
      path,
      status: statusCode.toString()
    })
    
    this.collector.histogram('http_request_duration_seconds', duration / 1000, {
      method,
      path
    })
  }

  // Database Metrics
  recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void {
    this.collector.increment('database_queries_total', 1, {
      operation,
      table,
      success: success.toString()
    })
    
    this.collector.histogram('database_query_duration_seconds', duration / 1000, {
      operation,
      table
    })
  }

  // Authentication Metrics
  recordLoginAttempt(success: boolean, method: string = 'password'): void {
    this.collector.increment('auth_login_attempts_total', 1, {
      success: success.toString(),
      method
    })
  }

  recordTokenRefresh(success: boolean): void {
    this.collector.increment('auth_token_refreshes_total', 1, {
      success: success.toString()
    })
  }

  // Business Metrics
  recordUserRegistration(): void {
    this.collector.increment('users_registered_total')
  }

  recordProductCreation(): void {
    this.collector.increment('products_created_total')
  }

  recordOrderCreation(amount: number): void {
    this.collector.increment('orders_created_total')
    this.collector.histogram('order_amount_dollars', amount)
  }

  // System Metrics
  recordMemoryUsage(heapUsed: number, heapTotal: number): void {
    this.collector.gauge('nodejs_heap_size_used_bytes', heapUsed)
    this.collector.gauge('nodejs_heap_size_total_bytes', heapTotal)
  }

  recordCpuUsage(usage: number): void {
    this.collector.gauge('nodejs_cpu_usage_percent', usage)
  }

  recordActiveConnections(count: number): void {
    this.collector.gauge('nodejs_active_connections', count)
  }

  // Error Metrics
  recordError(errorType: string, errorCode?: string): void {
    this.collector.increment('errors_total', 1, {
      type: errorType,
      code: errorCode || 'unknown'
    })
  }

  // Rate Limiting Metrics
  recordRateLimitExceeded(endpoint: string): void {
    this.collector.increment('rate_limit_exceeded_total', 1, {
      endpoint
    })
  }

  // Health Check Metrics
  recordHealthCheck(success: boolean, service: string): void {
    this.collector.increment('health_check_total', 1, {
      success: success.toString(),
      service
    })
  }

  // Get all metrics
  getMetrics(): Metric[] {
    return this.collector.getMetrics()
  }

  // Reset metrics
  reset(): void {
    this.collector.reset()
  }

  // Export metrics in Prometheus format
  exportPrometheusFormat(): string {
    const metrics = this.getMetrics()
    let output = ''

    for (const metric of metrics) {
      output += `# HELP ${metric.name} ${metric.description}\n`
      output += `# TYPE ${metric.name} ${metric.type}\n`
      
      for (const value of metric.values) {
        const labels = value.labels 
          ? `{${Object.entries(value.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
          : ''
        
        output += `${metric.name}${labels} ${value.value}\n`
      }
      output += '\n'
    }

    return output
  }
}

// ============================================================================
// METRICS MIDDLEWARE
// ============================================================================

export const createMetricsMiddleware = (metrics: ApplicationMetrics) => {
  return (req: any, res: any, next: any) => {
    const startTime = process.hrtime.bigint()
    
    // Override res.end to capture response metrics
    const originalEnd = res.end
    res.end = function(chunk?: any, encoding?: any) {
      const endTime = process.hrtime.bigint()
      const duration = Number(endTime - startTime) / 1000000 // Convert to milliseconds
      
      metrics.recordHttpRequest(
        req.method,
        req.path || req.url,
        res.statusCode,
        duration
      )
      
      originalEnd.call(this, chunk, encoding)
    }
    
    next()
  }
}

// ============================================================================
// HEALTH CHECK METRICS
// ============================================================================

export const createHealthCheckMetrics = (metrics: ApplicationMetrics) => {
  return {
    recordHealthCheck(success: boolean, service: string): void {
      metrics.recordHealthCheck(success, service)
    },
    
    recordUptime(uptime: number): void {
      metrics.getCollector().gauge('application_uptime_seconds', uptime)
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const applicationMetrics = new ApplicationMetrics()
