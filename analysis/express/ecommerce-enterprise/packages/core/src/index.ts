/**
 * CORE PACKAGE
 * Enterprise-grade utilities and patterns
 */

// ============================================================================
// ERROR HANDLING
// ============================================================================

export { AppError, ErrorCode, ErrorSeverity } from './errors/AppError'

// ============================================================================
// CONFIGURATION
// ============================================================================

export { env } from './config/env'

// ============================================================================
// LOGGING
// ============================================================================

export { logger } from './utils/logger'

// ============================================================================
// DATABASE
// ============================================================================

export { getPrismaClient } from './database/client'

// ============================================================================
// CACHE
// ============================================================================

export { redisClient, redisGet, redisSet } from './cache/redisClient'

// ============================================================================
// QUEUE
// ============================================================================

export { queueManager } from './queue/queueManager'

// ============================================================================
// AUTHENTICATION
// ============================================================================

export { authenticateToken, requireRole } from './middleware/auth'
export { authController } from './modules/auth/authController'
export { authService } from './modules/auth/authService'
export { authRoutes } from './modules/auth/authRoutes'

// Auth types and utilities
export * from './modules/auth/authUtils'
export * from './modules/auth/authResponseHandler'
export * from './modules/auth/authSchemas'



// ============================================================================
// VALIDATION
// ============================================================================

export { validateBody, validateQuery, validateParams, validateSchema } from './middleware/validation'

// ============================================================================
// RATE LIMITING
// ============================================================================

export { rateLimiter } from './middleware/rateLimiter'

// ============================================================================
// SWAGGER
// ============================================================================

export { SwaggerManager, createOpenAPISpec, addPath, addSchema, zodToOpenAPI } from './swagger/SwaggerBuilder'
export { createSwaggerMiddleware, createRouteDefinitions } from './swagger/SwaggerMiddleware'


// Swagger types and utilities
export type * from './swagger/types'
export * from './swagger/utils'

// ============================================================================
// UTILITIES
// ============================================================================

export { Result, pipe, withErrorHandling, memoize } from './utils/functional'
export { createEventEmitter } from './utils/events'
export { createContainer } from './utils/container'

// ============================================================================
// RESPONSE MAPPING
// ============================================================================

export {
  baseResponseSchema,
  type BaseResponse,
  type ResponseMeta,
  createResponse,
  successResponse,
  createdResponse,
  updatedResponse,
  deletedResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  paginatedResponse,
  responseWrapper
} from './utils/responseMapper'

export {
  withPagination,
  withFilters,
  withSorting,
  withCache,
  transformResponse
} from './utils/responseTransformers'
