/**
 * Response System
 * 
 * Enterprise-grade response handling for consistent API responses
 * Split into focused modules following Silicon Valley standards
 */

// Core types and interfaces
export type {
  BaseResponse,
  SuccessResponse,
  ErrorResponse,
  ResponseMeta,
  PaginationMeta,
  PaginationParams,
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse
} from './types.js'

// Validation schemas
export {
  BaseResponseSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
  PaginationParamsSchema,
  type ValidationResult
} from './schemas.js'

// Response builder
export { ResponseBuilder } from './builder.js'

// Utility functions
export {
  createResponseBuilder,
  calculatePagination,
  validatePaginationParams,
  formatErrorDetails,
  isSuccessResponse,
  isErrorResponse
} from './utils.js'

// Convenience exports for common patterns
export const response = {
  builder: (reply: any) => new ResponseBuilder(reply),
  success: <T>(data: T, reply: any) => new ResponseBuilder(reply).success(data),
  error: (code: string, message: string, reply: any) => 
    new ResponseBuilder(reply).error(code, message),
  notFound: (reply: any) => new ResponseBuilder(reply).notFound(),
  unauthorized: (reply: any) => new ResponseBuilder(reply).unauthorized(),
  validation: (details: Record<string, unknown>, reply: any) =>
    new ResponseBuilder(reply).validation(details)
}
  private _data?: T
  private _error?: { code: string; message: string; details?: Record<string, unknown> }
  private _meta: Record<string, unknown> = {}
  private _statusCode = 200

  static create<T>(): ResponseBuilder<T> {
    return new ResponseBuilder<T>()
  }

  success(data: T): this {
    this._data = data
    this._statusCode = 200
    return this
  }

  created(data: T): this {
    this._data = data
    this._statusCode = 201
    return this
  }

  noContent(): this {
    this._statusCode = 204
    return this
  }

  error(code: string, message: string, details?: Record<string, unknown>): this {
    this._error = { 
      code, 
      message, 
      ...(details && { details })
    }
    this._statusCode = this.getStatusCodeFromErrorCode(code)
    return this
  }

  badRequest(message: string, details?: Record<string, unknown>): this {
    return this.error('BAD_REQUEST', message, details)
  }

  unauthorized(message = 'Unauthorized'): this {
    return this.error('UNAUTHORIZED', message)
  }

  forbidden(message = 'Forbidden'): this {
    return this.error('FORBIDDEN', message)
  }

  notFound(message = 'Resource not found'): this {
    return this.error('NOT_FOUND', message)
  }

  conflict(message: string, details?: Record<string, unknown>): this {
    return this.error('CONFLICT', message, details)
  }

  unprocessableEntity(message: string, details?: Record<string, unknown>): this {
    return this.error('UNPROCESSABLE_ENTITY', message, details)
  }

  tooManyRequests(message = 'Too many requests'): this {
    return this.error('TOO_MANY_REQUESTS', message)
  }

  internalError(message = 'Internal server error', details?: Record<string, unknown>): this {
    return this.error('INTERNAL_ERROR', message, details)
  }

  serviceUnavailable(message = 'Service unavailable'): this {
    return this.error('SERVICE_UNAVAILABLE', message)
  }

  withPagination(pagination: PaginationParams): this {
    this._meta.pagination = pagination
    return this
  }

  withMeta(key: string, value: unknown): this {
    this._meta[key] = value
    return this
  }

  withRequestId(requestId: string): this {
    this._meta.requestId = requestId
    return this
  }

  private getStatusCodeFromErrorCode(code: string): number {
    const statusMap: Record<string, number> = {
      'BAD_REQUEST': 400,
      'UNAUTHORIZED': 401,
      'FORBIDDEN': 403,
      'NOT_FOUND': 404,
      'CONFLICT': 409,
      'UNPROCESSABLE_ENTITY': 422,
      'TOO_MANY_REQUESTS': 429,
      'INTERNAL_ERROR': 500,
      'SERVICE_UNAVAILABLE': 503
    }
    return statusMap[code] || 500
  }

  build(requestId?: string, version = '1.0.0'): ApiResponse<T> {
    const response = {
      success: !this._error,
      ...(this._data !== undefined && { data: this._data }),
      ...(this._error && { error: this._error }),
      meta: {
        ...this._meta,
        timestamp: new Date().toISOString(),
        requestId: requestId || this._meta.requestId as string || 'unknown',
        version
      }
    }

    return response as ApiResponse<T>
  }

  send(reply: FastifyReply, requestId?: string, version = '1.0.0'): FastifyReply {
    const response = this.build(requestId, version)
    return reply.status(this._statusCode).send(response)
  }
}

