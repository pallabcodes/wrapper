/**
 * API Routes - Functional Programming Approach
 * 
 * This file contains all API routes using functional programming patterns.
 */

import { Router } from 'express'
import { authRoutes } from '@ecommerce-enterprise/core'
import { productRouter } from './product/productRoutes'

const router = Router()

// Mount auth routes
router.use('/auth', authRoutes)

// Mount product routes
router.use('/products', productRouter)

export { router as apiRoutes }
