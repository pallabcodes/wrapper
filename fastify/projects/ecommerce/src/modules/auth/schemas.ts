/**
 * Auth Module Schemas
 * 
 * Zod schemas for validation and type inference
 */

import { z } from 'zod'
import {
  UserIdSchema,
  EmailSchema,
  PasswordSchema,
  RoleSchema,
  PermissionSchema,
  UserStatusSchema,
  UserProfileSchema,
  AddressSchema,
  SecuritySettingsSchema
} from './types.js'

// ============================================================================
// USER AGGREGATE STATE
// ============================================================================

export const UserStateSchema = z.object({
  id: UserIdSchema,
  email: EmailSchema,
  passwordHash: z.string(),
  roles: z.array(RoleSchema).default(['customer']),
  permissions: z.array(PermissionSchema).default([]),
  status: UserStatusSchema.default('pending'),
  profile: UserProfileSchema.optional(),
  addresses: z.array(AddressSchema).default([]),
  securitySettings: SecuritySettingsSchema.default({}),
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
  acceptedTermsAt: z.date().optional(),
  lastLoginAt: z.date().optional(),
  lastLoginIp: z.string().ip().optional(),
  loginAttempts: z.number().int().min(0).default(0),
  lockedUntil: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type UserState = z.infer<typeof UserStateSchema>

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export const TokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal('Bearer')
})
export type TokenPair = z.infer<typeof TokenPairSchema>

export const JwtPayloadSchema = z.object({
  userId: UserIdSchema,
  email: EmailSchema,
  roles: z.array(RoleSchema),
  permissions: z.array(PermissionSchema),
  sessionId: z.string().uuid(),
  iat: z.number(),
  exp: z.number(),
  iss: z.string(),
  aud: z.string()
})
export type JwtPayload = z.infer<typeof JwtPayloadSchema>

export const LoginCredentialsSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  rememberMe: z.boolean().default(false),
  userAgent: z.string().optional(),
  ipAddress: z.string().ip().optional()
})
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>

export const RegisterCredentialsSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms and conditions'),
  marketingConsent: z.boolean().default(false),
  userAgent: z.string().optional(),
  ipAddress: z.string().ip().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})
export type RegisterCredentials = z.infer<typeof RegisterCredentialsSchema>
