/**
 * Auth Routes - Functional Programming Approach
 * 
 * Clean, functional route definitions without verbose comments.
 * Swagger documentation is handled by the functional swagger system.
 */

import { Router } from 'express'
import { authController } from './authController'
import { authenticateToken } from '../../middleware/auth'
import { validateBody } from '../../middleware/validation'
import { 
  registerSchema, 
  loginSchema, 
  logoutSchema, 
  refreshTokenSchema 
} from './authSchemas'

const router = Router()

// Functional route composition
const createAuthRoute = (path: string, method: 'get' | 'post' | 'put' | 'delete', handler: any, schema?: any) => {
  const routeHandler = schema 
    ? [validateBody(schema), handler]
    : [handler]
  
  return router[method](path, ...routeHandler)
}

// Clean route definitions - no verbose comments
createAuthRoute('/register', 'post', authController.register, registerSchema)
createAuthRoute('/login', 'post', authController.login, loginSchema)
createAuthRoute('/logout', 'post', authController.logout, logoutSchema)
createAuthRoute('/refresh', 'post', authController.refreshToken, refreshTokenSchema)
createAuthRoute('/forgot-password', 'post', authController.forgotPassword)
createAuthRoute('/reset-password', 'post', authController.resetPassword)
createAuthRoute('/verify-email', 'post', authController.verifyEmail)
createAuthRoute('/profile', 'get', authenticateToken, authController.getCurrentUser)
createAuthRoute('/profile', 'put', authenticateToken, authController.updateProfile)
createAuthRoute('/change-password', 'post', authenticateToken, authController.changePassword)

export { router as authRoutes }
