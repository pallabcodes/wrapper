/**
 * Request Logger Middleware
 */

import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now()
  
  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  })

  // Override res.end to log response
  const originalEnd = res.end
  res.end = function(chunk?: any, encoding?: any): any {
    const duration = Date.now() - start
    
    // Log request completion
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    })

    // Call original end method
    return originalEnd.call(this, chunk, encoding)
  }

  next()
}

export const logRequest = (req: Request, res: Response, next: NextFunction): void => {
  logger.debug('Incoming request', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString()
  })
  next()
}

export const logResponse = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send
  res.send = function(body: any) {
    logger.debug('Outgoing response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      body: body,
      timestamp: new Date().toISOString()
    })
    return originalSend.call(this, body)
  }
  next()
}
