/**
 * Fastify Ecommerce Platform - Main Entry Point
 * 
 * Google-grade functional ecommerce platform built with pure functional programming patterns.
 * Zero OOP, enterprise-ready architecture with instant microservice extraction capability.
 * 
 * Features:
 * - DDD with functional aggregates
 * - CQRS with event sourcing
 * - Clean architecture boundaries
 * - Railway-oriented programming
 * - Horizontal scalability (100 -> 1M+ users)
 * - Instant microservice extraction
 */

import Fastify from 'fastify'
import { config } from './config/index.js'
import { setupPlugins } from '@/infrastructure/plugins/index.js'
import { setupRoutes } from '@/api/routes/index.js'
import { gracefulShutdown } from '@/infrastructure/server/gracefulShutdown.js'

// Simple inline logger
const createLogger = () => ({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard'
    }
  }
})

/**
 * Application bootstrapper - Pure functional approach
 */
const createApplication = async () => {
  // Create Fastify instance with basic configuration
  const app = Fastify({
    logger: createLogger(),
    trustProxy: true,
    requestIdLogLabel: 'requestId',
    requestIdHeader: 'x-request-id',
    bodyLimit: 10485760, // 10MB
    keepAliveTimeout: 72000,
    pluginTimeout: 30000,
    disableRequestLogging: false,
    maxParamLength: 500,
    
    // Request validation
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        useDefaults: true,
        coerceTypes: 'array',
        allErrors: true
      }
    }
  })

  // Setup core plugins and middleware
  await setupPlugins(app)
  
  // Setup API routes
  await setupRoutes(app)
  
  // Setup graceful shutdown
  gracefulShutdown(app)
  
  return app
}

/**
 * Start the application server
 */
const startServer = async (): Promise<void> => {
  try {
    const app = await createApplication()
    
    // Start listening
    const address = await app.listen({
      port: config.server.port,
      host: config.server.host
    })
    
    app.log.info({
      message: 'Ecommerce platform started successfully',
      address,
      environment: config.env,
      nodeVersion: process.version,
      pid: process.pid,
      memory: process.memoryUsage()
    })
    
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

/**
 * Handle uncaught exceptions and rejections
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Start the application
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer()
}

export { createApplication, startServer }
