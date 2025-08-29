/**
 * Auth Routes - Direct Express Implementation
 * 
 * This is how internal teams at Google/Atlassian/Stripe/PayPal structure routes.
 * Simple, direct, working - no over-engineering.
 */

import { Router } from 'express'
import { authController } from './authController'
import { validateBody, authenticateToken } from '@ecommerce-enterprise/core'
import {
  registerSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
  updateProfileSchema
} from '@ecommerce-enterprise/core'

// ============================================================================
// DIRECT ROUTE SETUP - How internal teams do it
// ============================================================================

export const createAuthRouter = () => {
  const router = Router()

  // Public routes (no auth required)
  router.post('/register', validateBody(registerSchema), authController.register)
  router.post('/login', validateBody(loginSchema), authController.login)
  router.post('/logout', validateBody(logoutSchema), authController.logout)
  router.post('/refresh-token', validateBody(refreshTokenSchema), authController.refreshToken)
  router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword)
  router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword)
  router.post('/verify-email', validateBody(verifyEmailSchema), authController.verifyEmail)

  // Protected routes (auth required)
  router.get('/me', authenticateToken, authController.getProfile)
  router.put('/profile', authenticateToken, validateBody(updateProfileSchema), authController.updateProfile)
  router.post('/change-password', authenticateToken, validateBody(changePasswordSchema), authController.changePassword)

  return router
}

// Export the router for direct use
export const authRouter = createAuthRouter()
