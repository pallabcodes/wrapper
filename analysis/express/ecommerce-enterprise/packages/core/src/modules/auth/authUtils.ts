/**
 * Auth Utilities - Functional Programming Approach
 * 
 * Utility functions for authentication and authorization using functional programming patterns.
 */

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { AppError, ErrorCode } from '../../errors/AppError'
import { env } from '../../config/env'
import type { AuthTokens, TokenPayload } from './authTypes'

// Functional utility for generating unique IDs
export const generateId = (): string => crypto.randomUUID()

// Functional utility for hashing passwords
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

// Functional utility for comparing passwords
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

// Functional utility for generating JWT tokens
export const generateTokens = (userId: string): AuthTokens => {
  const accessToken = jwt.sign(
    { userId, type: 'access' as const },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  )
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' as const },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  return { accessToken, refreshToken }
}

// Functional utility for verifying JWT tokens
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload
  } catch (error) {
    throw new AppError('Invalid token', ErrorCode.UNAUTHORIZED)
  }
}

// Functional utility for generating random tokens
export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

// Functional utility for creating expiration dates
export const createExpirationDate = (hours: number): Date => {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + hours)
  return expiresAt
}

// Functional utility for checking if token is expired
export const isTokenExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt
}

// Functional utility for sanitizing user data (removing password)
export const sanitizeUser = (user: any): any => {
  const { password, ...sanitizedUser } = user
  return sanitizedUser
}

// Functional utility for validating email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Functional utility for validating password strength
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

// Functional utility for creating user object
export const createUser = (data: any): any => {
  const now = new Date()
  return {
    id: generateId(),
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    isEmailVerified: false,
    createdAt: now,
    updatedAt: now
  }
}
