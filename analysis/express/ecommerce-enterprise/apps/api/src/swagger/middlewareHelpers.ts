/**
 * Middleware Helpers - Production Grade
 * 
 * Pre-configured middleware patterns for common use cases.
 * Optional helpers that can be used alongside direct middleware arrays.
 * 
 * Approach 4: Hybrid - Direct middleware + optional helpers
 */

import { RequestHandler, Request, Response, NextFunction } from 'express'
import { MiddlewareHelpers } from './schemaRegistry'

// ============================================================================
// MIDDLEWARE HELPER FACTORIES (Approach 4 - Optional)
// ============================================================================

// Rate limiting middleware factory
export const createRateLimitMiddleware = (config: NonNullable<MiddlewareHelpers['rateLimit']>): RequestHandler => {
  const { windowMs = 15 * 60 * 1000, max = 100 } = config
  
  return (req: Request, _res: Response, next: NextFunction) => {
    const clientId = req.headers['x-client-id'] || req.ip
    // Simple in-memory rate limiting (in production, use Redis)
    const key = `rate_limit:${clientId}`
    
    // This is a simplified implementation
    // In production, use proper rate limiting libraries like express-rate-limit
    // For now, just pass through (would implement actual rate limiting here)
    console.log(`[RATE_LIMIT] ${clientId}: ${key} (${windowMs}ms, max: ${max})`)
    return next()
  }
}

// Admin check middleware factory
export const createAdminCheckMiddleware = (config: NonNullable<MiddlewareHelpers['adminCheck']>): RequestHandler => {
  const { roles = ['admin'] } = config
  
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.headers['x-user-role'] as string
    
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Admin access required',
        requiredRoles: roles,
        userRole 
      })
    }
    
    return next()
  }
}

// Audit logging middleware factory
export const createAuditLogMiddleware = (config: NonNullable<MiddlewareHelpers['auditLog']>): RequestHandler => {
  const { action = 'unknown', level = 'info' } = config
  
  return (req: Request, _res: Response, next: NextFunction) => {
    const auditData = {
      action,
      level,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      userId: req.headers['x-user-id'],
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
    
    // In production, send to proper logging service
    console.log(`[AUDIT ${level.toUpperCase()}]`, auditData)
    
    return next()
  }
}

// CORS middleware factory
export const createCorsMiddleware = (config: NonNullable<MiddlewareHelpers['cors']>): RequestHandler => {
  const { origin = '*', credentials = false } = config
  
  return (req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', origin as string)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    if (credentials) {
      res.header('Access-Control-Allow-Credentials', 'true')
    }
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }
    
    return next()
  }
}

// ============================================================================
// MIDDLEWARE HELPER COMPOSER (Approach 4 - Optional)
// ============================================================================

// Composes middleware from helper configurations
export const composeMiddlewareFromHelpers = (helpers: MiddlewareHelpers): RequestHandler[] => {
  const middleware: RequestHandler[] = []
  
  if (helpers.rateLimit) {
    middleware.push(createRateLimitMiddleware(helpers.rateLimit))
  }
  
  if (helpers.adminCheck) {
    middleware.push(createAdminCheckMiddleware(helpers.adminCheck))
  }
  
  if (helpers.auditLog) {
    middleware.push(createAuditLogMiddleware(helpers.auditLog))
  }
  
  if (helpers.cors) {
    middleware.push(createCorsMiddleware(helpers.cors))
  }
  
  return middleware
}

// ============================================================================
// COMMON MIDDLEWARE PATTERNS (Ready-to-use)
// ============================================================================

// Pre-configured middleware patterns for common use cases
export const middlewarePatterns = {
  // Admin routes with rate limiting and audit
  adminWithRateLimit: {
    rateLimit: { windowMs: 15 * 60 * 1000, max: 50 },
    adminCheck: { roles: ['admin', 'super_admin'] },
    auditLog: { action: 'admin_access', level: 'info' }
  },
  
  // Public routes with rate limiting
  publicWithRateLimit: {
    rateLimit: { windowMs: 15 * 60 * 1000, max: 100 }
  },
  
  // Sensitive operations with strict audit
  sensitiveOperation: {
    rateLimit: { windowMs: 15 * 60 * 1000, max: 10 },
    auditLog: { action: 'sensitive_operation', level: 'warn' }
  },
  
  // API endpoints with CORS
  apiWithCors: {
    cors: { origin: ['https://app.example.com'], credentials: true },
    rateLimit: { windowMs: 15 * 60 * 1000, max: 200 }
  }
} as const
