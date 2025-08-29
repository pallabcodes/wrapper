/**
 * Product Routes - Direct Express Implementation
 * 
 * This is how internal teams at Google/Atlassian/Stripe/PayPal structure routes.
 * Simple, direct, working - no over-engineering.
 */

import { Router } from 'express'
import { productController } from './productController'
import { validateBody, validateParams, validateQuery } from '@ecommerce-enterprise/core'
import {
  createProductSchema,
  updateProductSchema,
  productFiltersSchema,
  productIdSchema
} from '@ecommerce-enterprise/core'

// ============================================================================
// DIRECT ROUTE SETUP - How internal teams do it
// ============================================================================

export const createProductRouter = () => {
  const router = Router()

  // Product CRUD operations
  router.post('/', validateBody(createProductSchema), productController.createProduct)
  router.get('/', validateQuery(productFiltersSchema), productController.listProducts)
  
  // Static routes (must come before parameterized routes)
  router.get('/search', validateQuery(productFiltersSchema), productController.searchProducts)
  router.get('/stats', productController.getProductStats)
  router.get('/categories', productController.getCategories)
  router.get('/low-stock', validateQuery(productFiltersSchema), productController.getLowStockProducts)
  router.get('/active', validateQuery(productFiltersSchema), productController.getActiveProducts)
  router.get('/category/:category', validateQuery(productFiltersSchema), productController.getProductsByCategory)
  router.get('/sku/:sku', productController.getProductBySKU)
  
  // Product by ID operations (must come after static routes)
  router.get('/:id', validateParams(productIdSchema), productController.getProduct)
  router.put('/:id', validateParams(productIdSchema), validateBody(updateProductSchema), productController.updateProduct)
  router.delete('/:id', validateParams(productIdSchema), productController.deleteProduct)
  router.patch('/:id/stock', validateParams(productIdSchema), productController.updateProductStock)
  router.get('/:id/availability', validateParams(productIdSchema), productController.validateProductAvailability)
  
  // Bulk operations
  router.patch('/bulk', productController.bulkUpdateProducts)

  return router
}

// Export the router for direct use
export const productRouter = createProductRouter()
