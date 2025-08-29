/**
 * Auth Routes - Functional Programming Approach
 * 
 * Clean, functional route definitions without verbose comments.
 * Swagger documentation is handled by the functional swagger system.
 */

import { Router } from 'express'
import { registerUser, loginUser, getUserProfile, changePassword, refreshToken } from './authController'
import { authenticateToken } from '../../middleware/auth'
import { validateBody } from '../../middleware/validation'
import { 
  registerSchema, 
  loginSchema, 
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
createAuthRoute('/register', 'post', registerUser, registerSchema)
createAuthRoute('/login', 'post', loginUser, loginSchema)
createAuthRoute('/refresh', 'post', refreshToken, refreshTokenSchema)
createAuthRoute('/profile', 'get', authenticateToken, getUserProfile)
createAuthRoute('/change-password', 'post', authenticateToken, changePassword)

export { router as authRoutes }
