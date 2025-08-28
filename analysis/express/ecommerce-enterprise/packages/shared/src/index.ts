/**
 * SHARED PACKAGE
 * Shared components and utilities
 */

// Re-export core utilities
export * from '@ecommerce-enterprise/core'

// Shared middleware
export { validateBody, validateQuery, validateParams } from './middleware/validation'

// Shared schemas
export { userSchema, productSchema, orderSchema } from './schemas'

// Shared types
export * from './types'
