/**
 * Error Handling Configuration
 * 
 * Global error handling for enterprise ecommerce platform
 */

import type { FastifyInstance } from 'fastify'

// ============================================================================
// ERROR HANDLING
// ============================================================================

export const setupErrorHandling = (fastify: FastifyInstance): void => {
  fastify.setErrorHandler(async (error, request, reply) => {
    const requestId = request.id

    // Log error with context
    request.log.error({
      error: {
        message: error.message,
        stack: error.stack,
        statusCode: error.statusCode || 500
      },
      requestId,
      url: request.url,
      method: request.method
    }, 'Request error occurred')

    // Development vs Production error responses
    if (process.env.NODE_ENV === 'production') {
      // Production: sanitized error response
      const statusCode = error.statusCode || 500
      const message = statusCode < 500 ? error.message : 'Internal Server Error'
      
      return reply.status(statusCode).send({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message,
          requestId
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId
        }
      })
    } else {
      // Development: detailed error response
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
          stack: error.stack,
          requestId
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId
        }
      })
    }
  })
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

export const setupGracefulShutdown = (fastify: FastifyInstance): void => {
  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`)
    
    try {
      await fastify.close()
      console.log('Server closed successfully')
      process.exit(0)
    } catch (error) {
      console.error('Error during shutdown:', error)
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
}
