/**
 * Product Routes - Simple, Clean Implementation
 * 
 * This is how internal teams structure routes.
 * Direct, functional, no over-engineering.
 */

import { Router } from 'express'
import { productController } from './productController'
import { validateBody, authenticateToken } from '@ecommerce-enterprise/core'
import {
  createProductSchema,
  updateProductSchema
} from '@ecommerce-enterprise/core'

// ============================================================================
// PRODUCT ROUTES - Direct Implementation
// ============================================================================

export const createProductRouter = () => {
  const router = Router()

  // Product CRUD operations
  router.post('/', authenticateToken, validateBody(createProductSchema), productController.createProduct)
  router.get('/', productController.listProducts)
  router.get('/search', productController.searchProducts)
  router.get('/stats', productController.getProductStats)
  router.get('/categories', productController.getCategories)
  router.get('/low-stock', productController.getLowStockProducts)
  router.get('/active', productController.getActiveProducts)

  // Product by ID operations
  router.get('/:id', productController.getProduct)
  router.put('/:id', authenticateToken, validateBody(updateProductSchema), productController.updateProduct)
  router.delete('/:id', authenticateToken, productController.deleteProduct)

  // Product management
  router.patch('/:id/stock', authenticateToken, productController.updateProductStock)
  router.get('/:id/availability', productController.validateProductAvailability)

  return router
}

// Export the router for direct use
export const productRouter = createProductRouter()
