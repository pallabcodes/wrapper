/**
 * Product Controller - Simple, Direct Implementation
 * 
 * This is how internal teams at Google/Atlassian/Stripe/PayPal structure controllers.
 * Clean, functional, maintainable - no over-engineering.
 */

import { Request, Response } from 'express'
import { productService, createSuccessResponse, createErrorResponse } from '@ecommerce-enterprise/core'

// ============================================================================
// PRODUCT CONTROLLERS - Direct Implementation
// ============================================================================

export const productController = {
  // Create new product
  async createProduct(req: Request, res: Response) {
    try {
      const result = await productService.createProduct(req.body)
      return createSuccessResponse(res, result, 'Product created successfully')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to create product')
    }
  },

  // Get product by ID
  async getProduct(req: Request, res: Response) {
    try {
      const { id } = req.params
      if (!id) {
        return createErrorResponse(res, 'Product ID is required')
      }
      
      const product = await productService.getProductById(id)
      
      if (!product) {
        return createErrorResponse(res, 'Product not found')
      }
      
      return createSuccessResponse(res, product, 'Product retrieved successfully')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to get product')
    }
  },

  // Get product by SKU
  async getProductBySKU(req: Request, res: Response) {
    try {
      const { sku } = req.params
      if (!sku) {
        return createErrorResponse(res, 'Product SKU is required')
      }
      
      const product = await productService.getProductBySKU(sku)
      
      if (!product) {
        return createErrorResponse(res, 'Product not found')
      }
      
      return createSuccessResponse(res, product, 'Product retrieved successfully')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to get product')
    }
  },

  // Update product
  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params
      if (!id) {
        return createErrorResponse(res, 'Product ID is required')
      }
      
      const result = await productService.updateProduct(id, req.body)
      return createSuccessResponse(res, result, 'Product updated successfully')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to update product')
    }
  },

  // Delete product
  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params
      if (!id) {
        return createErrorResponse(res, 'Product ID is required')
      }
      
      await productService.deleteProduct(id)
      return createSuccessResponse(res, null, 'Product deleted successfully')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to delete product')
    }
  },

  // List products
  async listProducts(req: Request, res: Response) {
    try {
      const filters = req.query
      const result = await productService.listProducts(filters)
      return createSuccessResponse(res, result, 'Products retrieved successfully')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to list products')
    }
  },

  // Search products
  async searchProducts(req: Request, res: Response) {
    try {
      const { q: query, ...filters } = req.query
      
      if (!query || typeof query !== 'string') {
        return createErrorResponse(res, 'Search query is required')
      }
      
      const result = await productService.searchProducts(query, filters)
      return createSuccessResponse(res, result, 'Products search completed')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to search products')
    }
  },

  // Get products by category
  async getProductsByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params
      if (!category) {
        return createErrorResponse(res, 'Category is required')
      }
      
      const filters = req.query
      const result = await productService.getProductsByCategory(category, filters)
      return createSuccessResponse(res, result, 'Products by category retrieved')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to get products by category')
    }
  },

  // Get active products
  async getActiveProducts(req: Request, res: Response) {
    try {
      const filters = req.query
      const result = await productService.getActiveProducts(filters)
      return createSuccessResponse(res, result, 'Active products retrieved')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to get active products')
    }
  },

  // Update product stock
  async updateProductStock(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { quantity, operation } = req.body
      
      if (!id) {
        return createErrorResponse(res, 'Product ID is required')
      }
      
      if (!quantity || !operation || !['add', 'subtract'].includes(operation)) {
        return createErrorResponse(res, 'Quantity and operation (add/subtract) are required')
      }
      
      const result = await productService.updateProductStock(id, quantity, operation)
      return createSuccessResponse(res, result, 'Product stock updated successfully')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to update product stock')
    }
  },

  // Get product statistics
  async getProductStats(_req: Request, res: Response) {
    try {
      const stats = await productService.getProductStats()
      return createSuccessResponse(res, stats, 'Product statistics retrieved')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to get product statistics')
    }
  },

  // Get categories
  async getCategories(_req: Request, res: Response) {
    try {
      const categories = await productService.getCategories()
      return createSuccessResponse(res, categories, 'Categories retrieved')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to get categories')
    }
  },

  // Get low stock products
  async getLowStockProducts(req: Request, res: Response) {
    try {
      const { threshold = 10 } = req.query
      const thresholdNum = typeof threshold === 'string' ? parseInt(threshold, 10) : 10
      const products = await productService.getLowStockProducts(thresholdNum)
      return createSuccessResponse(res, products, 'Low stock products retrieved')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to get low stock products')
    }
  },

  // Bulk update products
  async bulkUpdateProducts(req: Request, res: Response) {
    try {
      const { updates } = req.body
      
      if (!Array.isArray(updates)) {
        return createErrorResponse(res, 'Updates array is required')
      }
      
      const result = await productService.bulkUpdateProducts(updates)
      return createSuccessResponse(res, result, 'Products bulk updated successfully')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to bulk update products')
    }
  },

  // Validate product availability
  async validateProductAvailability(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { quantity } = req.query
      
      if (!id) {
        return createErrorResponse(res, 'Product ID is required')
      }
      
      if (!quantity || typeof quantity !== 'string') {
        return createErrorResponse(res, 'Quantity is required')
      }
      
      const quantityNum = parseInt(quantity, 10)
      const isAvailable = await productService.validateProductAvailability(id, quantityNum)
      
      return createSuccessResponse(res, { isAvailable }, 'Product availability validated')
    } catch (error) {
      return createErrorResponse(res, error instanceof Error ? error.message : 'Failed to validate product availability')
    }
  }
}
