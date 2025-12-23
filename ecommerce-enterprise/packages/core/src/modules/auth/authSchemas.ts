/**
 * Auth Schemas - Functional Programming Approach
 * 
 * Validation schemas for authentication endpoints.
 * Kept separate to maintain clean controllers.
 */

const { z } = require('zod')

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional()
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

export const logoutSchema = z.object({
  refreshToken: z.string()
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string()
})

export const forgotPasswordSchema = z.object({
  email: z.string().email()
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8)
})

export const verifyEmailSchema = z.object({
  token: z.string()
})

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8)
})

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional()
})
