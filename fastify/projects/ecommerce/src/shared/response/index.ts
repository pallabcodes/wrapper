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

// Import for internal use
import { createResponseBuilder } from './utils.js'

// Convenience exports for common patterns
export const response = {
    builder: (reply: import('fastify').FastifyReply) => createResponseBuilder(reply),
  success: <T>(data: T, reply: import('fastify').FastifyReply) => createResponseBuilder(reply).success(data),
  error: (code: string, message: string, reply: import('fastify').FastifyReply) =>
    createResponseBuilder(reply).error(code, message),
  notFound: (reply: import('fastify').FastifyReply) => createResponseBuilder(reply).notFound(),
  unauthorized: (reply: import('fastify').FastifyReply) => createResponseBuilder(reply).unauthorized(),
  validation: (details: Record<string, unknown>, reply: import('fastify').FastifyReply) =>
    createResponseBuilder(reply).validation(details)
}

// Base controller
export { BaseController } from './base-controller.js'

// Re-export for backward compatibility
export { ResponseBuilder as LegacyResponseBuilder } from './builder.js'
