/**
 * Response Builder
 * 
 * Core response building functionality
 */

import type { FastifyReply } from 'fastify'
import type { 
  SuccessResponse, 
  ErrorResponse, 
  ResponseMeta, 
  PaginationMeta 
} from './types.js'

export class ResponseBuilder<T = unknown> {
  private readonly reply: FastifyReply
  private readonly requestId: string
  private readonly version: string

  constructor(reply: FastifyReply) {
    this.reply = reply
    this.requestId = reply.request.id || 'unknown'
    this.version = process.env.npm_package_version || '1.0.0'
  }

  success(data: T, meta?: Partial<ResponseMeta>): SuccessResponse<T> {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      meta: {
        timestamp: new Date(),
        requestId: this.requestId,
        version: this.version,
        ...meta
      }
    }
    
    return response
  }

  error(
    code: string, 
    message: string, 
    details?: Record<string, unknown>,
    statusCode = 400
  ): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: { 
        code, 
        message, 
        ...(details && { details })
      },
      meta: {
        timestamp: new Date(),
        requestId: this.requestId,
        version: this.version
      }
    }

    this.reply.status(statusCode)
    return response
  }

  paginated<U>(
    data: U[],
    pagination: PaginationMeta,
    meta?: Partial<ResponseMeta>
  ): SuccessResponse<U[]> {
    const response: SuccessResponse<U[]> = {
      success: true,
      data,
      meta: {
        timestamp: new Date(),
        requestId: this.requestId,
        version: this.version,
        pagination,
        ...meta
      }
    }
    return response
  }

  created(data: T): SuccessResponse<T> {
    this.reply.status(201)
    return this.success(data)
  }

  noContent(): void {
    this.reply.status(204).send()
  }

  notFound(message = 'Resource not found'): ErrorResponse {
    return this.error('NOT_FOUND', message, undefined, 404)
  }

  unauthorized(message = 'Unauthorized access'): ErrorResponse {
    return this.error('UNAUTHORIZED', message, undefined, 401)
  }

  forbidden(message = 'Access forbidden'): ErrorResponse {
    return this.error('FORBIDDEN', message, undefined, 403)
  }

  validation(details: Record<string, unknown>): ErrorResponse {
    return this.error(
      'VALIDATION_ERROR',
      'Invalid input data',
      details,
      422
    )
  }

  conflict(message = 'Resource conflict'): ErrorResponse {
    return this.error('CONFLICT', message, undefined, 409)
  }

  internal(message = 'Internal server error'): ErrorResponse {
    return this.error('INTERNAL_ERROR', message, undefined, 500)
  }
}
