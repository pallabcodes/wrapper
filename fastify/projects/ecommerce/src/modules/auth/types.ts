/**
 * Auth Module Types
 * 
 * Value objects and type definitions for authentication system
 */

import { z } from 'zod'

// ============================================================================
// VALUE OBJECTS
// ============================================================================

export const UserIdSchema = z.string().uuid()
export type UserId = z.infer<typeof UserIdSchema>

export const EmailSchema = z.string().email().max(255)
export type Email = z.infer<typeof EmailSchema>

export const PasswordSchema = z.string().min(8).max(128)
export type Password = z.infer<typeof PasswordSchema>

export const RoleSchema = z.enum([
  'customer',
  'vendor',
  'admin',
  'super_admin',
  'support',
  'manager'
])
export type Role = z.infer<typeof RoleSchema>

export const PermissionSchema = z.enum([
  // User permissions
  'user:read',
  'user:write',
  'user:delete',
  
  // Product permissions
  'product:read',
  'product:write',
  'product:delete',
  'product:publish',
  
  // Order permissions
  'order:read',
  'order:write',
  'order:cancel',
  'order:refund',
  
  // Admin permissions
  'admin:users',
  'admin:products',
  'admin:orders',
  'admin:analytics',
  'admin:settings',
  
  // System permissions
  'system:health',
  'system:metrics',
  'system:logs'
])
export type Permission = z.infer<typeof PermissionSchema>

export const UserStatusSchema = z.enum([
  'pending',
  'active',
  'suspended',
  'banned',
  'deleted'
])
export type UserStatus = z.infer<typeof UserStatusSchema>

export const UserProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  displayName: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  dateOfBirth: z.date().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  timezone: z.string().optional(),
  language: z.string().length(2).optional(),
  biography: z.string().max(500).optional()
})
export type UserProfile = z.infer<typeof UserProfileSchema>

export const AddressSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['billing', 'shipping', 'both']),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  company: z.string().max(100).optional(),
  addressLine1: z.string().min(1).max(100),
  addressLine2: z.string().max(100).optional(),
  city: z.string().min(1).max(50),
  state: z.string().min(1).max(50),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2), // ISO 3166-1 alpha-2
  isDefault: z.boolean().default(false)
})
export type Address = z.infer<typeof AddressSchema>

export const SecuritySettingsSchema = z.object({
  twoFactorEnabled: z.boolean().default(false),
  twoFactorMethod: z.enum(['sms', 'email', 'authenticator']).optional(),
  loginNotifications: z.boolean().default(true),
  sessionTimeout: z.number().int().min(15).max(43200).default(1440), // minutes
  allowMultipleSessions: z.boolean().default(true),
  ipWhitelist: z.array(z.string().ip()).default([]),
  lastPasswordChange: z.date().optional(),
  passwordExpiryDays: z.number().int().min(30).max(365).default(90)
})
export type SecuritySettings = z.infer<typeof SecuritySettingsSchema>

// ============================================================================
// USER STATE AND EVENTS
// ============================================================================

export interface UserState {
  id: UserId
  email: string
  passwordHash: string
  status: UserStatus
  roles: Role[]
  permissions: Permission[]
  profile: UserProfile
  emailVerified: boolean
  phoneVerified: boolean
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  loginAttempts: number
  lastLoginAttempt?: Date | undefined
  lockedUntil?: Date | undefined
  lockReason?: string | undefined
  sessions: any[]
  addresses: Address[]
  securitySettings: SecuritySettings
  createdAt: Date
  updatedAt: Date
  registrationIp?: string
  marketingConsent: boolean
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export type UserEvent = 
  | { type: 'UserRegistered'; payload: any }
  | { type: 'UserLoggedIn'; payload: any }
  | { type: 'UserLoggedOut'; payload: any }
  | { type: 'UserLocked'; payload: any }
  | { type: 'UserPasswordChanged'; payload: any }
  | { type: 'UserRoleChanged'; payload: any }
