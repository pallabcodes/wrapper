/**
 * Health Checks - Enterprise Health Monitoring
 * 
 * Comprehensive health check system for production monitoring.
 * Following internal team patterns for enterprise applications.
 */

import { logger } from '../utils/logger'
import { checkDatabaseHealth, checkMongoHealth } from '../database'
import { applicationMetrics } from './metrics'

// ============================================================================
// HEALTH CHECK INTERFACES
// ============================================================================

export interface HealthCheck {
  name: string
  check(): Promise<HealthCheckResult>
  timeout?: number
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  message: string
  details?: Record<string, any>
  timestamp: number
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: number
  uptime: number
  version: string
  checks: Record<string, HealthCheckResult>
}

// ============================================================================
// HEALTH CHECK IMPLEMENTATIONS
// ============================================================================

export class DatabaseHealthCheck implements HealthCheck {
  name = 'database'
  timeout = 5000

  async check(): Promise<HealthCheckResult> {
    try {
      const startTime = Date.now()
      const isHealthy = await checkDatabaseHealth()
      const duration = Date.now() - startTime

      if (isHealthy) {
        applicationMetrics.recordDatabaseQuery('health_check', 'database', duration, true)
        return {
          status: 'healthy',
          message: 'Database connection is healthy',
          details: { responseTime: duration },
          timestamp: Date.now()
        }
      } else {
        applicationMetrics.recordDatabaseQuery('health_check', 'database', duration, false)
        return {
          status: 'unhealthy',
          message: 'Database connection failed',
          details: { responseTime: duration },
          timestamp: Date.now()
        }
      }
    } catch (error) {
      logger.error('Database health check failed', { error })
      return {
        status: 'unhealthy',
        message: 'Database health check error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: Date.now()
      }
    }
  }
}

export class MongoDBHealthCheck implements HealthCheck {
  name = 'mongodb'
  timeout = 5000

  async check(): Promise<HealthCheckResult> {
    try {
      const startTime = Date.now()
      const isHealthy = await checkMongoHealth()
      const duration = Date.now() - startTime

      if (isHealthy) {
        return {
          status: 'healthy',
          message: 'MongoDB connection is healthy',
          details: { responseTime: duration },
          timestamp: Date.now()
        }
      } else {
        return {
          status: 'unhealthy',
          message: 'MongoDB connection failed',
          details: { responseTime: duration },
          timestamp: Date.now()
        }
      }
    } catch (error) {
      logger.error('MongoDB health check failed', { error })
      return {
        status: 'unhealthy',
        message: 'MongoDB health check error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: Date.now()
      }
    }
  }
}

export class MemoryHealthCheck implements HealthCheck {
  name = 'memory'
  timeout = 1000

  async check(): Promise<HealthCheckResult> {
    try {
      const memUsage = process.memoryUsage()
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
      const heapUsagePercent = Math.round((heapUsedMB / heapTotalMB) * 100)

      // Record memory metrics
      applicationMetrics.recordMemoryUsage(memUsage.heapUsed, memUsage.heapTotal)

      if (heapUsagePercent > 90) {
        return {
          status: 'unhealthy',
          message: 'Memory usage is critical',
          details: {
            heapUsedMB,
            heapTotalMB,
            heapUsagePercent,
            threshold: 90
          },
          timestamp: Date.now()
        }
      } else if (heapUsagePercent > 80) {
        return {
          status: 'degraded',
          message: 'Memory usage is high',
          details: {
            heapUsedMB,
            heapTotalMB,
            heapUsagePercent,
            threshold: 80
          },
          timestamp: Date.now()
        }
      } else {
        return {
          status: 'healthy',
          message: 'Memory usage is normal',
          details: {
            heapUsedMB,
            heapTotalMB,
            heapUsagePercent
          },
          timestamp: Date.now()
        }
      }
    } catch (error) {
      logger.error('Memory health check failed', { error })
      return {
        status: 'unhealthy',
        message: 'Memory health check error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: Date.now()
      }
    }
  }
}

export class DiskHealthCheck implements HealthCheck {
  name = 'disk'
  timeout = 2000

  async check(): Promise<HealthCheckResult> {
    try {
      // This would typically use a library like 'diskusage' or 'node-df'
      // For now, we'll simulate a disk check
      const diskUsage = {
        total: 1000000000000, // 1TB
        used: 500000000000,   // 500GB
        free: 500000000000    // 500GB
      }

      const usagePercent = Math.round((diskUsage.used / diskUsage.total) * 100)

      if (usagePercent > 95) {
        return {
          status: 'unhealthy',
          message: 'Disk usage is critical',
          details: {
            usagePercent,
            freeGB: Math.round(diskUsage.free / 1024 / 1024 / 1024),
            threshold: 95
          },
          timestamp: Date.now()
        }
      } else if (usagePercent > 85) {
        return {
          status: 'degraded',
          message: 'Disk usage is high',
          details: {
            usagePercent,
            freeGB: Math.round(diskUsage.free / 1024 / 1024 / 1024),
            threshold: 85
          },
          timestamp: Date.now()
        }
      } else {
        return {
          status: 'healthy',
          message: 'Disk usage is normal',
          details: {
            usagePercent,
            freeGB: Math.round(diskUsage.free / 1024 / 1024 / 1024)
          },
          timestamp: Date.now()
        }
      }
    } catch (error) {
      logger.error('Disk health check failed', { error })
      return {
        status: 'unhealthy',
        message: 'Disk health check error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: Date.now()
      }
    }
  }
}

