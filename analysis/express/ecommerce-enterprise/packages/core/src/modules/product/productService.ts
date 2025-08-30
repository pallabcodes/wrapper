/**
 * Product Service - Functional Programming Approach
 * 
 * Core business logic for product operations using functional programming patterns.
 */

import { AppError, ErrorCode } from '../../errors/AppError'
import { logger } from '../../utils/logger'
import type { 
  Product, 
  CreateProductData, 
  UpdateProductData, 
  ProductFilters,
  ProductSearchResult 
} from './productTypes'
import {
  createProduct,
  updateProduct,
  filterProducts,
  paginateProducts,
  sortProducts,
  validateProductData,
  calculateProductStats,
  checkStockAvailability,
  updateStock
} from './productUtils'

// In-memory storage for demo (replace with database in production)
const products: Map<string, Product> = new Map()

// Test utilities for clearing storage
export const clearProductStorage = (): void => {
  products.clear()
}

// ============================================================================
// CORE PRODUCT FUNCTIONS
// ============================================================================

// Functional utility for finding product by ID
const findProductById = (id: string): Product | undefined => products.get(id)

// Functional utility for finding product by SKU
const findProductBySKU = (sku: string): Product | undefined => 
  Array.from(products.values()).find(p => p.sku === sku)

// Functional utility for storing product
const storeProduct = (product: Product): void => {
  products.set(product.id, product)
}

// Functional utility for removing product
const removeProduct = (id: string): void => {
  products.delete(id)
}

// ============================================================================
// PRODUCT SERVICE METHODS
// ============================================================================

export const productService = {
  // Create new product
  async createProduct(data: CreateProductData): Promise<Product> {
    // Validate input data
    const validationErrors = validateProductData(data)
    if (validationErrors.length > 0) {
      throw new AppError(`Validation failed: ${validationErrors.join(', ')}`, ErrorCode.VALIDATION_ERROR)
    }

    // Check if SKU already exists
    if (data.sku && findProductBySKU(data.sku)) {
      throw new AppError('Product with this SKU already exists', ErrorCode.CONFLICT)
    }

    const product = createProduct(data)
    storeProduct(product)
    
    logger.info('Product created', { productId: product.id, sku: product.sku })
    return product
  },

  // Get product by ID
  async getProductById(id: string): Promise<Product | null> {
    const product = findProductById(id)
    if (!product) {
      return null
    }
    return product
  },

  // Get product by SKU
  async getProductBySKU(sku: string): Promise<Product | null> {
    const product = findProductBySKU(sku)
    if (!product) {
      return null
    }
    return product
  },

  // Update product
  async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    const existingProduct = findProductById(id)
    if (!existingProduct) {
      throw new AppError('Product not found', ErrorCode.NOT_FOUND)
    }

    // Check if new SKU conflicts with existing product
    if (data.sku && data.sku !== existingProduct.sku) {
      const skuConflict = findProductBySKU(data.sku)
      if (skuConflict) {
        throw new AppError('Product with this SKU already exists', ErrorCode.CONFLICT)
      }
    }

    const updatedProduct = updateProduct(existingProduct, data)
    storeProduct(updatedProduct)
    
    logger.info('Product updated', { productId: id, sku: updatedProduct.sku })
    return updatedProduct
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    const product = findProductById(id)
    if (!product) {
      throw new AppError('Product not found', ErrorCode.NOT_FOUND)
    }

    removeProduct(id)
    logger.info('Product deleted', { productId: id, sku: product.sku })
  },

  // List products with filtering and pagination
  async listProducts(filters: ProductFilters = {}): Promise<ProductSearchResult> {
    let allProducts = Array.from(products.values())
    
    // Apply filters
    if (Object.keys(filters).length > 0) {
      allProducts = filterProducts(allProducts, filters)
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'createdAt'
    const sortOrder = filters.sortOrder || 'desc'
    allProducts = sortProducts(allProducts, sortBy, sortOrder)

    // Apply pagination
    const limit = filters.limit || 20
    const offset = filters.offset || 0
    const result = paginateProducts(allProducts, limit, offset)

    return result
  },

  // Search products
  async searchProducts(query: string, filters: ProductFilters = {}): Promise<ProductSearchResult> {
    const searchFilters = { ...filters, search: query }
    return this.listProducts(searchFilters)
  },

  // Get products by category
  async getProductsByCategory(category: string, filters: ProductFilters = {}): Promise<ProductSearchResult> {
    const categoryFilters = { ...filters, category }
    return this.listProducts(categoryFilters)
  },

  // Get active products
  async getActiveProducts(filters: ProductFilters = {}): Promise<ProductSearchResult> {
    const activeFilters = { ...filters, isActive: true }
    return this.listProducts(activeFilters)
  },

  // Update product stock
  async updateProductStock(id: string, quantity: number, operation: 'add' | 'subtract'): Promise<Product> {
    const product = findProductById(id)
    if (!product) {
      throw new AppError('Product not found', ErrorCode.NOT_FOUND)
    }

    if (operation === 'subtract' && product.stockQuantity < quantity) {
      throw new AppError('Insufficient stock', ErrorCode.VALIDATION_ERROR)
    }

    const updatedProduct = updateStock(product, quantity, operation)
    storeProduct(updatedProduct)
    
    logger.info('Product stock updated', { 
      productId: id, 
      operation, 
      quantity, 
      newStock: updatedProduct.stockQuantity 
    })
    
    return updatedProduct
  },

  // Get product statistics
  async getProductStats(): Promise<ReturnType<typeof calculateProductStats>> {
    const allProducts = Array.from(products.values())
    return calculateProductStats(allProducts)
  },

  // Get categories
  async getCategories(): Promise<string[]> {
    const allProducts = Array.from(products.values())
    const categories = [...new Set(allProducts.map(p => p.category))]
    return categories.sort()
  },

  // Get products with low stock
  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    const allProducts = Array.from(products.values())
    return allProducts.filter(p => p.isActive && p.stockQuantity <= threshold)
  },

  // Bulk update products
  async bulkUpdateProducts(updates: Array<{ id: string; data: UpdateProductData }>): Promise<Product[]> {
    const updatedProducts: Product[] = []

    for (const update of updates) {
      try {
        const product = await this.updateProduct(update.id, update.data)
        updatedProducts.push(product)
      } catch (error) {
        logger.error('Failed to update product in bulk operation', { 
          productId: update.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
        // Continue with other updates even if one fails
      }
    }

    return updatedProducts
  },

  // Validate product availability
  async validateProductAvailability(id: string, requestedQuantity: number): Promise<boolean> {
    const product = findProductById(id)
    if (!product) {
      return false
    }
    return checkStockAvailability(product, requestedQuantity)
  }
}
