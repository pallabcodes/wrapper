/**
 * Auth Controller
 * Handles authentication and authorization logic
 */

import { Request, Response } from 'express'
import { z } from 'zod'
import { AppError, ErrorCode } from '../../errors/AppError'
import { validateSchema } from '../../middleware/validation'
import { authService } from './authService'

// Validation schemas
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

const refreshTokenSchema = z.object({
  refreshToken: z.string()
})

// Controller methods
export const authController = {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response) {
    try {
      const validatedData = validateSchema(registerSchema, req.body)
      const result = await authService.register(validatedData)
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          tokens: result.tokens
        }
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        })
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        })
      }
    }
  },

  /**
   * Login user
   */
  async login(req: Request, res: Response) {
    try {
      const validatedData = validateSchema(loginSchema, req.body)
      const result = await authService.login(validatedData)
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          tokens: result.tokens
        }
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        })
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        })
      }
    }
  },

  /**
   * Logout user
   */
  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.body.refreshToken || req.headers.authorization?.replace('Bearer ', '')
      
      if (!refreshToken) {
        throw new AppError('Refresh token is required', ErrorCode.VALIDATION_ERROR)
      }

      await authService.logout(refreshToken)
      
      res.json({
        success: true,
        message: 'Logout successful'
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        })
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        })
      }
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response) {
    try {
      const validatedData = validateSchema(refreshTokenSchema, req.body)
      const result = await authService.refreshToken(validatedData.refreshToken)
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: result
        }
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        })
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        })
      }
    }
  },

  /**
   * Forgot password
   */
  async forgotPassword(req: Request, res: Response) {
    try {
      const validatedData = validateSchema(forgotPasswordSchema, req.body)
      await authService.forgotPassword(validatedData.email)
      
      res.json({
        success: true,
        message: 'Password reset email sent successfully'
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        })
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        })
      }
    }
  },

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response) {
    try {
      const validatedData = validateSchema(resetPasswordSchema, req.body)
      await authService.resetPassword(validatedData.token, validatedData.password)
      
      res.json({
        success: true,
        message: 'Password reset successfully'
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        })
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        })
      }
    }
  },

  /**
   * Verify email
   */
  async verifyEmail(req: Request, res: Response) {
    try {
      const validatedData = validateSchema(verifyEmailSchema, req.body)
      await authService.verifyEmail(validatedData.token)
      
      res.json({
        success: true,
        message: 'Email verified successfully'
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        })
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        })
      }
    }
  },

  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id
      if (!userId) {
        throw new AppError('User not authenticated', ErrorCode.UNAUTHORIZED)
      }

      const user = await authService.getProfile(userId)
      
      res.json({
        success: true,
        data: { user }
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        })
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        })
      }
    }
  }
}
