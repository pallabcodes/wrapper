/**
 * Auth Schemas - Functional Programming Approach
 * 
 * This file contains all authentication-related schemas using Zod for type safety
 * and functional composition patterns. These schemas are used for validation,
 * OpenAPI generation, and type inference.
 */

import { z } from 'zod'

// Base user schema with functional composition
const baseUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
  isEmailVerified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

// Auth tokens schema
export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string()
})

// Register request schema with validation
export const registerRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().optional()
})

// Login request schema
export const loginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

// Logout request schema
export const logoutRequestSchema = z.object({
  refreshToken: z.string()
})

// Refresh token request schema
export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string()
})

// Auth response schema with functional composition
export const authResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    user: baseUserSchema,
    tokens: authTokensSchema
  }).optional()
})

// Success response schema
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
})

// Error response schema
export const errorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  error: z.string().optional(),
  code: z.string().optional()
})

// Type exports for functional programming
export type RegisterRequest = z.infer<typeof registerRequestSchema>
export type LoginRequest = z.infer<typeof loginRequestSchema>
export type LogoutRequest = z.infer<typeof logoutRequestSchema>
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type SuccessResponse = z.infer<typeof successResponseSchema>
export type ErrorResponse = z.infer<typeof errorResponseSchema>
export type User = z.infer<typeof baseUserSchema>
export type AuthTokens = z.infer<typeof authTokensSchema>

// Schema registry for OpenAPI generation
export const authSchemas = {
  User: baseUserSchema,
  AuthTokens: authTokensSchema,
  RegisterRequest: registerRequestSchema,
  LoginRequest: loginRequestSchema,
  LogoutRequest: logoutRequestSchema,
  RefreshTokenRequest: refreshTokenRequestSchema,
  AuthResponse: authResponseSchema,
  SuccessResponse: successResponseSchema,
  ErrorResponse: errorResponseSchema
} as const
