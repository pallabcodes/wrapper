/**
 * Chainable Response Builder
 * 
 * Response builder that supports method chaining
 */

import type { FastifyReply } from 'fastify'
import type { 
  SuccessResponse, 
  ErrorResponse, 
  ResponseMeta, 
  PaginationMeta 
} from './types.js'

export class ChainableResponseBuilder<T = unknown> {
  private readonly reply: FastifyReply
  private readonly requestId: string
  private readonly version: string
  private currentResponse: SuccessResponse<T> | ErrorResponse | null = null

  constructor(reply: FastifyReply) {
    this.reply = reply
    this.requestId = reply.request.id || 'unknown'
    this.version = process.env.npm_package_version || '1.0.0'
  }

  success(data: T, meta?: Partial<ResponseMeta>): this {
    this.currentResponse = {
      success: true,
      data,
      meta: {
        timestamp: new Date(),
        requestId: this.requestId,
        version: this.version,
        ...meta
      }
    } as SuccessResponse<T>
    return this
  }

  created(data: T): this {
    this.reply.status(201)
    return this.success(data)
  }

  error(
    code: string, 
    message: string, 
    details?: Record<string, unknown>,
    statusCode = 400
  ): this {
    this.currentResponse = {
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
    } as ErrorResponse

    this.reply.status(statusCode)
    return this
  }

  badRequest(message: string, details?: Record<string, unknown>): this {
    return this.error('BAD_REQUEST', message, details, 400)
  }

  notFound(message = 'Resource not found'): this {
    return this.error('NOT_FOUND', message, undefined, 404)
  }

  unauthorized(message = 'Unauthorized access'): this {
    return this.error('UNAUTHORIZED', message, undefined, 401)
  }

  forbidden(message = 'Access forbidden'): this {
    return this.error('FORBIDDEN', message, undefined, 403)
  }

  validation(details: Record<string, unknown>): this {
    return this.error(
      'VALIDATION_ERROR',
      'Invalid input data',
      details,
      422
    )
  }

  conflict(message = 'Resource conflict'): this {
    return this.error('CONFLICT', message, undefined, 409)
  }

  internal(message = 'Internal server error'): this {
    return this.error('INTERNAL_ERROR', message, undefined, 500)
  }

  withMeta(key: string, value: unknown): this {
    if (this.currentResponse && this.currentResponse.success) {
      const successResponse = this.currentResponse as SuccessResponse<T>
      // Create a new meta object to avoid read-only property issues
      const newMeta = {
        ...successResponse.meta,
        [key]: value
      }
      this.currentResponse = {
        ...successResponse,
        meta: newMeta
      } as SuccessResponse<T>
    }
    return this
  }

  send(reply: FastifyReply, requestId?: string): void {
    if (this.currentResponse) {
      reply.send(this.currentResponse)
    } else {
      reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'No response built',
          requestId: requestId || this.requestId
        }
      })
    }
  }

  build(): SuccessResponse<T> | ErrorResponse {
    if (!this.currentResponse) {
      throw new Error('No response has been built')
    }
    return this.currentResponse
  }
}
