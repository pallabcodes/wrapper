/**
 * Auth Utilities - Functional Programming Approach
 * 
 * Utility functions for the auth system.
 * Kept separate to maintain file size limits.
 */

import jwt from 'jsonwebtoken'
import { logger } from '@ecommerce-enterprise/core'
import type { AuthConfig, JwtPayload, Permission, Role, User, AuthResult } from './authTypes'

// ============================================================================
// CONFIGURATION
// ============================================================================

export const getAuthConfig = (): AuthConfig => {
  return {
    strategy: process.env['AUTH_STRATEGY'] || 'simple',
    jwt: {
      secret: process.env['JWT_SECRET'] || 'default-secret',
      issuer: process.env['JWT_ISSUER'] || 'ecommerce-enterprise',
      ...(process.env['JWT_AUDIENCE'] && { audience: process.env['JWT_AUDIENCE'] }),
      expiresIn: process.env['JWT_EXPIRES_IN'] || '1h'
    },
    debug: process.env['AUTH_DEBUG'] === 'true',
    timeout: process.env['AUTH_TIMEOUT'] ? parseInt(process.env['AUTH_TIMEOUT']) : 5000
  }
}

// ============================================================================
// JWT UTILITIES
// ============================================================================

export const generateAuthToken = (user: Partial<User>): string => {
  const config = getAuthConfig()
  const payload: JwtPayload = {
    userId: user.id || '',
    email: user.email || '',
    permissions: user.permissions?.map(p => `${p.resource}:${p.action}`) || [],
    roles: user.roles?.map(r => r.name) || [],
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    iss: config.jwt.issuer,
    ...(config.jwt.audience && { aud: config.jwt.audience })
  }

  const options = { 
    expiresIn: config.jwt.expiresIn, 
    issuer: config.jwt.issuer 
  } as jwt.SignOptions
  if (config.jwt.audience) {
    options.audience = config.jwt.audience
  }

  return jwt.sign(payload, config.jwt.secret, options)
}

export const validateAuthToken = (token: string): JwtPayload | null => {
  try {
    const config = getAuthConfig()
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    }) as JwtPayload

    return decoded
  } catch (error) {
    logger.warn('Token validation failed', { error: error instanceof Error ? error.message : 'Unknown error' })
    return null
  }
}

// ============================================================================
// PERMISSION UTILITIES
// ============================================================================

export const extractPermissions = (permissionStrings: string[]): Permission[] => {
  return permissionStrings.map(perm => {
    const [resource, action] = perm.split(':')
    return {
      id: perm,
      name: perm,
      resource: resource || '',
      action: action || '',
      conditions: []
    }
  })
}

export const extractRoles = (roleNames: string[]): Role[] => {
  return roleNames.map(roleName => ({
    id: roleName,
    name: roleName,
    permissions: [],
    metadata: {}
  }))
}

export const hasPermission = (userPermissions: Permission[], resource: string, action: string): boolean => {
  return userPermissions.some(perm => 
    perm.resource === resource && perm.action === action
  )
}

export const hasRole = (userRoles: Role[], roleName: string): boolean => {
  return userRoles.some(role => role.name === roleName)
}

// ============================================================================
// USER UTILITIES
// ============================================================================

export const extractUser = (payload: JwtPayload): User => {
  return {
    id: payload.userId,
    email: payload.email,
    firstName: '',
    lastName: '',
    isEmailVerified: true,
    permissions: extractPermissions(payload.permissions),
    roles: extractRoles(payload.roles),
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

export const isAuthenticated = (user: User | null): boolean => {
  return user !== null && user.id !== ''
}

export const isAuthorized = (user: User | null, requiredPermissions?: string[]): boolean => {
  if (!isAuthenticated(user)) return false
  if (!requiredPermissions || requiredPermissions.length === 0) return true
  
  return requiredPermissions.every(perm => {
    const [resource, action] = perm.split(':')
    return hasPermission(user!.permissions, resource || '', action || '')
  })
}

// ============================================================================
// RESULT UTILITIES
// ============================================================================

export const createFailedResult = (error: string, startTime: number): AuthResult => {
  const duration = Date.now() - startTime
  return {
    user: null,
    isAuthenticated: false,
    isAuthorized: false,
    permissions: [],
    metadata: {},
    strategy: 'simple',
    debug: {
      strategy: 'simple',
      steps: ['Failed'],
      duration,
      errors: [error],
      warnings: []
    }
  }
}
