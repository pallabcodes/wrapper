/**
 * Base Controller
 * 
 * Base controller class that provides common functionality for all controllers
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { ResponseBuilder } from './builder.js'

export class BaseController {
  protected response: ResponseBuilder

  constructor(reply: FastifyReply) {
    this.response = new ResponseBuilder(reply)
  }

  /**
   * Extract request ID from request
   */
  protected extractRequestId(request: FastifyRequest): string {
    return request.id || 'unknown'
  }

  /**
   * Handle errors consistently
   */
  protected handleError(error: Error, requestId: string): {
    success: false;
    error: {
      code: string;
      message: string;
      requestId: string;
    };
    meta: {
      timestamp: Date;
      requestId: string;
      version: string;
    };
  } {
    console.error(`Error in request ${requestId}:`, error)
    
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
        requestId
      },
      meta: {
        timestamp: new Date(),
        requestId,
        version: process.env.npm_package_version || '1.0.0'
      }
    }
  }

  /**
   * Send response with proper status code
   */
  protected sendResponse(reply: FastifyReply, response: Record<string, unknown>, statusCode = 200): void {
    reply.status(statusCode).send(response)
  }
}