// ============================================================================
// RESPONSE UTILITIES
// ============================================================================

export const createSuccessResponse = <T>(
  data: T, 
  meta?: Record<string, unknown>
): ApiSuccessResponse<T> => {
  return ResponseBuilder.create<T>()
    .success(data)
    .withMeta('timestamp', new Date())
    .build() as ApiSuccessResponse<T>
}

export const createErrorResponse = (
  code: string, 
  message: string, 
  details?: Record<string, unknown>
): ApiErrorResponse => {
  return ResponseBuilder.create()
    .error(code, message, details)
    .build() as ApiErrorResponse
}

export const createPaginatedResponse = <T>(
  data: T[], 
  pagination: PaginationParams
): ApiSuccessResponse<T[]> => {
  return ResponseBuilder.create<T[]>()
    .success(data)
    .withPagination(pagination)
    .build() as ApiSuccessResponse<T[]>
}

// ============================================================================
// FASTIFY PLUGIN FOR RESPONSE UTILITIES
// ============================================================================

export const responseUtilities = {
  success: <T>(data: T) => ResponseBuilder.create<T>().success(data),
  created: <T>(data: T) => ResponseBuilder.create<T>().created(data),
  noContent: () => ResponseBuilder.create().noContent(),
  badRequest: (message: string, details?: Record<string, unknown>) => 
    ResponseBuilder.create().badRequest(message, details),
  unauthorized: (message?: string) => ResponseBuilder.create().unauthorized(message),
  forbidden: (message?: string) => ResponseBuilder.create().forbidden(message),
  notFound: (message?: string) => ResponseBuilder.create().notFound(message),
  conflict: (message: string, details?: Record<string, unknown>) => 
    ResponseBuilder.create().conflict(message, details),
  unprocessableEntity: (message: string, details?: Record<string, unknown>) => 
    ResponseBuilder.create().unprocessableEntity(message, details),
  tooManyRequests: (message?: string) => ResponseBuilder.create().tooManyRequests(message),
  internalError: (message?: string, details?: Record<string, unknown>) => 
    ResponseBuilder.create().internalError(message, details),
  serviceUnavailable: (message?: string) => ResponseBuilder.create().serviceUnavailable(message)
}

// ============================================================================
// CONTROLLER BASE CLASS
// ============================================================================

export abstract class BaseController {
  protected readonly response = responseUtilities

  protected extractRequestId(request: { headers: Record<string, unknown> }): string {
    return (request.headers['x-request-id'] as string) || 
           (request.headers['x-correlation-id'] as string) || 
           this.generateRequestId()
  }

  protected generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  protected handleError(error: Error, requestId: string): ApiErrorResponse {
    // Log error for monitoring
    console.error(`[${requestId}] Controller Error:`, error)

    // Return appropriate error response
    if (error.name === 'ValidationError') {
      return this.response.badRequest(error.message, { validation: true }).build(requestId) as ApiErrorResponse
    }

    if (error.name === 'UnauthorizedError') {
      return this.response.unauthorized(error.message).build(requestId) as ApiErrorResponse
    }

    if (error.name === 'NotFoundError') {
      return this.response.notFound(error.message).build(requestId) as ApiErrorResponse
    }

    // Default to internal error
    return this.response.internalError('An unexpected error occurred').build(requestId) as ApiErrorResponse
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse
}
