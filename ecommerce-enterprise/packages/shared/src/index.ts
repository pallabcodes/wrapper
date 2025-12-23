/**
 * SHARED PACKAGE
 * Shared components and utilities
 */

// Re-export core utilities (excluding types to avoid conflicts)
export { 
  AppError, 
  ErrorCode, 
  ErrorSeverity,
  logger,
  db,
  pool,
  getDatabaseClient,
  withTransaction,
  runMigrations,
  getMongoClient,
  checkMongoHealth,
  mongoose,
  initializeDatabase,
  cleanupDatabase,
  redisClient,
  redisGet,
  redisSet,
  queueManager,
  authenticateToken,
  requireRole,
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
  Result,
  pipe,
  withErrorHandling,
  memoize,
  createEventEmitter,
  createContainer,
  createSuccessResponse,
  createErrorResponse
} from '@ecommerce-enterprise/core'

// Shared middleware
export { validateBody as sharedValidateBody, validateQuery as sharedValidateQuery, validateParams as sharedValidateParams } from './middleware/validation'

// Shared schemas
export { userSchema, productSchema, orderSchema } from './schemas'

// Shared types
export * from './types'

// Validation components
export * from './modules/shared-validation.module';
export * from './validation/shared-validation.service';
export * from './controllers/shared-validation.controller';
