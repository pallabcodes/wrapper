/**
 * Auth Controller - Functional Programming Approach
 * 
 * Handles authentication and authorization logic using functional programming patterns,
 * composition over inheritance, and enterprise-grade error handling.
 */

import { Request, Response } from 'express'
import { z } from 'zod'
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

// Validation schemas using functional composition
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional()
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

const logoutSchema = z.object({
  refreshToken: z.string()
})

const refreshTokenSchema = z.object({
  refreshToken: z.string()
})

const forgotPasswordSchema = z.object({
  email: z.string().email()
})

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8)
})

const verifyEmailSchema = z.object({
  token: z.string()
})

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8)
})

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional()
})

// Functional controller methods using composition
export const authController = {
  // Register a new user
  async register(req: Request, res: Response) {
    try {
      const validatedData = validateSchema(registerSchema, req.body)
      const result = await authService.register(validatedData)
      return createAuthResponse(res, result, 'User registered successfully')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  // Login user
  async login(req: Request, res: Response) {
    try {
      const validatedData = validateSchema(loginSchema, req.body)
      const result = await authService.login(validatedData)
      return createAuthResponse(res, result, 'Login successful')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  // Logout user
  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = validateSchema(logoutSchema, req.body)
      await authService.logout(refreshToken)
      return createSimpleResponse(res, 'Logout successful')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  // Refresh access token
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = validateSchema(refreshTokenSchema, req.body)
      const tokens = await authService.refreshToken(refreshToken)
      return createSuccessResponse(res, { tokens }, 'Token refreshed successfully')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  // Get current user
  async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        return createUnauthorizedResponse(res)
      }
      
      const user = await authService.getCurrentUser(userId)
      return createUserResponse(res, user, 'User retrieved successfully')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  // Forgot password
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = validateSchema(forgotPasswordSchema, req.body)
      await authService.forgotPassword(email)
      return createSimpleResponse(res, 'Password reset email sent')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  // Reset password
  async resetPassword(req: Request, res: Response) {
    try {
      const validatedData = validateSchema(resetPasswordSchema, req.body)
      await authService.resetPassword(validatedData)
      return createSimpleResponse(res, 'Password reset successfully')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  // Verify email
  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = validateSchema(verifyEmailSchema, req.body)
      await authService.verifyEmail({ token })
      return createSimpleResponse(res, 'Email verified successfully')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  },

  // Change password
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

  // Update profile
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

  // Delete account
  async deleteAccount(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        return createUnauthorizedResponse(res)
      }
      
      await authService.deleteAccount(userId)
      return createSimpleResponse(res, 'Account deleted successfully')
    } catch (error) {
      return createErrorResponse(res, error)
    }
  }
}
