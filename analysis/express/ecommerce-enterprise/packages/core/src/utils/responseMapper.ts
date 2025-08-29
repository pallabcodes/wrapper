/**
 * Response Mapper - Functional Programming Approach
 * 
 * Provides a consistent response structure with functional composition
 * for customizing, wrapping, and modifying responses.
 */

import { z } from 'zod'

// Base response schema
export const baseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  timestamp: z.string(),
  requestId: z.string().optional(),
  data: z.any().optional(),
  meta: z.object({
    version: z.string(),
    environment: z.string()
  }).optional()
})

export type BaseResponse = z.infer<typeof baseResponseSchema>

// Response metadata
export type ResponseMeta = {
  version?: string
  environment?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters?: Record<string, any>
  sorting?: {
    field: string
    direction: 'asc' | 'desc'
  }
  cache?: {
    cached: boolean
    ttl?: number
  }
}

// Functional response builder
export const createResponse = <T = any>(
  success: boolean,
  message: string,
  data?: T,
  meta?: ResponseMeta,
  requestId?: string
): BaseResponse & { data?: T } => ({
  success,
  message,
  timestamp: new Date().toISOString(),
  requestId,
  ...(data !== undefined && { data }),
  meta: {
    version: process.env['npm_package_version'] || '1.0.0',
    environment: process.env['NODE_ENV'] || 'development',
    ...meta
  }
})

// Success response composers
export const successResponse = <T = any>(
  data: T,
  message = 'Operation completed successfully',
  meta?: ResponseMeta,
  requestId?: string
) => createResponse(true, message, data, meta, requestId)

export const createdResponse = <T = any>(
  data: T,
  message = 'Resource created successfully',
  meta?: ResponseMeta,
  requestId?: string
) => createResponse(true, message, data, meta, requestId)

export const updatedResponse = <T = any>(
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

// Error response composers
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
  resource = 'Resource',
  requestId?: string
) => createResponse(false, `${resource} not found`, undefined, undefined, requestId)

export const unauthorizedResponse = (
  message = 'Unauthorized access',
  requestId?: string
) => createResponse(false, message, undefined, undefined, requestId)

export const forbiddenResponse = (
  message = 'Access forbidden',
  requestId?: string
) => createResponse(false, message, undefined, undefined, requestId)

// Pagination response composer
export const paginatedResponse = <T = any>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message = 'Data retrieved successfully',
  requestId?: string
) => {
  const totalPages = Math.ceil(total / limit)
  const meta: ResponseMeta = {
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  }
  
  return createResponse(true, message, data, meta, requestId)
}

// Cached response composer
export const cachedResponse = <T = any>(
  data: T,
  ttl: number,
  message = 'Data retrieved from cache',
  requestId?: string
) => {
  const meta: ResponseMeta = {
    cache: {
      cached: true,
      ttl
    }
  }
  
  return createResponse(true, message, data, meta, requestId)
}

// Response transformers (functional composition)
export const withPagination = <T>(
  response: BaseResponse & { data?: T },
  page: number,
  limit: number,
  total: number
) => ({
  ...response,
  meta: {
    ...response.meta,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
})

export const withFilters = <T>(
  response: BaseResponse & { data?: T },
  filters: Record<string, any>
) => ({
  ...response,
  meta: {
    ...response.meta,
    filters
  }
})

export const withSorting = <T>(
  response: BaseResponse & { data?: T },
  field: string,
  direction: 'asc' | 'desc'
) => ({
  ...response,
  meta: {
    ...response.meta,
    sorting: { field, direction }
  }
})

export const withCache = <T>(
  response: BaseResponse & { data?: T },
  ttl?: number
) => ({
  ...response,
  meta: {
    ...response.meta,
    cache: {
      cached: true,
      ttl
    }
  }
})

// Response wrapper for Express
export const responseWrapper = {
  success: <T = any>(res: any, data: T, message?: string, meta?: ResponseMeta) => {
    const requestId = res.getHeader('x-request-id')
    return res.json(successResponse(data, message, meta, requestId))
  },

  created: <T = any>(res: any, data: T, message?: string, meta?: ResponseMeta) => {
    const requestId = res.getHeader('x-request-id')
    return res.status(201).json(createdResponse(data, message, meta, requestId))
  },

  updated: <T = any>(res: any, data: T, message?: string, meta?: ResponseMeta) => {
    const requestId = res.getHeader('x-request-id')
    return res.json(updatedResponse(data, message, meta, requestId))
  },

  deleted: (res: any, message?: string, meta?: ResponseMeta) => {
    const requestId = res.getHeader('x-request-id')
    return res.json(deletedResponse(message, meta, requestId))
  },

  error: (res: any, message: string, statusCode = 400, errorCode?: string, meta?: ResponseMeta) => {
    const requestId = res.getHeader('x-request-id')
    return res.status(statusCode).json(errorResponse(message, errorCode, meta, requestId))
  },

  validationError: (res: any, errors: Record<string, string[]>, message?: string) => {
    const requestId = res.getHeader('x-request-id')
    return res.status(400).json(validationErrorResponse(errors, message, requestId))
  },

  notFound: (res: any, resource?: string) => {
    const requestId = res.getHeader('x-request-id')
    return res.status(404).json(notFoundResponse(resource, requestId))
  },

  unauthorized: (res: any, message?: string) => {
    const requestId = res.getHeader('x-request-id')
    return res.status(401).json(unauthorizedResponse(message, requestId))
  },

  forbidden: (res: any, message?: string) => {
    const requestId = res.getHeader('x-request-id')
    return res.status(403).json(forbiddenResponse(message, requestId))
  },

  paginated: <T = any>(
    res: any, 
    data: T[], 
    page: number, 
    limit: number, 
    total: number, 
    message?: string
  ) => {
    const requestId = res.getHeader('x-request-id')
    return res.json(paginatedResponse(data, page, limit, total, message, requestId))
  }
}

// Higher-order function for response transformation
export const transformResponse = <T>(
  baseResponse: BaseResponse & { data?: T },
  ...transformers: Array<(response: BaseResponse & { data?: T }) => BaseResponse & { data?: T }>
) => transformers.reduce((response, transformer) => transformer(response), baseResponse)
