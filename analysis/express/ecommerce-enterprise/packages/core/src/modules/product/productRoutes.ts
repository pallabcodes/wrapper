/**
 * Product Routes - Core Business Logic
 * 
 * Core route definitions without Express dependencies.
 * Following the same pattern as auth module.
 */

import { Router } from 'express'
import { productController } from './productController'
import { validateBody } from '../../middleware/validation'
import {
  createProductSchema,
  updateProductSchema
} from './productSchemas'

// ============================================================================
// CORE ROUTE SETUP - Framework Agnostic
// ============================================================================

const router = Router()

// Functional route composition
const createProductRoute = (path: string, method: 'get' | 'post' | 'put' | 'delete' | 'patch', handler: any, schema?: any) => {
  const routeHandler = schema 
    ? [validateBody(schema), handler]
    : [handler]
  
  return router[method](path, ...routeHandler)
}

// Clean route definitions - no verbose comments
createProductRoute('/', 'post', productController.createProduct, createProductSchema)
createProductRoute('/', 'get', productController.listProducts)
createProductRoute('/search', 'get', productController.searchProducts)
createProductRoute('/stats', 'get', productController.getProductStats)
createProductRoute('/categories', 'get', productController.getCategories)
createProductRoute('/low-stock', 'get', productController.getLowStockProducts)
createProductRoute('/active', 'get', productController.getActiveProducts)

// Product by ID operations
createProductRoute('/:id', 'get', productController.getProductById)
createProductRoute('/:id', 'put', productController.updateProduct, updateProductSchema)
createProductRoute('/:id', 'delete', productController.deleteProduct)
createProductRoute('/:id/stock', 'patch', productController.updateProductStock)
createProductRoute('/:id/availability', 'get', productController.validateProductAvailability)

// Product by SKU operations
createProductRoute('/sku/:sku', 'get', productController.getProductBySKU)

// Category operations
createProductRoute('/category/:category', 'get', productController.getProductsByCategory)

// Bulk operations
createProductRoute('/bulk', 'patch', productController.bulkUpdateProducts)

export { router as productRoutes }
