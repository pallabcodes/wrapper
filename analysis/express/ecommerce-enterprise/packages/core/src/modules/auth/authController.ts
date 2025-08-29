/**
 * Auth Controller - Functional Programming Approach
 * 
 * Clean controller focused on business logic only.
 * No schemas or validation logic - pure controller responsibilities.
 */

import { Request, Response } from 'express'
import { validateSchema } from '../../middleware/validation'
import { authService } from './authService'
import {
  createAuthResponse,
  createUserResponse,
  createSimpleResponse,
  createErrorResponse,
  createUnauthorizedResponse,
  createSuccessResponse
} from './authResponseHandler'
import {
  registerSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
  updateProfileSchema
} from './authSchemas'

// ============================================================================
// CONTROLLER METHODS
// ============================================================================

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const validatedData = validateSchema(registerSchema, req.body)
      const result = await authService.register(validatedData)
      return createAuthResponse(res, result, 'User registered successfully')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  async login(req: Request, res: Response) {
    try {
      const validatedData = validateSchema(loginSchema, req.body)
      const result = await authService.login(validatedData)
      return createAuthResponse(res, result, 'Login successful')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = validateSchema(logoutSchema, req.body)
      await authService.logout(refreshToken)
      return createSimpleResponse(res, 'Logout successful')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = validateSchema(refreshTokenSchema, req.body)
      const tokens = await authService.refreshToken(refreshToken)
      return createSuccessResponse(res, { tokens }, 'Token refreshed successfully')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        return createUnauthorizedResponse(res)
      }
      
      const user = await authService.getUserById(userId)
      if (!user) {
        return createErrorResponse(res, new Error('User not found'))
      }
      return createUserResponse(res, user, 'User retrieved successfully')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = validateSchema(forgotPasswordSchema, req.body)
      await authService.forgotPassword(email)
      return createSimpleResponse(res, 'Password reset email sent')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const validatedData = validateSchema(resetPasswordSchema, req.body)
      await authService.resetPassword(validatedData)
      return createSimpleResponse(res, 'Password reset successfully')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = validateSchema(verifyEmailSchema, req.body)
      await authService.verifyEmail(token)
      return createSimpleResponse(res, 'Email verified successfully')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        return createUnauthorizedResponse(res)
      }
      
      const validatedData = validateSchema(changePasswordSchema, req.body)
      await authService.changePassword(userId, validatedData)
      return createSimpleResponse(res, 'Password changed successfully')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        return createUnauthorizedResponse(res)
      }
      
      const validatedData = validateSchema(updateProfileSchema, req.body)
      const user = await authService.updateProfile(userId, validatedData)
      return createUserResponse(res, user, 'Profile updated successfully')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  async deleteAccount(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        return createUnauthorizedResponse(res)
      }
      
      // TODO: Implement deleteAccount in authService
      throw new Error('Delete account not implemented')
      return createSimpleResponse(res, 'Account deleted successfully')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  }
}
