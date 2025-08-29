import { AppError, ErrorCode } from '../../errors/AppError'
import { logger } from '../../utils/logger'
import type { 
  User, 
  AuthTokens, 
  RegisterData, 
  LoginData, 
  AuthResult,
  PasswordResetData,
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

// Core authentication functions
const findUserByEmail = (email: string): StoredUser | undefined => 
  Array.from(users.values()).find(u => u.email === email)

const storeUser = (user: StoredUser, hashedPassword: string): void => {
  users.set(user.id, { ...user, password: hashedPassword })
}

const storeRefreshToken = (refreshToken: string, userId: string): void => {
  refreshTokens.set(refreshToken, userId)
}

const removeRefreshToken = (refreshToken: string): void => {
  refreshTokens.delete(refreshToken)
}

// Functional service methods
export const authService = {
  async register(data: RegisterData): Promise<AuthResult> {
    const existingUser = findUserByEmail(data.email)
    if (existingUser) {
      throw new AppError('User already exists', ErrorCode.CONFLICT)
    }

    const hashedPassword = await hashPassword(data.password)
    const user = createUser(data)
    
    storeUser(user, hashedPassword)
    
    const tokens = generateTokens(user.id)
    storeRefreshToken(tokens.refreshToken, user.id)
    
    return { user, tokens }
  },

  async login(data: LoginData): Promise<AuthResult> {
    const user = findUserByEmail(data.email)
    if (!user) {
      throw new AppError('Invalid credentials', ErrorCode.UNAUTHORIZED)
    }

    const isValidPassword = await comparePassword(data.password, user.password)
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', ErrorCode.UNAUTHORIZED)
    }

    const tokens = generateTokens(user.id)
    storeRefreshToken(tokens.refreshToken, user.id)
    
    return { user: sanitizeUser(user), tokens }
  },

  async logout(refreshToken: string): Promise<void> {
    removeRefreshToken(refreshToken)
  },

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
    removeRefreshToken(refreshToken)
    storeRefreshToken(tokens.refreshToken, userId)
    
    return tokens
  },

  async forgotPassword(email: string): Promise<void> {
    const user = findUserByEmail(email)
    if (!user) {
      return
    }

    const token = generateRandomToken()
    const expiresAt = createExpirationDate(15) // 15 minutes
    
    resetTokens.set(token, { userId: user.id, expiresAt })
    
    // TODO: Send email with reset link
    logger.info('Password reset token generated', { email, token })
  },

  async resetPassword(data: PasswordResetData): Promise<void> {
    const tokenEntry = resetTokens.get(data.token)
    if (!tokenEntry || isTokenExpired(tokenEntry.expiresAt)) {
      throw new AppError('Invalid or expired token', ErrorCode.UNAUTHORIZED)
    }

    const user = users.get(tokenEntry.userId)
    if (!user) {
      throw new AppError('User not found', ErrorCode.NOT_FOUND)
    }

    const hashedPassword = await hashPassword(data.password)
    user.password = hashedPassword
    users.set(user.id, user)
    
    resetTokens.delete(data.token)
  },

  async verifyEmail(token: string): Promise<void> {
    const tokenEntry = verificationTokens.get(token)
    if (!tokenEntry || isTokenExpired(tokenEntry.expiresAt)) {
      throw new AppError('Invalid or expired token', ErrorCode.UNAUTHORIZED)
    }

    const user = users.get(tokenEntry.userId)
    if (!user) {
      throw new AppError('User not found', ErrorCode.NOT_FOUND)
    }

    user.isEmailVerified = true
    users.set(user.id, user)
    
    verificationTokens.delete(token)
  },

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
    users.set(user.id, user)
  },

  async updateProfile(userId: string, data: UpdateProfileData): Promise<User> {
    const user = users.get(userId)
    if (!user) {
      throw new AppError('User not found', ErrorCode.NOT_FOUND)
    }

    const updatedUser = { 
      ...user, 
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.phone && { phone: data.phone }),
      updatedAt: new Date() 
    }
    users.set(userId, updatedUser)
    
    return sanitizeUser(updatedUser)
  },

  async getUserById(userId: string): Promise<User | null> {
    const user = users.get(userId)
    return user ? sanitizeUser(user) : null
  }
}
