/**
 * Health Check Routes
 */

import { Router, Request, Response } from 'express'
import { logger } from '../utils/logger'

const router = Router()

// Basic health check
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'payment-microservice',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env['NODE_ENV'] || 'development'
  })
})

// Detailed health check
router.get('/detailed', (_req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    service: 'payment-microservice',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env['NODE_ENV'] || 'development',
    checks: {
      database: 'healthy', // TODO: Add actual database health check
      redis: 'healthy',    // TODO: Add actual Redis health check
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external
      },
      cpu: process.cpuUsage()
    }
  }

  logger.info('Health check performed', { health })
  res.json(health)
})

// Readiness probe
router.get('/ready', (_req: Request, res: Response) => {
  // TODO: Add actual readiness checks (database connections, etc.)
  res.json({
    status: 'ready',
    service: 'payment-microservice',
    timestamp: new Date().toISOString()
  })
})

// Liveness probe
router.get('/live', (_req: Request, res: Response) => {
  res.json({
    status: 'alive',
    service: 'payment-microservice',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

export { router as healthRouter }
