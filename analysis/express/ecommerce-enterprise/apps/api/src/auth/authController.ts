/**
 * Auth Controller - Simple, Direct Implementation
 * 
 * This is how internal teams at Google/Atlassian/Stripe/PayPal structure auth.
 * Clean, functional, maintainable - no over-engineering.
 */

import { Request, Response } from 'express'
import { authService } from '@ecommerce-enterprise/core'
import { responseWrapper } from '@ecommerce-enterprise/core'

// ============================================================================
// AUTH CONTROLLERS - Direct Implementation
// ============================================================================

export const authController = {
  // Register new user
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body)
      return responseWrapper.created(res, result, 'User registered successfully')
    } catch (error) {
      return responseWrapper.error(res, 'Registration failed', 400, error as string)
    }
  },

  // Login user
  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body)
      return responseWrapper.success(res, result, 'Login successful')
    } catch (error) {
      return responseWrapper.error(res, 'Login failed', 401, error as string)
    }
  },

  // Logout user
  async logout(req: Request, res: Response) {
    try {
      await authService.logout(req.body.refreshToken)
      return responseWrapper.success(res, null, 'Logout successful')
    } catch (error) {
      return responseWrapper.error(res, 'Logout failed', 400, error as string)
    }
  },

  // Refresh token
  async refreshToken(req: Request, res: Response) {
    try {
      const tokens = await authService.refreshToken(req.body.refreshToken)
      return responseWrapper.success(res, tokens, 'Token refreshed')
    } catch (error) {
      return responseWrapper.error(res, 'Token refresh failed', 401, error as string)
    }
  },

  // Get current user profile
  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string
      if (!userId) {
        return responseWrapper.unauthorized(res, 'Authentication required')
      }
      
      const user = await authService.getUserById(userId)
      if (!user) {
        return responseWrapper.error(res, 'User not found', 404)
      }
      return responseWrapper.success(res, user, 'Profile retrieved')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to get profile', 500, error as string)
    }
  },

  // Update user profile
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string
      if (!userId) {
        return responseWrapper.unauthorized(res, 'Authentication required')
      }
      
      const updatedUser = await authService.updateProfile(userId, req.body)
      return responseWrapper.success(res, updatedUser, 'Profile updated')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to update profile', 400, error as string)
    }
  },

  // Change password
  async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string
      if (!userId) {
        return responseWrapper.unauthorized(res, 'Authentication required')
      }
      
      await authService.changePassword(userId, req.body)
      return responseWrapper.success(res, null, 'Password changed successfully')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to change password', 400, error as string)
    }
  },

  // Forgot password
  async forgotPassword(req: Request, res: Response) {
    try {
      await authService.forgotPassword(req.body.email as string)
      return responseWrapper.success(res, null, 'Password reset email sent')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to send reset email', 400, error as string)
    }
  },

  // Reset password
  async resetPassword(req: Request, res: Response) {
    try {
      await authService.resetPassword({ token: req.body.token as string, password: req.body.newPassword as string })
      return responseWrapper.success(res, null, 'Password reset successfully')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to reset password', 400, error as string)
    }
  },

  // Verify email
  async verifyEmail(req: Request, res: Response) {
    try {
      await authService.verifyEmail(req.body.token)
      return responseWrapper.success(res, null, 'Email verified successfully')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to verify email', 400, error as string)
    }
  }
}
