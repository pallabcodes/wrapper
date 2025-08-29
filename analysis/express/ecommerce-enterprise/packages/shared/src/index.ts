/**
 * SHARED PACKAGE
 * Shared components and utilities
 */

// Re-export core utilities (excluding types to avoid conflicts)
export { 
  AppError, 
  ErrorCode, 
  ErrorSeverity,
  env,
  logger,
  getPrismaClient,
  redisClient,
  redisGet,
  redisSet,
  queueManager,
  authenticateToken,
  requireRole,
  authController,
  authService,
  authRoutes,
  validateBody,
  validateQuery,
  validateParams,
  validateSchema,
  rateLimiter,
  SwaggerManager,
  createOpenAPISpec,
  addPath,
  addSchema,
  zodToOpenAPI,
  createSwaggerMiddleware,
  createRouteDefinitions,
  createSwaggerManager,
  registerSwaggerRoutes,
  Result,
  pipe,
  withErrorHandling,
  memoize,
  createEventEmitter,
  createContainer
} from '@ecommerce-enterprise/core'

// Shared middleware
export { validateBody as sharedValidateBody, validateQuery as sharedValidateQuery, validateParams as sharedValidateParams } from './middleware/validation'

// Shared schemas
export { userSchema, productSchema, orderSchema } from './schemas'

// Shared types
export * from './types'
