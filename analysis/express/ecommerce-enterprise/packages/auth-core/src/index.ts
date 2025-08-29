/**
 * Auth Core Package - Main Exports
 * 
 * This is the main entry point for the auth system.
 * Provides a unified interface for all auth operations.
 */

// ============================================================================
// SIMPLE AUTH IMPLEMENTATION
// ============================================================================

export {
  auth,
  generateAuthToken,
  validateAuthToken,
  hasPermission,
  hasRole,
  extractUser,
  isAuthenticated,
  isAuthorized,
  type User,
  type Permission,
  type Role,
  type AuthResult,
  type AuthConfig
} from './simpleAuth'

// ============================================================================
// MIDDLEWARE
// ============================================================================

export {
  authenticate,
  requireAuth,
  requireAuthz,
  optionalAuth,
  requireRole,
  requirePermission,
  debugAuth
} from './simpleMiddleware'

export { userRateLimit } from './middlewareUtils'

// ============================================================================
// FUTURE EXPANSIONS
// ============================================================================

// These will be added as the auth system evolves
// export { rbacAuthStrategy } from './strategies/rbac'
// export { pbacAuthStrategy } from './strategies/pbac'
// export { externalAuthStrategy } from './strategies/external'
