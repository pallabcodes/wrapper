/**
 * Product Controller - Business Logic Layer
 * 
 * Pure business logic for product operations.
 * Following internal team patterns for enterprise applications.
 */

import { productService } from './productService'
import type { 
  CreateProductData, 
  UpdateProductData, 
  ProductFilters,
  Product 
} from './productTypes'

// ============================================================================
// CORE PRODUCT CONTROLLERS - Pure Business Logic
// ============================================================================

export const productController = {
  // Create new product
  async createProduct(data: CreateProductData): Promise<Product> {
    return await productService.createProduct(data)
  },

  // Get product by ID
  async getProductById(id: string): Promise<Product | null> {
    return await productService.getProductById(id)
  },

  // Get product by SKU
  async getProductBySKU(sku: string): Promise<Product | null> {
    return await productService.getProductBySKU(sku)
  },

  // Update product
  async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    return await productService.updateProduct(id, data)
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    return await productService.deleteProduct(id)
  },

  // List products
  async listProducts(filters: ProductFilters = {}) {
    return await productService.listProducts(filters)
  },

  // Search products
  async searchProducts(query: string, filters: ProductFilters = {}) {
    return await productService.searchProducts(query, filters)
  },

  // Get products by category
  async getProductsByCategory(category: string, filters: ProductFilters = {}) {
    return await productService.getProductsByCategory(category, filters)
  },

  // Get active products
  async getActiveProducts(filters: ProductFilters = {}) {
    return await productService.getActiveProducts(filters)
  },

  // Update product stock
  async updateProductStock(id: string, quantity: number, operation: 'add' | 'subtract'): Promise<Product> {
    return await productService.updateProductStock(id, quantity, operation)
  },

  // Get product statistics
  async getProductStats() {
    return await productService.getProductStats()
  },

  // Get categories
  async getCategories(): Promise<string[]> {
    return await productService.getCategories()
  },

  // Get low stock products
  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    return await productService.getLowStockProducts(threshold)
  },

  // Bulk update products
  async bulkUpdateProducts(updates: Array<{ id: string; data: UpdateProductData }>): Promise<Product[]> {
    return await productService.bulkUpdateProducts(updates)
  },

  // Validate product availability
  async validateProductAvailability(id: string, requestedQuantity: number): Promise<boolean> {
    return await productService.validateProductAvailability(id, requestedQuantity)
  }
}
