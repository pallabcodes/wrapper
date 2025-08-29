/**
 * Auth Types - Functional Programming Approach
 * 
 * Type definitions for authentication and authorization using functional programming patterns.
 */

// Core user interface
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | undefined
  isEmailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

// Authentication tokens
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// Registration data
export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string | undefined
}

// Login data
export interface LoginData {
  email: string
  password: string
}

// Authentication result
export interface AuthResult {
  user: User
  tokens: AuthTokens
}

// Password reset data
export interface PasswordResetData {
  token: string
  password: string
}

// Email verification data
export interface EmailVerificationData {
  token: string
}

// Change password data
export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

// Update profile data
export interface UpdateProfileData {
  firstName?: string | undefined
  lastName?: string | undefined
  phone?: string | undefined
}

// Token payload for JWT
export interface TokenPayload {
  userId: string
  type: 'access' | 'refresh'
  iat?: number
  exp?: number
}

// Stored user with password (internal use)
export interface StoredUser extends User {
  password: string
}

// Token storage entry
export interface TokenEntry {
  email: string
  expiresAt: Date
}
