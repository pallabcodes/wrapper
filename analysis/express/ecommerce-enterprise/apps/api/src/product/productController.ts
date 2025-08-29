/**
 * Product Controller - Simple, Direct Implementation
 * 
 * This is how internal teams at Google/Atlassian/Stripe/PayPal structure controllers.
 * Clean, functional, maintainable - no over-engineering.
 */

import { Request, Response } from 'express'
import { productService } from '@ecommerce-enterprise/core'
import { responseWrapper } from '@ecommerce-enterprise/core'

// ============================================================================
// PRODUCT CONTROLLERS - Direct Implementation
// ============================================================================

export const productController = {
  // Create new product
  async createProduct(req: Request, res: Response) {
    try {
      const result = await productService.createProduct(req.body)
      return responseWrapper.created(res, result, 'Product created successfully')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to create product', 400, error as string)
    }
  },

  // Get product by ID
  async getProduct(req: Request, res: Response) {
    try {
      const { id } = req.params
      if (!id) {
        return responseWrapper.error(res, 'Product ID is required', 400)
      }
      
      const product = await productService.getProductById(id)
      
      if (!product) {
        return responseWrapper.error(res, 'Product not found', 404)
      }
      
      return responseWrapper.success(res, product, 'Product retrieved successfully')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to get product', 500, error as string)
    }
  },

  // Get product by SKU
  async getProductBySKU(req: Request, res: Response) {
    try {
      const { sku } = req.params
      if (!sku) {
        return responseWrapper.error(res, 'Product SKU is required', 400)
      }
      
      const product = await productService.getProductBySKU(sku)
      
      if (!product) {
        return responseWrapper.error(res, 'Product not found', 404)
      }
      
      return responseWrapper.success(res, product, 'Product retrieved successfully')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to get product', 500, error as string)
    }
  },

  // Update product
  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params
      if (!id) {
        return responseWrapper.error(res, 'Product ID is required', 400)
      }
      
      const result = await productService.updateProduct(id, req.body)
      return responseWrapper.success(res, result, 'Product updated successfully')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to update product', 400, error as string)
    }
  },

  // Delete product
  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params
      if (!id) {
        return responseWrapper.error(res, 'Product ID is required', 400)
      }
      
      await productService.deleteProduct(id)
      return responseWrapper.success(res, null, 'Product deleted successfully')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to delete product', 400, error as string)
    }
  },

  // List products
  async listProducts(req: Request, res: Response) {
    try {
      const filters = req.query
      const result = await productService.listProducts(filters)
      return responseWrapper.success(res, result, 'Products retrieved successfully')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to list products', 500, error as string)
    }
  },

  // Search products
  async searchProducts(req: Request, res: Response) {
    try {
      const { q: query, ...filters } = req.query
      
      if (!query || typeof query !== 'string') {
        return responseWrapper.error(res, 'Search query is required', 400)
      }
      
      const result = await productService.searchProducts(query, filters)
      return responseWrapper.success(res, result, 'Products search completed')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to search products', 500, error as string)
    }
  },

  // Get products by category
  async getProductsByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params
      if (!category) {
        return responseWrapper.error(res, 'Category is required', 400)
      }
      
      const filters = req.query
      const result = await productService.getProductsByCategory(category, filters)
      return responseWrapper.success(res, result, 'Products by category retrieved')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to get products by category', 500, error as string)
    }
  },

  // Get active products
  async getActiveProducts(req: Request, res: Response) {
    try {
      const filters = req.query
      const result = await productService.getActiveProducts(filters)
      return responseWrapper.success(res, result, 'Active products retrieved')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to get active products', 500, error as string)
    }
  },

  // Update product stock
  async updateProductStock(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { quantity, operation } = req.body
      
      if (!id) {
        return responseWrapper.error(res, 'Product ID is required', 400)
      }
      
      if (!quantity || !operation || !['add', 'subtract'].includes(operation)) {
        return responseWrapper.error(res, 'Quantity and operation (add/subtract) are required', 400)
      }
      
      const result = await productService.updateProductStock(id, quantity, operation)
      return responseWrapper.success(res, result, 'Product stock updated successfully')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to update product stock', 400, error as string)
    }
  },

  // Get product statistics
  async getProductStats(req: Request, res: Response) {
    try {
      const stats = await productService.getProductStats()
      return responseWrapper.success(res, stats, 'Product statistics retrieved')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to get product statistics', 500, error as string)
    }
  },

  // Get categories
  async getCategories(req: Request, res: Response) {
    try {
      const categories = await productService.getCategories()
      return responseWrapper.success(res, categories, 'Categories retrieved')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to get categories', 500, error as string)
    }
  },

  // Get low stock products
  async getLowStockProducts(req: Request, res: Response) {
    try {
      const { threshold = 10 } = req.query
      const thresholdNum = typeof threshold === 'string' ? parseInt(threshold, 10) : 10
      const products = await productService.getLowStockProducts(thresholdNum)
      return responseWrapper.success(res, products, 'Low stock products retrieved')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to get low stock products', 500, error as string)
    }
  },

  // Bulk update products
  async bulkUpdateProducts(req: Request, res: Response) {
    try {
      const { updates } = req.body
      
      if (!Array.isArray(updates)) {
        return responseWrapper.error(res, 'Updates array is required', 400)
      }
      
      const result = await productService.bulkUpdateProducts(updates)
      return responseWrapper.success(res, result, 'Products bulk updated successfully')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to bulk update products', 400, error as string)
    }
  },

  // Validate product availability
  async validateProductAvailability(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { quantity } = req.query
      
      if (!id) {
        return responseWrapper.error(res, 'Product ID is required', 400)
      }
      
      if (!quantity || typeof quantity !== 'string') {
        return responseWrapper.error(res, 'Quantity is required', 400)
      }
      
      const quantityNum = parseInt(quantity, 10)
      const isAvailable = await productService.validateProductAvailability(id, quantityNum)
      
      return responseWrapper.success(res, { isAvailable }, 'Product availability validated')
    } catch (error) {
      return responseWrapper.error(res, 'Failed to validate product availability', 500, error as string)
    }
  }
}
