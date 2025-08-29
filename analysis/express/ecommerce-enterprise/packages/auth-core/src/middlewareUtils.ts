/**
 * Middleware Utilities - Functional Programming Approach
 * 
 * Utility functions for auth middleware.
 * Kept separate to maintain file size limits.
 */

import { Request, Response, NextFunction } from 'express'
import { logger } from '@ecommerce-enterprise/core'
import type { AuthResult, User } from './authTypes'
import { isAuthenticated, hasPermission, hasRole } from './authUtils'

// ============================================================================
// TOKEN EXTRACTION
// ============================================================================

export const extractTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  
  return authHeader.replace('Bearer ', '')
}

// ============================================================================
// AUTH RESULT HELPERS
// ============================================================================

export const getAuthResult = (req: Request): AuthResult | null => {
  return (req as any).auth || null
}

export const getUser = (req: Request): User | null => {
  return (req as any).user || null
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export const sendUnauthorizedResponse = (res: Response, message = 'Authentication required'): void => {
  res.status(401).json({
    success: false,
    message,
    error: 'UNAUTHORIZED'
  })
}

export const sendForbiddenResponse = (res: Response, message = 'Insufficient permissions'): void => {
  res.status(403).json({
    success: false,
    message,
    error: 'FORBIDDEN'
  })
}

export const sendRateLimitResponse = (res: Response, message = 'Rate limit exceeded'): void => {
  res.status(429).json({
    success: false,
    message,
    error: 'RATE_LIMIT_EXCEEDED'
  })
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validateAuthResult = (authResult: AuthResult | null): boolean => {
  return authResult !== null && isAuthenticated(authResult.user)
}

export const validatePermissions = (authResult: AuthResult | null, resource: string, action: string): boolean => {
  if (!validateAuthResult(authResult)) return false
  return hasPermission(authResult!.user!.permissions, resource, action)
}

export const validateRole = (authResult: AuthResult | null, roleName: string): boolean => {
  if (!validateAuthResult(authResult)) return false
  return hasRole(authResult!.user!.roles, roleName)
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

export const logAuthError = (error: unknown, req: Request, context = 'Auth middleware'): void => {
  logger.error(`${context} error`, {
    error: error instanceof Error ? error.message : 'Unknown error',
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })
}

export const logAuthSuccess = (req: Request, user: User | null, context = 'Auth middleware'): void => {
  logger.info(`${context} success`, {
    path: req.path,
    method: req.method,
    userId: user?.id,
    email: user?.email
  })
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export const userRateLimit = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) => {
  const requests = new Map<string, { count: number; resetTime: number }>()
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = getUser(req)
    const key = user?.id || req.ip || 'unknown'
    
    const now = Date.now()
    const userRequests = requests.get(key)
    
    if (!userRequests || now > userRequests.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs })
      return next()
    }
    
    if (userRequests.count >= maxRequests) {
      sendRateLimitResponse(res)
      return
    }
    
    userRequests.count++
    next()
  }
}
