/**
 * Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface AppError extends Error {
  statusCode?: number
  code?: string
  isOperational?: boolean
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // Default error values
  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal Server Error'
  const code = error.code || 'INTERNAL_ERROR'

  // Don't leak error details in production
  const isDevelopment = process.env['NODE_ENV'] === 'development'
  const errorResponse = {
    error: {
      code,
      message: isDevelopment ? message : 'Something went wrong',
      ...(isDevelopment && { stack: error.stack })
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  }

  // Set response status and send error
  res.status(statusCode).json(errorResponse)
}

export const createError = (message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR'): AppError => {
  const error = new Error(message) as AppError
  error.statusCode = statusCode
  error.code = code
  error.isOperational = true
  return error
}

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`
    },
    timestamp: new Date().toISOString()
  })
}

export const methodNotAllowed = (req: Request, res: Response): void => {
  res.status(405).json({
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: `Method ${req.method} not allowed for ${req.originalUrl}`
    },
    timestamp: new Date().toISOString()
  })
}
