/**
 * Auth Controller Schemas
 * 
 * Request and response schemas for authentication endpoints
 */

import { z } from 'zod'
import type { TokenPair } from './schemas.js'

// ============================================================================
// ZOD SCHEMAS (for backend validation)
// ============================================================================

export const RegisterRequestZodSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  confirmPassword: z.string(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms and conditions'),
  marketingConsent: z.boolean().default(false)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const LoginRequestZodSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false)
})

// ============================================================================
// JSON SCHEMAS (for Fastify validation)
// ============================================================================

export const RegisterRequestSchema = {
  type: 'object',
  required: ['email', 'password', 'confirmPassword', 'acceptTerms'],
  properties: {
    email: { 
      type: 'string', 
      format: 'email',
      maxLength: 255
    },
    password: { 
      type: 'string', 
      minLength: 8, 
      maxLength: 128
    },
    confirmPassword: { 
      type: 'string'
    },
    firstName: { 
      type: 'string', 
      minLength: 1, 
      maxLength: 50
    },
    lastName: { 
      type: 'string', 
      minLength: 1, 
      maxLength: 50
    },
    acceptTerms: { 
      type: 'boolean'
    },
    marketingConsent: { 
      type: 'boolean', 
      default: false
    }
  },
  additionalProperties: false
} as const

export const LoginRequestSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { 
      type: 'string', 
      format: 'email'
    },
    password: { 
      type: 'string', 
      minLength: 1
    },
    rememberMe: { 
      type: 'boolean', 
      default: false
    }
  },
  additionalProperties: false
} as const

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AuthResponse {
  readonly user: {
    readonly id: string
    readonly email: string
    readonly roles: readonly string[]
    readonly status: string
    readonly emailVerified: boolean
  }
  readonly tokens: TokenPair
}