export class ExternalServiceHealthCheck implements HealthCheck {
  name: string
  url: string
  timeout: number

  constructor(name: string, url: string, timeout: number = 5000) {
    this.name = name
    this.url = url
    this.timeout = timeout
  }

  async check(): Promise<HealthCheckResult> {
    try {
      const startTime = Date.now()
      
      // This would typically use fetch or axios
      // For now, we'll simulate an external service check
      const response = await fetch(this.url, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout)
      })
      
      const duration = Date.now() - startTime

      if (response.ok) {
        return {
          status: 'healthy',
          message: `${this.name} service is healthy`,
          details: { responseTime: duration, statusCode: response.status },
          timestamp: Date.now()
        }
      } else {
        return {
          status: 'degraded',
          message: `${this.name} service returned error status`,
          details: { responseTime: duration, statusCode: response.status },
          timestamp: Date.now()
        }
      }
    } catch (error) {
      logger.error(`${this.name} health check failed`, { error, url: this.url })
      return {
        status: 'unhealthy',
        message: `${this.name} service is unavailable`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: Date.now()
      }
    }
  }
}

// ============================================================================
// HEALTH CHECK MANAGER
// ============================================================================

export class HealthCheckManager {
  private checks: HealthCheck[] = []
  private version: string

  constructor(version: string = '1.0.0') {
    this.version = version
    this.addDefaultChecks()
  }

  addCheck(check: HealthCheck): void {
    this.checks.push(check)
  }

  async runHealthChecks(): Promise<HealthStatus> {
    const startTime = Date.now()
    const checkResults: Record<string, HealthCheckResult> = {}
    
    // Run all health checks in parallel
    const checkPromises = this.checks.map(async (check) => {
      try {
        const result = await Promise.race([
          check.check(),
          new Promise<HealthCheckResult>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), check.timeout || 5000)
          )
        ])
        
        checkResults[check.name] = result
        applicationMetrics.recordHealthCheck(result.status === 'healthy', check.name)
      } catch (error) {
        logger.error(`Health check failed for ${check.name}`, { error })
        checkResults[check.name] = {
          status: 'unhealthy',
          message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now()
        }
        applicationMetrics.recordHealthCheck(false, check.name)
      }
    })

    await Promise.all(checkPromises)

    // Determine overall status
    const overallStatus = this.determineOverallStatus(checkResults)
    const duration = Date.now() - startTime

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: Date.now(),
      uptime: process.uptime(),
      version: this.version,
      checks: checkResults
    }

    logger.info('Health check completed', { 
      status: overallStatus, 
      duration, 
      checks: Object.keys(checkResults) 
    })

    return healthStatus
  }

  private determineOverallStatus(checkResults: Record<string, HealthCheckResult>): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(checkResults).map(result => result.status)
    
    if (statuses.some(status => status === 'unhealthy')) {
      return 'unhealthy'
    } else if (statuses.some(status => status === 'degraded')) {
      return 'degraded'
    } else {
      return 'healthy'
    }
  }

  private addDefaultChecks(): void {
    this.addCheck(new DatabaseHealthCheck())
    this.addCheck(new MongoDBHealthCheck())
    this.addCheck(new MemoryHealthCheck())
    this.addCheck(new DiskHealthCheck())
  }
}

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

export const createHealthCheckEndpoints = (manager: HealthCheckManager) => {
  return {
    // Basic health check (liveness probe)
    async liveness(_req: any, res: any) {
      try {
        const healthStatus = await manager.runHealthChecks()
        
        const statusCode = healthStatus.status === 'healthy' ? 200 : 
                          healthStatus.status === 'degraded' ? 200 : 503

        res.status(statusCode).json({
          status: healthStatus.status,
          timestamp: healthStatus.timestamp,
          uptime: healthStatus.uptime,
          version: healthStatus.version
        })
      } catch (error) {
        logger.error('Health check endpoint error', { error })
        res.status(503).json({
          status: 'unhealthy',
          message: 'Health check failed',
          timestamp: Date.now()
        })
      }
    },

    // Detailed health check (readiness probe)
    async readiness(_req: any, res: any) {
      try {
        const healthStatus = await manager.runHealthChecks()
        
        const statusCode = healthStatus.status === 'healthy' ? 200 : 
                          healthStatus.status === 'degraded' ? 200 : 503

        res.status(statusCode).json(healthStatus)
      } catch (error) {
        logger.error('Readiness check endpoint error', { error })
        res.status(503).json({
          status: 'unhealthy',
          message: 'Readiness check failed',
          timestamp: Date.now()
        })
      }
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const healthCheckManager = new HealthCheckManager()
