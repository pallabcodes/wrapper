/**
 * Auth Controller - Simple, Direct Implementation
 * 
 * This is how internal teams at Google/Atlassian/Stripe/PayPal structure auth.
 * Clean, functional, maintainable - no over-engineering.
 */

import { Request, Response } from 'express'
import { createSuccessResponse, createErrorResponse, createConflictResponse, createUnauthorizedResponse, authService, AppError } from '@ecommerce-enterprise/core'


// ============================================================================
// AUTH CONTROLLERS - Direct Implementation
// ============================================================================

export const authController = {
  // Register new user
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body)
      return createSuccessResponse(res, result, 'User registered successfully')
    } catch (error) {
      if (error instanceof AppError) {
        if (error.code === 'CONFLICT') {
          return createConflictResponse(res, error.message)
        }
        if (error.code === 'VALIDATION_ERROR') {
          return createErrorResponse(res, error.message)
        }
        return createErrorResponse(res, error.message)
      }
      return createErrorResponse(res, error instanceof Error ? error.message : 'Registration failed')
    }
  },

  // Login user
  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body)
      return createSuccessResponse(res, result, 'Login successful')
    } catch (error) {
      if (error instanceof AppError) {
        if (error.code === 'UNAUTHORIZED') {
          return createUnauthorizedResponse(res, error.message)
        }
        if (error.code === 'VALIDATION_ERROR') {
          return createErrorResponse(res, error.message)
        }
        return createErrorResponse(res, error.message)
      }
      return createErrorResponse(res, error instanceof Error ? error.message : 'Login failed')
    }
  },

  // Logout user
  async logout(req: Request, res: Response) {
    try {
      await authService.logout(req.body.refreshToken)
      return createSuccessResponse(res, null, 'Logout successful')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Logout failed')
    }
  },

  // Refresh token
  async refreshToken(req: Request, res: Response) {
    try {
      const tokens = await authService.refreshToken(req.body.refreshToken)
      return createSuccessResponse(res, tokens, 'Token refreshed')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Token refresh failed')
    }
  },

  // Get current user profile
  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string
      if (!userId) {
        return createErrorResponse(res, 'Authentication required')
      }
      
      const user = await authService.getUserById(userId)
      if (!user) {
        return createErrorResponse(res, 'User not found')
      }
      return createSuccessResponse(res, user, 'Profile retrieved')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to get profile')
    }
  },

  // Update user profile
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string
      if (!userId) {
        return createErrorResponse(res, 'Authentication required')
      }
      
      const updatedUser = await authService.updateProfile(userId, req.body)
      return createSuccessResponse(res, updatedUser, 'Profile updated')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to update profile')
    }
  },

  // Change password
  async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string
      if (!userId) {
        return createErrorResponse(res, 'Authentication required')
      }
      
      await authService.changePassword(userId, req.body)
      return createSuccessResponse(res, null, 'Password changed successfully')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to change password')
    }
  },

  // Forgot password
  async forgotPassword(req: Request, res: Response) {
    try {
      await authService.forgotPassword(req.body.email as string)
      return createSuccessResponse(res, null, 'Password reset email sent')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to send reset email')
    }
  },

  // Reset password
  async resetPassword(req: Request, res: Response) {
    try {
      await authService.resetPassword({ token: req.body.token as string, password: req.body.newPassword as string })
      return createSuccessResponse(res, null, 'Password reset successfully')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to reset password')
    }
  },

  // Verify email
  async verifyEmail(req: Request, res: Response) {
    try {
      await authService.verifyEmail(req.body.token)
      return createSuccessResponse(res, null, 'Email verified successfully')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to verify email')
    }
  }
}
