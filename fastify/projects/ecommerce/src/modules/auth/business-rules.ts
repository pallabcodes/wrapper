/**
 * Auth Module Business Rules
 * 
 * Pure functions for validation and business logic
 */

import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { 
  validateWith,
  validateBusinessRule,
  tryCatchAsync,
  createValidationError,
  createAuthorizationError,
  type DomainResult,
  type AsyncResult,
  Result
} from '../../shared/functionalArchitecture.js'
import { config } from '../../config/index.js'
import { EmailSchema, PasswordSchema } from './types.js'
import { JwtPayloadSchema } from './schemas.js'
import type { Email, Password } from './types.js'
import type { UserState, TokenPair, JwtPayload } from './schemas.js'

// ============================================================================
// BUSINESS RULES (Pure Functions)
// ============================================================================

export const validateEmail = (email: string): DomainResult<Email> => {
  const result = validateWith(EmailSchema)(email)
  if (result.type === 'error') {
    return result
  }
  return Result.success(result.value as Email)
}

export const validatePassword = (password: string): DomainResult<Password> => {
  const validationResult = validateWith(PasswordSchema)(password)
  if (validationResult.type === 'error') {
    return validationResult
  }

  const validPassword = validationResult.value as Password
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  
  if (!passwordRegex.test(validPassword)) {
    return Result.error('Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character')
  }

  return Result.success(validPassword)
}

export const validateUserNotLocked = (user: UserState): DomainResult<UserState> => {
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return Result.error('User account is locked')
  }
  return Result.success(user)
}

export const validateUserActive = (user: UserState): DomainResult<UserState> => {
  if (user.status !== 'active') {
    return Result.error('User account is not active')
  }
  return Result.success(user)
}

export const validateLoginAttempts = (user: UserState): DomainResult<UserState> => {
  if (user.loginAttempts >= 5) {
    return Result.error('Too many failed login attempts')
  }
  return Result.success(user)
}

export const shouldLockUser = (user: UserState): boolean =>
  user.loginAttempts >= 5

export const calculateLockoutDuration = (reason: string): number => {
  // Progressive lockout based on reason
  const durations: Record<string, number> = {
    'max_login_attempts': 15 * 60 * 1000, // 15 minutes
    'admin_action': 24 * 60 * 60 * 1000, // 24 hours
    'security_violation': 7 * 24 * 60 * 60 * 1000 // 7 days
  }
  return durations[reason] || 15 * 60 * 1000 // default 15 minutes
}

// ============================================================================
// CRYPTOGRAPHIC FUNCTIONS
// ============================================================================

export const hashPassword = (password: Password): AsyncResult<string> =>
  tryCatchAsync(() => bcrypt.hash(password, 12))

export const verifyPassword = (password: Password, hashedPassword: string): AsyncResult<boolean> =>
  tryCatchAsync(() => bcrypt.compare(password, hashedPassword))

export const generateTokenPair = (user: UserState, sessionId: string): DomainResult<TokenPair> => {
  try {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
      iss: 'ecommerce-platform',
      aud: 'ecommerce-users'
    }

    const accessToken = jwt.sign(payload, config.auth.jwtSecret, {
      algorithm: 'HS256'
    })

    const refreshPayload = {
      userId: user.id,
      sessionId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }

    const refreshToken = jwt.sign(refreshPayload, config.auth.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: '7d'
    })

    return Result.success({
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: 'Bearer' as const
    })
  } catch (error) {
    return Result.error('Failed to generate tokens')
  }
}

export const verifyAccessToken = (token: string): DomainResult<JwtPayload> => {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'ecommerce-platform',
      audience: 'ecommerce-users'
    }) as JwtPayload

    const validationResult = validateWith(JwtPayloadSchema)(decoded)
    if (validationResult.type === 'error') {
      return Result.error('Invalid token payload')
    }

    return Result.success(validationResult.value as JwtPayload)
  } catch (error) {
    return Result.error('Invalid or expired token')
  }
}
