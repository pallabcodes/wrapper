/**
 * Auth Service - Functional Programming Approach
 * 
 * Business logic for authentication and authorization using functional programming patterns,
 * composition over inheritance, and enterprise-grade architecture.
 */

import { AppError, ErrorCode } from '../../errors/AppError'
import { logger } from '../../utils/logger'
import type { 
  User, 
  AuthTokens, 
  RegisterData, 
  LoginData, 
  AuthResult,
  PasswordResetData,
  EmailVerificationData,
  ChangePasswordData,
  UpdateProfileData,
  StoredUser,
  TokenEntry
} from './authTypes'
import {
  hashPassword,
  comparePassword,
  generateTokens,
  verifyToken,
  generateRandomToken,
  createExpirationDate,
  isTokenExpired,
  sanitizeUser,
  createUser
} from './authUtils'

// In-memory storage for demo (replace with database in production)
const users: Map<string, StoredUser> = new Map()
const refreshTokens: Map<string, string> = new Map()
const resetTokens: Map<string, TokenEntry> = new Map()
const verificationTokens: Map<string, TokenEntry> = new Map()

// Functional service methods using composition
export const authService = {
  // Register a new user
  async register(data: RegisterData): Promise<AuthResult> {
    const existingUser = Array.from(users.values()).find(u => u.email === data.email)
    if (existingUser) {
      throw new AppError('User already exists', ErrorCode.CONFLICT)
    }

    const hashedPassword = await hashPassword(data.password)
    const user = createUser(data)
    
    users.set(user.id, { ...user, password: hashedPassword })
    
    const tokens = generateTokens(user.id)
    refreshTokens.set(tokens.refreshToken, user.id)
    
    return { user, tokens }
  },

  // Login user
  async login(data: LoginData): Promise<AuthResult> {
    const user = Array.from(users.values()).find(u => u.email === data.email)
    if (!user) {
      throw new AppError('Invalid credentials', ErrorCode.UNAUTHORIZED)
    }

    const isValidPassword = await comparePassword(data.password, user.password)
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', ErrorCode.UNAUTHORIZED)
    }

    const tokens = generateTokens(user.id)
    refreshTokens.set(tokens.refreshToken, user.id)
    
    return { user: sanitizeUser(user), tokens }
  },

  // Logout user
  async logout(refreshToken: string): Promise<void> {
    refreshTokens.delete(refreshToken)
  },

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const userId = refreshTokens.get(refreshToken)
    if (!userId) {
      throw new AppError('Invalid refresh token', ErrorCode.UNAUTHORIZED)
    }

    const payload = verifyToken(refreshToken)
    if (payload.type !== 'refresh') {
      throw new AppError('Invalid token type', ErrorCode.UNAUTHORIZED)
    }

    const tokens = generateTokens(userId)
    refreshTokens.delete(refreshToken)
    refreshTokens.set(tokens.refreshToken, userId)
    
    return tokens
  },

  // Get current user
  async getCurrentUser(userId: string): Promise<User> {
    const user = users.get(userId)
    if (!user) {
      throw new AppError('User not found', ErrorCode.NOT_FOUND)
    }
    
    return sanitizeUser(user)
  },

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    const user = Array.from(users.values()).find(u => u.email === email)
    if (!user) {
      // Don't reveal if user exists
      return
    }

    const token = generateRandomToken()
    const expiresAt = createExpirationDate(1) // 1 hour
    
    resetTokens.set(token, { email, expiresAt })
    
    // TODO: Implement email service integration
    logger.info('Password reset token generated', { email, token })
  },

  // Reset password
  async resetPassword(data: PasswordResetData): Promise<void> {
    const tokenEntry = resetTokens.get(data.token)
    if (!tokenEntry) {
      throw new AppError('Invalid reset token', ErrorCode.VALIDATION_ERROR)
    }

    if (isTokenExpired(tokenEntry.expiresAt)) {
      resetTokens.delete(data.token)
      throw new AppError('Reset token expired', ErrorCode.VALIDATION_ERROR)
    }

    const user = Array.from(users.values()).find(u => u.email === tokenEntry.email)
    if (!user) {
      throw new AppError('User not found', ErrorCode.NOT_FOUND)
    }

    const hashedPassword = await hashPassword(data.password)
    user.password = hashedPassword
    user.updatedAt = new Date()
    
    resetTokens.delete(data.token)
  },

  // Verify email
  async verifyEmail(data: EmailVerificationData): Promise<void> {
    const tokenEntry = verificationTokens.get(data.token)
    if (!tokenEntry) {
      throw new AppError('Invalid verification token', ErrorCode.VALIDATION_ERROR)
    }

    if (isTokenExpired(tokenEntry.expiresAt)) {
      verificationTokens.delete(data.token)
      throw new AppError('Verification token expired', ErrorCode.VALIDATION_ERROR)
    }

    const user = Array.from(users.values()).find(u => u.email === tokenEntry.email)
    if (!user) {
      throw new AppError('User not found', ErrorCode.NOT_FOUND)
    }

    user.isEmailVerified = true
    user.updatedAt = new Date()
    
    verificationTokens.delete(data.token)
  },

  // Change password
  async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    const user = users.get(userId)
    if (!user) {
      throw new AppError('User not found', ErrorCode.NOT_FOUND)
    }

    const isValidPassword = await comparePassword(data.currentPassword, user.password)
    if (!isValidPassword) {
      throw new AppError('Invalid current password', ErrorCode.UNAUTHORIZED)
    }

    const hashedPassword = await hashPassword(data.newPassword)
    user.password = hashedPassword
    user.updatedAt = new Date()
  },

  // Update profile
  async updateProfile(userId: string, data: UpdateProfileData): Promise<User> {
    const user = users.get(userId)
    if (!user) {
      throw new AppError('User not found', ErrorCode.NOT_FOUND)
    }

    Object.assign(user, data, { updatedAt: new Date() })
    
    return sanitizeUser(user)
  },

  // Delete account
  async deleteAccount(userId: string): Promise<void> {
    const user = users.get(userId)
    if (!user) {
      throw new AppError('User not found', ErrorCode.NOT_FOUND)
    }

    users.delete(userId)
    
    // Clean up refresh tokens
    for (const [token, id] of refreshTokens.entries()) {
      if (id === userId) {
        refreshTokens.delete(token)
      }
    }
  }
}
