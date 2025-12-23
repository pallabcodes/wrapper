/**
 * Auth Response Handler - Functional Programming Approach
 * 
 * Functional response handlers for authentication endpoints using composition patterns.
 */

import { Response } from 'express'
import { AppError } from '../../errors/AppError'
import type { AuthResult, User } from './authTypes'

// Functional response handler for successful operations
export const createSuccessResponse = (res: Response, data: any, message: string, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  })
}

// Functional response handler for authentication results
export const createAuthResponse = (res: Response, result: AuthResult, message: string) => {
  return createSuccessResponse(res, {
    user: result.user,
    tokens: result.tokens
  }, message)
}

// Functional response handler for user data
export const createUserResponse = (res: Response, user: User, message: string) => {
  return createSuccessResponse(res, { user }, message)
}

// Functional response handler for simple success
export const createSimpleResponse = (res: Response, message: string) => {
  return createSuccessResponse(res, null, message)
}

// Functional error response handler
export const createErrorResponse = (res: Response, error: unknown) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code
    })
  }
  
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  })
}

// Functional validation response handler
export const createValidationResponse = (res: Response, errors: string[]) => {
  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    details: errors
  })
}

// Functional unauthorized response handler
export const createUnauthorizedResponse = (res: Response, message = 'Unauthorized') => {
  return res.status(401).json({
    success: false,
    error: message
  })
}

// Functional not found response handler
export const createNotFoundResponse = (res: Response, message = 'Not found') => {
  return res.status(404).json({
    success: false,
    error: message
  })
}

// Functional conflict response handler
export const createConflictResponse = (res: Response, message = 'Conflict') => {
  return res.status(409).json({
    success: false,
    error: message
  })
}
