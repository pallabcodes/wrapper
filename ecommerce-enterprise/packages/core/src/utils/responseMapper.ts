/**
 * Response Mapper - Functional Programming Approach
 * 
 * Base response mapper that controllers can use, customize, wrap, or modify.
 * Kept under 200 lines for maintainability.
 */

import { z } from 'zod'

// ============================================================================
// BASE SCHEMAS AND TYPES
// ============================================================================

export const baseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  timestamp: z.string(),
  requestId: z.string().optional(),
  data: z.unknown().optional(),
  meta: z.object({
    version: z.string(),
    environment: z.string()
  }).optional()
})

export interface BaseResponse {
  success: boolean;
  message: string;
  timestamp: string;
  requestId?: string;
  data?: unknown;
  meta?: {
    version: string;
    environment: string;
  };
}

export type ResponseMeta = {
  version?: string
  environment?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters?: Record<string, unknown>
  sorting?: {
    field: string
    direction: 'asc' | 'desc'
  }
  cache?: {
    cached: boolean
    ttl?: number
  }
}

// ============================================================================
// CORE RESPONSE BUILDER
// ============================================================================

export const createResponse = <T = unknown>(
  success: boolean,
  message: string,
  data?: T,
  meta?: ResponseMeta,
  requestId?: string
): BaseResponse & { data?: T } => ({
  success,
  message,
  timestamp: new Date().toISOString(),
  requestId: requestId ?? '',
  ...(data !== undefined && { data }),
  meta: {
    version: process.env['npm_package_version'] || '1.0.0',
    environment: process.env['NODE_ENV'] || 'development',
    ...meta
  }
})

// ============================================================================
// SUCCESS RESPONSES
// ============================================================================

export const successResponse = <T = unknown>(
  data: T,
  message = 'Operation completed successfully',
  meta?: ResponseMeta,
  requestId?: string
) => createResponse(true, message, data, meta, requestId)

export const createdResponse = <T = unknown>(
  data: T,
  message = 'Resource created successfully',
  meta?: ResponseMeta,
  requestId?: string
) => createResponse(true, message, data, meta, requestId)

export const updatedResponse = <T = unknown>(
  data: T,
  message = 'Resource updated successfully',
  meta?: ResponseMeta,
  requestId?: string
) => createResponse(true, message, data, meta, requestId)

export const deletedResponse = (
  message = 'Resource deleted successfully',
  meta?: ResponseMeta,
  requestId?: string
) => createResponse(true, message, undefined, meta, requestId)

// ============================================================================
// ERROR RESPONSES
// ============================================================================

export const errorResponse = (
  message: string,
  errorCode?: string,
  meta?: ResponseMeta,
  requestId?: string
) => createResponse(false, message, { errorCode }, meta, requestId)

export const validationErrorResponse = (
  errors: Record<string, string[]>,
  message = 'Validation failed',
  requestId?: string
) => createResponse(false, message, { errors }, undefined, requestId)

export const notFoundResponse = (
  message = 'Resource not found',
  requestId?: string
) => createResponse(false, message, undefined, undefined, requestId)

export const unauthorizedResponse = (
  message = 'Unauthorized',
  requestId?: string
) => createResponse(false, message, undefined, undefined, requestId)

export const forbiddenResponse = (
  message = 'Forbidden',
  requestId?: string
) => createResponse(false, message, undefined, undefined, requestId)

// ============================================================================
// ADVANCED RESPONSES
// ============================================================================

export const paginatedResponse = <T = unknown>(
  data: T[],
  pagination: ResponseMeta['pagination'],
  message = 'Data retrieved successfully',
  requestId?: string
) => createResponse(true, message, data, { ...(pagination && { pagination }) }, requestId)

// ============================================================================
// EXPRESS INTEGRATION
// ============================================================================

import { Response } from 'express'

export const responseWrapper = {
  success: <T = unknown>(res: Response, data: T, message?: string, status = 200) => {
    const response = successResponse(data, message)
    return res.status(status).json(response)
  },

  created: <T = unknown>(res: Response, data: T, message?: string) => {
    const response = createdResponse(data, message)
    return res.status(201).json(response)
  },

  updated: <T = unknown>(res: Response, data: T, message?: string) => {
    const response = updatedResponse(data, message)
    return res.status(200).json(response)
  },

  deleted: (res: Response, message?: string) => {
    const response = deletedResponse(message)
    return res.status(200).json(response)
  },

  error: (res: Response, message: string, status = 500, errorCode?: string) => {
    const response = errorResponse(message, errorCode)
    return res.status(status).json(response)
  },

  validationError: (res: Response, errors: Record<string, string[]>, message?: string) => {
    const response = validationErrorResponse(errors, message)
    return res.status(400).json(response)
  },

  notFound: (res: Response, message?: string) => {
    const response = notFoundResponse(message)
    return res.status(404).json(response)
  },

  unauthorized: (res: Response, message?: string) => {
    const response = unauthorizedResponse(message)
    return res.status(401).json(response)
  },

  forbidden: (res: Response, message?: string) => {
    const response = forbiddenResponse(message)
    return res.status(403).json(response)
  },


}
