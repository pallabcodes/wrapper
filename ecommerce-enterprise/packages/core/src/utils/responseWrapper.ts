/**
 * Response Wrapper - Standardized API Responses
 * 
 * Utility functions for creating consistent API responses.
 * Following internal team patterns for enterprise applications.
 */

import { Response } from 'express'

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  timestamp: string
  meta?: {
    version: string
    environment: string
  }
}

export interface ErrorResponse extends ApiResponse {
  success: false
  errorCode?: string | undefined
  details?: Record<string, any> | undefined
}

// ============================================================================
// RESPONSE FUNCTIONS
// ============================================================================

export const createSuccessResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    meta: {
      version: '1.0.0',
      environment: process.env['NODE_ENV'] || 'development'
    }
  }

  res.status(statusCode).json(response)
}

export const createErrorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errorCode?: string,
  details?: Record<string, any>
): void => {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    errorCode: errorCode || undefined,
    details: details || undefined,
    meta: {
      version: '1.0.0',
      environment: process.env['NODE_ENV'] || 'development'
    }
  }

  res.status(statusCode).json(response)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const createNotFoundResponse = (
  res: Response,
  resource: string = 'Resource'
): void => {
  createErrorResponse(
    res,
    `${resource} not found`,
    404,
    'NOT_FOUND'
  )
}

export const createValidationErrorResponse = (
  res: Response,
  details: Record<string, any>
): void => {
  createErrorResponse(
    res,
    'Validation failed',
    400,
    'VALIDATION_ERROR',
    details
  )
}

export const createUnauthorizedResponse = (
  res: Response,
  message: string = 'Unauthorized'
): void => {
  createErrorResponse(
    res,
    message,
    401,
    'UNAUTHORIZED'
  )
}

export const createForbiddenResponse = (
  res: Response,
  message: string = 'Forbidden'
): void => {
  createErrorResponse(
    res,
    message,
    403,
    'FORBIDDEN'
  )
}

export const createConflictResponse = (
  res: Response,
  message: string = 'Conflict',
  details?: Record<string, any>
): void => {
  createErrorResponse(
    res,
    message,
    409,
    'CONFLICT',
    details
  )
}

export const createInternalErrorResponse = (
  res: Response,
  message: string = 'Internal server error'
): void => {
  createErrorResponse(
    res,
    message,
    500,
    'INTERNAL_ERROR'
  )
}
