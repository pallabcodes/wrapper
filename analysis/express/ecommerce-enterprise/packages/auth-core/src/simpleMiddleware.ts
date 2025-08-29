/**
 * Simple Auth Middleware - Functional Programming Approach
 * 
 * Express middleware that integrates with the simple auth system.
 * Uses focused functional modules for maintainability.
 */

import { Request, Response, NextFunction } from 'express'
import { auth } from './simpleAuth'
import {
  extractTokenFromRequest,
  getAuthResult,
  sendUnauthorizedResponse,
  sendForbiddenResponse,
  validateAuthResult,
  validatePermissions,
  validateRole,
  logAuthError
} from './middlewareUtils'

// ============================================================================
// CORE MIDDLEWARE
// ============================================================================

/**
 * Authentication middleware
 * Extracts token from request and authenticates user
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromRequest(req)
    if (!token) {
      return next()
    }
    
    const authResult = await auth(token, req)
    ;(req as any).auth = authResult
    ;(req as any).user = authResult.user
    
    next()
  } catch (error) {
    logAuthError(error, req)
    next()
  }
}

/**
 * Require authentication middleware
 * Ensures user is authenticated before proceeding
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authResult = getAuthResult(req)
  
  if (!validateAuthResult(authResult)) {
    sendUnauthorizedResponse(res)
    return
  }
  
  next()
}

/**
 * Optional authentication middleware
 * Authenticates if token is present, but doesn't require it
 */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const token = extractTokenFromRequest(req)
  if (!token) {
    return next()
  }
  
  authenticate(req, _res, next)
}

// ============================================================================
// AUTHORIZATION MIDDLEWARE
// ============================================================================

/**
 * Require authorization middleware
 * Ensures user is authorized for the specific resource/action
 */
export const requireAuthz = (
  resource?: string,
  action?: string
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authResult = getAuthResult(req)
    
    if (!validateAuthResult(authResult)) {
      sendUnauthorizedResponse(res)
      return
    }
    
    if (resource && action && !validatePermissions(authResult, resource, action)) {
      sendForbiddenResponse(res)
      return
    }
    
    next()
  }
}

/**
 * Require specific permission middleware
 */
export const requirePermission = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authResult = getAuthResult(req)
    
    if (!validateAuthResult(authResult)) {
      sendUnauthorizedResponse(res)
      return
    }
    
    if (!validatePermissions(authResult, resource, action)) {
      sendForbiddenResponse(res, `Permission required: ${resource}:${action}`)
      return
    }
    
    next()
  }
}

/**
 * Require specific role middleware
 */
export const requireRole = (roleName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authResult = getAuthResult(req)
    
    if (!validateAuthResult(authResult)) {
      sendUnauthorizedResponse(res)
      return
    }
    
    if (!validateRole(authResult, roleName)) {
      sendForbiddenResponse(res, `Role required: ${roleName}`)
      return
    }
    
    next()
  }
}

// ============================================================================
// DEBUGGING MIDDLEWARE
// ============================================================================

/**
 * Debug authentication middleware
 * Logs detailed auth information for debugging
 */
export const debugAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authResult = getAuthResult(req)
  
  if (authResult?.debug) {
    console.log('Auth Debug Info:', {
      path: req.path,
      method: req.method,
      user: authResult.user ? { id: authResult.user.id, email: authResult.user.email } : null,
      debug: authResult.debug
    })
  }
  
  next()
}