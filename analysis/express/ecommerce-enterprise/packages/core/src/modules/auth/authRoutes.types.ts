/**
 * Auth Route Definitions - Functional Programming Approach
 * 
 * This file contains functional route definitions using the SwaggerBuilder
 * for type-safe OpenAPI generation without verbose comments.
 */

import { RouteDefinition } from '../../swagger/SwaggerBuilder'
import { authSchemas } from './authSchemas'
import { z } from 'zod'

// Functional route definitions using composition
export const authRouteDefinitions: RouteDefinition[] = [
  {
    path: '/api/v1/auth/register',
    method: 'post',
    summary: 'Register a new user',
    description: 'Create a new user account with email and password',
    tags: ['Authentication'],
    requestBody: {
      required: true,
      schema: authSchemas.RegisterRequest
    },
    responses: {
      '201': {
        description: 'User registered successfully',
        schema: authSchemas.AuthResponse
      },
      '400': {
        description: 'Validation error',
        schema: authSchemas.ErrorResponse
      },
      '409': {
        description: 'User already exists',
        schema: authSchemas.ErrorResponse
      }
    }
  },
  {
    path: '/api/v1/auth/login',
    method: 'post',
    summary: 'Login user',
    description: 'Authenticate user and return access and refresh tokens',
    tags: ['Authentication'],
    requestBody: {
      required: true,
      schema: authSchemas.LoginRequest
    },
    responses: {
      '200': {
        description: 'Login successful',
        schema: authSchemas.AuthResponse
      },
      '401': {
        description: 'Invalid credentials',
        schema: authSchemas.ErrorResponse
      }
    }
  },
  {
    path: '/api/v1/auth/logout',
    method: 'post',
    summary: 'Logout user',
    description: 'Invalidate refresh token and logout user',
    tags: ['Authentication'],
    requestBody: {
      required: true,
      schema: authSchemas.LogoutRequest
    },
    responses: {
      '200': {
        description: 'Logout successful',
        schema: authSchemas.SuccessResponse
      },
      '400': {
        description: 'Invalid refresh token',
        schema: authSchemas.ErrorResponse
      }
    }
  },
  {
    path: '/api/v1/auth/refresh-token',
    method: 'post',
    summary: 'Refresh access token',
    description: 'Get new access token using refresh token',
    tags: ['Authentication'],
    requestBody: {
      required: true,
      schema: authSchemas.RefreshTokenRequest
    },
    responses: {
      '200': {
        description: 'Token refreshed successfully',
        schema: authSchemas.AuthResponse
      },
      '401': {
        description: 'Invalid refresh token',
        schema: authSchemas.ErrorResponse
      }
    }
  },
  {
    path: '/api/v1/auth/me',
    method: 'get',
    summary: 'Get current user',
    description: 'Get current authenticated user information',
    tags: ['Authentication'],
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'User information retrieved successfully',
        schema: authSchemas.AuthResponse
      },
      '401': {
        description: 'Unauthorized',
        schema: authSchemas.ErrorResponse
      }
    }
  },
  {
    path: '/api/v1/auth/verify-email',
    method: 'post',
    summary: 'Verify email address',
    description: 'Verify user email address with verification token',
    tags: ['Authentication'],
    requestBody: {
      required: true,
      schema: z.object({
        token: z.string()
      })
    },
    responses: {
      '200': {
        description: 'Email verified successfully',
        schema: authSchemas.SuccessResponse
      },
      '400': {
        description: 'Invalid verification token',
        schema: authSchemas.ErrorResponse
      }
    }
  }
]

// Functional composition helper for route registration
export const createAuthRoutes = (swaggerManager: any) => {
  return authRouteDefinitions.map(route => {
    swaggerManager.addRoute(route)
    return route
  })
}
