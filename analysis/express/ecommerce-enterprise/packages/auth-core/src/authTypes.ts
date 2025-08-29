/**
 * Auth Types - Functional Programming Approach
 * 
 * Type definitions for the auth system.
 * Kept separate to maintain file size limits.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  isEmailVerified: boolean
  permissions: Permission[]
  roles: Role[]
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  conditions?: unknown[]
}

export interface Role {
  id: string
  name: string
  permissions: Permission[]
  metadata: Record<string, any>
}

export interface AuthResult {
  user: User | null
  isAuthenticated: boolean
  isAuthorized: boolean
  permissions: Permission[]
  metadata: Record<string, any>
  strategy: string
  debug?: {
    strategy: string
    steps: string[]
    duration: number
    errors: string[]
    warnings: string[]
  }
}

export interface AuthConfig {
  strategy: string
  jwt: {
    secret: string
    issuer: string
    audience?: string
    expiresIn: string
  }
  debug?: boolean
  timeout?: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface JwtPayload {
  userId: string
  email: string
  permissions: string[]
  roles: string[]
  type: 'access' | 'refresh'
  iat: number
  exp: number
  iss: string
  aud?: string
}
