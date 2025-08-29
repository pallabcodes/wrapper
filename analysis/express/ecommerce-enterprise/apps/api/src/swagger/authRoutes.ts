/**
 * Auth Routes - Functional Definitions
 * 
 * This file defines authentication routes using our existing Zod schemas
 * and functional programming patterns.
 */

import { z } from 'zod'
import { createRoute } from './schemaRegistry'

// Import schemas from core package
import {
  registerRequestSchema,
  loginRequestSchema,
  logoutRequestSchema,
  refreshTokenRequestSchema,
  authResponseSchema,
  successResponseSchema
} from '@ecommerce-enterprise/core'

// Response schemas
const userResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    user: z.object({
      id: z.string(),
      email: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      isEmailVerified: z.boolean()
    })
  })
})

// Functional route definitions
export const authRoutes = [
  createRoute(
    '/api/v1/auth/register',
    'post',
    'Register a new user',
    'Create a new user account with email and password',
    ['Authentication'],
    authResponseSchema,
    registerRequestSchema,
    false,
    [201, 400, 409]
  ),

  createRoute(
    '/api/v1/auth/login',
    'post',
    'Login user',
    'Authenticate user with email and password',
    ['Authentication'],
    authResponseSchema,
    loginRequestSchema,
    false,
    [200, 401]
  ),

  createRoute(
    '/api/v1/auth/logout',
    'post',
    'Logout user',
    'Invalidate refresh token and logout user',
    ['Authentication'],
    successResponseSchema,
    logoutRequestSchema,
    false,
    [200]
  ),

  createRoute(
    '/api/v1/auth/refresh-token',
    'post',
    'Refresh access token',
    'Get new access token using refresh token',
    ['Authentication'],
    z.object({
      success: z.boolean(),
      data: z.object({
        tokens: z.object({
          accessToken: z.string(),
          refreshToken: z.string()
        })
      }),
      message: z.string()
    }),
    refreshTokenRequestSchema,
    false,
    [200]
  ),

  createRoute(
    '/api/v1/auth/me',
    'get',
    'Get current user',
    'Retrieve current user information',
    ['Authentication'],
    userResponseSchema,
    undefined,
    true,
    [200, 401]
  ),

  createRoute(
    '/api/v1/auth/verify-email',
    'post',
    'Verify email address',
    'Verify user email with token',
    ['Authentication'],
    successResponseSchema,
    z.object({ token: z.string() }),
    false,
    [200]
  ),

  createRoute(
    '/api/v1/auth/forgot-password',
    'post',
    'Request password reset',
    'Send password reset email',
    ['Authentication'],
    successResponseSchema,
    z.object({ email: z.string().email() }),
    false,
    [200]
  ),

  createRoute(
    '/api/v1/auth/reset-password',
    'post',
    'Reset password',
    'Reset password with token',
    ['Authentication'],
    successResponseSchema,
    z.object({
      token: z.string(),
      password: z.string().min(8)
    }),
    false,
    [200]
  ),

  createRoute(
    '/api/v1/auth/change-password',
    'post',
    'Change password',
    'Change user password (requires authentication)',
    ['Authentication'],
    successResponseSchema,
    z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8)
    }),
    true,
    [200, 401]
  ),

  createRoute(
    '/api/v1/auth/profile',
    'put',
    'Update profile',
    'Update user profile information (requires authentication)',
    ['Authentication'],
    userResponseSchema,
    z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      phone: z.string().optional()
    }),
    true,
    [200, 401]
  ),

  createRoute(
    '/api/v1/auth/delete-account',
    'delete',
    'Delete account',
    'Permanently delete user account (requires authentication)',
    ['Authentication'],
    successResponseSchema,
    undefined,
    true,
    [200, 401]
  )
]
