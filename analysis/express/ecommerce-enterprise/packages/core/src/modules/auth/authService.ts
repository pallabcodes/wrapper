/**
 * Auth Service
 * Business logic for authentication and authorization
 */

// import { z } from 'zod'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { AppError, ErrorCode } from '../../errors/AppError'
import { env } from '../../config/env'

// Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  isEmailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string | undefined
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResult {
  user: User
  tokens: AuthTokens
}

// In-memory storage for demo (replace with database in production)
const users: Map<string, User & { password: string }> = new Map()
const refreshTokens: Map<string, string> = new Map()
const resetTokens: Map<string, { email: string; expiresAt: Date }> = new Map()
const verificationTokens: Map<string, { email: string; expiresAt: Date }> = new Map()

// Helper functions
const generateId = (): string => crypto.randomUUID()

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

const generateTokens = (userId: string): AuthTokens => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  )
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  return { accessToken, refreshToken }
}

const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, env.JWT_SECRET)
  } catch (error) {
    throw new AppError('Invalid token', ErrorCode.UNAUTHORIZED)
  }
}

// Service methods
export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = Array.from(users.values()).find(u => u.email === data.email)
    if (existingUser) {
      throw new AppError('User already exists', ErrorCode.CONFLICT)
    }

    // Create user
    const userId = generateId()
    const hashedPassword = await hashPassword(data.password)
    
    const user: User = {
      id: userId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(data.phone && { phone: data.phone })
    }

    // Store user with password (in production, save to database)
    users.set(userId, { ...user, password: hashedPassword })
    
    // Generate tokens
    const tokens = generateTokens(userId)
    refreshTokens.set(tokens.refreshToken, userId)

    // Send verification email (in production)
    await this.sendVerificationEmail(user.email)

    return { user, tokens }
  },

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResult> {
    // Find user
    const user = Array.from(users.values()).find(u => u.email === data.email)
    if (!user) {
      throw new AppError('Invalid credentials', ErrorCode.UNAUTHORIZED)
    }

    // Verify password
    const isValidPassword = await comparePassword(data.password, user.password)
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', ErrorCode.UNAUTHORIZED)
    }

    // Generate tokens
    const tokens = generateTokens(user.id)
    refreshTokens.set(tokens.refreshToken, user.id)

    return { user, tokens }
  },

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    // Remove refresh token
    refreshTokens.delete(refreshToken)
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const payload = verifyToken(refreshToken)
    if (payload.type !== 'refresh') {
      throw new AppError('Invalid token type', ErrorCode.UNAUTHORIZED)
    }

    // Check if token exists in storage
    if (!refreshTokens.has(refreshToken)) {
      throw new AppError('Token not found', ErrorCode.UNAUTHORIZED)
    }

    // Generate new tokens
    const tokens = generateTokens(payload.userId)
    
    // Remove old refresh token and add new one
    refreshTokens.delete(refreshToken)
    refreshTokens.set(tokens.refreshToken, payload.userId)

    return tokens
  },

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<void> {
    // Check if user exists
    const user = Array.from(users.values()).find(u => u.email === email)
    if (!user) {
      // Don't reveal if user exists or not
      return
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store reset token
    resetTokens.set(resetToken, { email, expiresAt })

    // Send reset email (in production)
    await this.sendPasswordResetEmail(email, resetToken)
  },

  /**
   * Reset password
   */
  async resetPassword(token: string, _newPassword: string): Promise<void> {
    // Find reset token
    const resetData = resetTokens.get(token)
    if (!resetData) {
      throw new AppError('Invalid reset token', ErrorCode.VALIDATION_ERROR)
    }

    // Check if token expired
    if (resetData.expiresAt < new Date()) {
      resetTokens.delete(token)
      throw new AppError('Reset token expired', ErrorCode.VALIDATION_ERROR)
    }

    // Find user
    const user = Array.from(users.values()).find(u => u.email === resetData.email)
    if (!user) {
      throw new AppError('User not found', ErrorCode.NOT_FOUND)
    }

    // Update password (in production, update in database)
    // const hashedPassword = await hashPassword(newPassword)
    // user.password = hashedPassword // In production

    // Remove reset token
    resetTokens.delete(token)
  },

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    // Find verification token
    const verificationData = verificationTokens.get(token)
    if (!verificationData) {
      throw new AppError('Invalid verification token', ErrorCode.VALIDATION_ERROR)
    }

    // Check if token expired
    if (verificationData.expiresAt < new Date()) {
      verificationTokens.delete(token)
      throw new AppError('Verification token expired', ErrorCode.VALIDATION_ERROR)
    }

    // Find user
    const user = Array.from(users.values()).find(u => u.email === verificationData.email)
    if (!user) {
      throw new AppError('User not found', ErrorCode.NOT_FOUND)
    }

    // Mark email as verified
    user.isEmailVerified = true
    user.updatedAt = new Date()

    // Remove verification token
    verificationTokens.delete(token)
  },

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<User> {
    const user = users.get(userId)
    if (!user) {
      throw new AppError('User not found', ErrorCode.NOT_FOUND)
    }

    return user
  },

  /**
   * Send verification email (placeholder)
   */
  async sendVerificationEmail(email: string): Promise<void> {
    // In production, send actual email
    console.log(`Verification email sent to ${email}`)
  },

  /**
   * Send password reset email (placeholder)
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // In production, send actual email
    console.log(`Password reset email sent to ${email} with token ${token}`)
  }
}
