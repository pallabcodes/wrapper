/**
 * Custom Logger Configuration
 * 
 * Production-ready logging with structured output
 * Functional approach with type safety
 */

import pino from 'pino'
import type { FastifyRequest, FastifyReply } from 'fastify'

// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================

const createLogger = (options: pino.LoggerOptions = {}) => {
  const config: pino.LoggerOptions = {
    level: options.level || 'info',
    redact: options.redact || ['req.headers.authorization', 'req.headers.cookie'],
    serializers: {
      req: (req: FastifyRequest) => ({
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        params: req.params,
        body: req.body,
        user: req.user
      }),
      res: (res: FastifyReply) => ({
        statusCode: res.statusCode,
        headers: res.getHeaders()
      }),
      err: (err: Error) => ({
        type: err.constructor.name,
        message: err.message,
        stack: err.stack,
        code: (err as any).code
      })
    },
    ...options
  }

  const logger = pino(config)

  // ============================================================================
  // CUSTOM LOG METHODS
  // ============================================================================

  const customLogger = {
    ...logger,
    logRequest: (req: FastifyRequest, res: FastifyReply, responseTime: number): void => {
      logger.info('Request processed', {
        type: 'request',
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime,
        user: req.user?.id
      })
    },

    logError: (error: Error, req?: FastifyRequest): void => {
      logger.error('Error occurred', {
        type: 'error',
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: (error as any).code
        },
        request: req ? {
          method: req.method,
          url: req.url,
          user: req.user?.id
        } : undefined
      })
    },

    logSecurity: (event: string, details: Record<string, unknown>): void => {
      logger.warn('Security event', {
        type: 'security',
        event,
        details,
        timestamp: new Date().toISOString()
      })
    },

    logBusiness: (event: string, details: Record<string, unknown>): void => {
      logger.info('Business event', {
        type: 'business',
        event,
        details,
        timestamp: new Date().toISOString()
      })
    }
  }

  return customLogger
}

// ============================================================================
// DEFAULT LOGGER INSTANCE
// ============================================================================

export const logger = createLogger({
  level: (process.env.LOG_LEVEL as any) || 'info'
})

// ============================================================================
// LOGGER FACTORY
// ============================================================================

export const createAppLogger = (appName: string, options?: pino.LoggerOptions) => {
  return createLogger({
    name: appName,
    ...options
  })
}

// ============================================================================
// LOGGER UTILITIES
// ============================================================================

export const logRequest = (req: FastifyRequest, res: FastifyReply, responseTime: number): void => {
  logger.logRequest(req, res, responseTime)
}

export const logError = (error: Error, req?: FastifyRequest): void => {
  logger.logError(error, req)
}

export const logSecurity = (event: string, details: Record<string, unknown>): void => {
  logger.logSecurity(event, details)
}

export const logBusiness = (event: string, details: Record<string, unknown>): void => {
  logger.logBusiness(event, details)
}

export default logger