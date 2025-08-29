/**
 * Auth Routes - Simple, Clean, Debuggable
 * 
 * Single function approach for maximum readability and 5-minute debuggability.
 * No over-engineering, no technical debt.
 */

import { createRoute, type MiddlewareHelpers } from './schemaRegistry'
import { RequestHandler } from 'express'
import { middlewarePatterns } from './middlewareHelpers'
import {
  registerSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
  updateProfileSchema,
  baseResponseSchema
} from '@ecommerce-enterprise/core'

// ============================================================================
// SIMPLE ROUTE CREATOR - One function, clear purpose
// ============================================================================

const createAuthRoute = (
  path: string,
  method: 'get' | 'post' | 'put' | 'delete',
  summary: string,
  description: string,
  options: {
    requestSchema?: any
    responseSchema?: any
    requiresAuth?: boolean
    statusCodes?: number[]
    tags?: string[]
    middleware?: RequestHandler[] // Direct middleware array (Approach 1)
    middlewareHelpers?: MiddlewareHelpers // Optional helpers (Approach 4)
  } = {}
) => {
  const {
    requestSchema,
    responseSchema = baseResponseSchema,
    requiresAuth = false,
    statusCodes = [200],
    tags = ['Authentication'],
    middleware,
    middlewareHelpers
  } = options

  return createRoute(
    `/api/v1/auth${path}`,
    method,
    summary,
    description,
    tags,
    responseSchema,
    requestSchema,
    requiresAuth,
    statusCodes,
    undefined, // fileUpload
    middleware,
    middlewareHelpers
  )
}

// ============================================================================
// ROUTE DEFINITIONS - Simple, readable, debuggable
// ============================================================================

export const authRoutes = [
  // Basic authentication routes
  createAuthRoute('/register', 'post', 'Register user', 'Create new account', {
    requestSchema: registerSchema,
    statusCodes: [201, 400, 409]
  }),

  createAuthRoute('/login', 'post', 'Login user', 'Authenticate user', {
    requestSchema: loginSchema,
    statusCodes: [200, 401]
  }),

  createAuthRoute('/logout', 'post', 'Logout user', 'Invalidate refresh token', {
    requestSchema: logoutSchema
  }),

  createAuthRoute('/refresh-token', 'post', 'Refresh token', 'Get new access token', {
    requestSchema: refreshTokenSchema
  }),

  createAuthRoute('/verify-email', 'post', 'Verify email', 'Verify user email', {
    requestSchema: verifyEmailSchema
  }),

  createAuthRoute('/forgot-password', 'post', 'Forgot password', 'Send reset email', {
    requestSchema: forgotPasswordSchema
  }),

  createAuthRoute('/reset-password', 'post', 'Reset password', 'Reset with token', {
    requestSchema: resetPasswordSchema
  }),

  // Protected routes
  createAuthRoute('/me', 'get', 'Get user', 'Retrieve user info', {
    requiresAuth: true,
    statusCodes: [200, 401]
  }),

  createAuthRoute('/change-password', 'post', 'Change password', 'Update password', {
    requestSchema: changePasswordSchema,
    requiresAuth: true,
    statusCodes: [200, 401]
  }),

  createAuthRoute('/profile', 'put', 'Update profile', 'Update user profile', {
    requestSchema: updateProfileSchema,
    requiresAuth: true,
    statusCodes: [200, 401]
  }),

  createAuthRoute('/delete-account', 'delete', 'Delete account', 'Permanently delete account', {
    requiresAuth: true,
    statusCodes: [200, 401]
  }),

  // Admin routes - Approach 1: Direct middleware array
  createAuthRoute('/admin/users', 'get', 'Get all users', 'Admin: retrieve all users', {
    requiresAuth: true,
    statusCodes: [200, 403],
    tags: ['Authentication', 'Admin'],
    middleware: [
      // Direct Express.js middleware functions
      (req, _res, next) => {
        const userRole = req.headers['x-user-role'] as string
        if (!userRole || !['admin', 'super_admin'].includes(userRole)) {
          return _res.status(403).json({ error: 'Admin access required' })
        }
        return next()
      },
      (req, _res, next) => {
        console.log(`[AUDIT] Admin access: ${req.path} by ${req.headers['x-user-id']}`)
        return next()
      }
    ]
  }),

  // Rate-limited routes - Approach 4: Using middleware helpers
  createAuthRoute('/bulk-operations', 'post', 'Bulk operations', 'Rate-limited bulk operations', {
    requiresAuth: true,
    statusCodes: [200, 400, 429],
    tags: ['Authentication', 'Bulk Operations'],
    middlewareHelpers: {
      rateLimit: { windowMs: 15 * 60 * 1000, max: 10 },
      auditLog: { action: 'bulk_operations', level: 'warn' }
    }
  }),

  // Example: Using pre-configured patterns (Approach 4)
  createAuthRoute('/sensitive-data', 'get', 'Get sensitive data', 'Access sensitive user data', {
    requiresAuth: true,
    statusCodes: [200, 403, 429],
    tags: ['Authentication', 'Sensitive'],
    middlewareHelpers: middlewarePatterns.sensitiveOperation
  }),

  // Example: Mixed approach - Direct middleware + helpers
  createAuthRoute('/custom-endpoint', 'post', 'Custom endpoint', 'Custom middleware example', {
    requiresAuth: true,
    statusCodes: [200, 400, 403],
    tags: ['Authentication', 'Custom'],
    middleware: [
      // Custom middleware function
      (req, _res, next) => {
        req.body.customField = 'processed'
        return next()
      }
    ],
    middlewareHelpers: {
      rateLimit: { windowMs: 15 * 60 * 1000, max: 50 },
      auditLog: { action: 'custom_endpoint', level: 'info' }
    }
  })
]
