/**
 * Simple Auth Implementation - Functional Programming Approach
 * 
 * Core auth functionality using focused functional modules.
 * Kept under 200 lines for maintainability.
 */

import { logger } from '@ecommerce-enterprise/core'
import type { AuthResult } from './authTypes'
import {
  getAuthConfig,
  validateAuthToken,
  extractUser,
  isAuthenticated,
  isAuthorized,
  createFailedResult
} from './authUtils'

// ============================================================================
// MAIN AUTH FUNCTION
// ============================================================================

/**
 * Main auth function - this is what controllers will call
 * Zero breaking changes - this interface never changes
 */
export const auth = async (token: string, _context?: unknown): Promise<AuthResult> => {
  const startTime = Date.now()
  const debugSteps: string[] = []
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Step 1: Validate input
    debugSteps.push('Validating input')
    if (!token) {
      return createFailedResult('Token is required', startTime)
    }

    // Step 2: Get configuration
    debugSteps.push('Loading configuration')
    const config = getAuthConfig()

    // Step 3: Verify JWT token
    debugSteps.push('Verifying JWT token')
    const decoded = validateAuthToken(token)
    if (!decoded) {
      return createFailedResult('Invalid token', startTime)
    }

    // Step 4: Extract user
    debugSteps.push('Extracting user data')
    const user = extractUser(decoded)

    // Step 5: Check authentication
    debugSteps.push('Checking authentication')
    const authenticated = isAuthenticated(user)

    // Step 6: Check authorization
    debugSteps.push('Checking authorization')
    const authorized = isAuthorized(user)

    // Step 7: Log debug info
    if (config.debug) {
      logger.info('Auth debug info', {
        strategy: config.strategy,
        steps: debugSteps,
        duration: Date.now() - startTime,
        errors,
        warnings,
        user: authenticated ? { id: user.id, email: user.email } : null
      })
    }

    // Step 8: Return result
    const result: AuthResult = {
      user: authenticated ? user : null,
      isAuthenticated: authenticated,
      isAuthorized: authorized,
      permissions: user.permissions,
      metadata: {
        strategy: config.strategy,
        tokenType: decoded.type,
        issuedAt: new Date(decoded.iat * 1000),
        expiresAt: new Date(decoded.exp * 1000)
      },
      strategy: config.strategy
    }

    if (config.debug) {
      result.debug = {
        strategy: config.strategy,
        steps: debugSteps,
        duration: Date.now() - startTime,
        errors,
        warnings
      }
    }

    return result

  } catch (error) {
    logger.error('Auth error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return createFailedResult('Authentication failed', startTime)
  }
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export {
  generateAuthToken,
  validateAuthToken,
  hasPermission,
  hasRole,
  extractUser,
  isAuthenticated,
  isAuthorized
} from './authUtils'

export type {
  User,
  Permission,
  Role,
  AuthResult,
  AuthConfig
} from './authTypes'
