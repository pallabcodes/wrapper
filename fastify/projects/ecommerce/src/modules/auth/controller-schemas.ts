/**
 * Auth Controller Schemas
 * 
 * Request and response schemas for authentication endpoints
 */

import { z } from 'zod'
import type { TokenPair } from './schemas.js'

// ============================================================================
// REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const RegisterRequestSchema = z.object({
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

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false)
})

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
