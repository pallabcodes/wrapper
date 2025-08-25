/**
 * Main Application Entry Point
 * 
 * Fastify server setup with authentication module
 * Demonstrates enterprise-grade application structure
 */

import type { FastifyInstance } from 'fastify'
import { createServer } from './config/server-config.js'
import { setupMiddleware } from './config/middleware.js'
import { setupSwagger } from './config/swagger-config.js'
import { setupRoutes } from './config/routes.js'
import { setupErrorHandling, setupGracefulShutdown } from './config/error-handling.js'

// ============================================================================
// SERVER SETUP
// ============================================================================

const fastify = createServer()

// ============================================================================
// APPLICATION SETUP
// ============================================================================

const setupApplication = async (): Promise<void> => {
  try {
    // Setup middleware
    await setupMiddleware(fastify)
    
    // Setup Swagger documentation (MUST be before routes)
    await setupSwagger(fastify)
    
    // Setup routes
    await setupRoutes(fastify)
    
    // Setup error handling
    setupErrorHandling(fastify)
    
    // Setup graceful shutdown
    setupGracefulShutdown(fastify)
    
  } catch (error) {
    fastify.log.error(error)
    throw error
  }
}

// ============================================================================
// SERVER STARTUP
// ============================================================================

const start = async (): Promise<void> => {
  try {
    // Setup the application
    await setupApplication()
    
    const host = process.env.HOST || '0.0.0.0'
    const port = parseInt(process.env.PORT || '3000', 10)
    
    const address = await fastify.listen({ 
      port, 
      host,
      backlog: 511 // Increase backlog for high-traffic scenarios
    })
    
    // Display user-friendly URLs (localhost instead of 0.0.0.0)
    const displayHost = host === '0.0.0.0' ? 'localhost' : host
    const displayUrl = `http://${displayHost}:${port}`
    
    console.log(`🚀 Server listening at ${displayUrl}`)
    console.log(`📚 API Documentation: ${displayUrl}/documentation`)
    console.log(`❤️  Health Check: ${displayUrl}/health`)
    console.log(`🔐 Auth Endpoints: ${displayUrl}/api/v1/auth/*`)
    
  } catch (error) {
    fastify.log.error({ err: error }, 'Failed to start server')
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// ============================================================================
// EXPORTS FOR TESTING
// ============================================================================

export { fastify, start }
export default fastify
