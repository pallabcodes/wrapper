/**
 * API Routes - Functional Programming Approach
 * 
 * This file contains all API routes using functional programming patterns.
 * Swagger documentation is now generated programmatically without comments.
 */

import { Router } from 'express'
import { authRoutes } from '@ecommerce-enterprise/core'

const router = Router()

// Mount auth routes
router.use('/auth', authRoutes)

export { router as apiRoutes }
