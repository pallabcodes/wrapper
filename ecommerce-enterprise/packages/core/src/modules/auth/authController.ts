/**
 * Auth Controller - Functional Programming Approach
 * 
 * Clean controller focused on business logic only.
 * No schemas or validation logic - pure controller responsibilities.
 */

import { Request, Response } from 'express'
import { validateSchema } from '../../middleware/validation'
import { authService } from './authService'
import { createSuccessResponse, createErrorResponse } from '../../utils/responseWrapper'
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  refreshTokenSchema
} from './authSchemas'
import type { RegisterData, LoginData, ChangePasswordData } from './authTypes'

// ============================================================================
// CONTROLLER METHODS
// ============================================================================

export const registerUser = async (req: Request, res: Response) => {
  try {
    const validatedData = validateSchema(registerSchema, req.body) as RegisterData
    const result = await authService.register(validatedData)
    return createSuccessResponse(res, result, 'User registered successfully')
  } catch (error) {
    return createErrorResponse(res, error instanceof Error ? error.message : 'Registration failed')
  }
}

export const loginUser = async (req: Request, res: Response) => {
  try {
    const validatedData = validateSchema(loginSchema, req.body) as LoginData
    const result = await authService.login(validatedData)
    return createSuccessResponse(res, result, 'Login successful')
  } catch (error) {
    return createErrorResponse(res, error instanceof Error ? error.message : 'Login failed')
  }
}

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId
    if (!userId) {
      return createErrorResponse(res, 'Unauthorized')
    }
    
    const result = await authService.getUserById(userId)
    if (result) {
      return createSuccessResponse(res, result, 'User retrieved successfully')
    } else {
      return createErrorResponse(res, 'User not found')
    }
  } catch (error) {
    return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to get user profile')
  }
}

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId
    if (!userId) {
      return createErrorResponse(res, 'Unauthorized')
    }
    
    const validatedData = validateSchema(changePasswordSchema, req.body) as ChangePasswordData
    await authService.changePassword(userId, validatedData)
    return createSuccessResponse(res, null, 'Password changed successfully')
  } catch (error) {
    return createErrorResponse(res, error instanceof Error ? error.message : 'Password change failed')
  }
}

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const validatedData = validateSchema(refreshTokenSchema, req.body) as { refreshToken: string }
    const result = await authService.refreshToken(validatedData.refreshToken)
    return createSuccessResponse(res, result, 'Token refreshed successfully')
  } catch (error) {
    return createErrorResponse(res, error instanceof Error ? error.message : 'Token refresh failed')
  }
}
