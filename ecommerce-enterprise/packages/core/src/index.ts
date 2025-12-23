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

export { db, pool, getDatabaseClient, withTransaction, runMigrations } from './database/client'
export { getMongoClient, checkMongoHealth, mongoose } from './database/mongodb/client'
export { initializeDatabase, cleanupDatabase } from './database'

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
export * from './modules/auth/authController'
export { authService } from './modules/auth/authService'
export { authRoutes } from './modules/auth/authRoutes'

// Auth types and utilities
export * from './modules/auth/authUtils'
export * from './modules/auth/authResponseHandler'
export * from './modules/auth/authTypes'
export * from './modules/auth/authSchemas'

// ============================================================================
// PRODUCTS
// ============================================================================

export { productService } from './modules/product/productService'
export * from './modules/product/productController'
export { productRoutes } from './modules/product/productRoutes'

// Product types and utilities
export * from './modules/product/productTypes'
export * from './modules/product/productUtils'
export * from './modules/product/productSchemas'
export * from './modules/product/productResponseHandler'



// ============================================================================
// VALIDATION
// ============================================================================

export { validateBody, validateQuery, validateParams, validateSchema } from './middleware/validation'

// Enterprise Zod validation
export { 
  EnterpriseValidationService,
  UserSchema,
  ProductSchema,
  OrderSchema,
  PaymentSchema,
  InventorySchema
} from './validation/enterprise-validation.service'

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
// RESPONSE WRAPPER
// ============================================================================

export {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createValidationErrorResponse,
  createUnauthorizedResponse,
  createForbiddenResponse,
  createConflictResponse,
  createInternalErrorResponse,
  type ApiResponse,
  type ErrorResponse
} from './utils/responseWrapper'

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
