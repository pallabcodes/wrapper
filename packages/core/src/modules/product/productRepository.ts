/**
 * Product Repository - Functional Programming Pattern
 * 
 * Pure functions for product database operations following FP principles.
 */

import { eq, and, like, gte, lte, desc, asc, sql, count, inArray } from 'drizzle-orm'
import { products } from '../../database/schema/products'
import { 
  createRecord, 
  findRecordById, 
  findRecords, 
  updateRecord, 
  deleteRecord, 
  countRecords,
  type QueryOptions,
  type RepositoryResult 
} from '../../database/repositories/baseRepository'
import type { Product, CreateProductData, UpdateProductData, ProductFilters } from './productTypes'

// ============================================================================
// PRODUCT REPOSITORY FUNCTIONS
// ============================================================================

export const createProduct = async (data: CreateProductData): Promise<RepositoryResult<Product>> => {
  return createRecord(products, data, 'product')
}

export const findProductById = async (id: string): Promise<RepositoryResult<Product>> => {
  return findRecordById(products, id, 'product')
}

export const findProducts = async (options: QueryOptions = {}): Promise<RepositoryResult<Product[]>> => {
  return findRecords(products, options, 'product')
}

export const updateProduct = async (id: string, data: UpdateProductData): Promise<RepositoryResult<Product>> => {
  return updateRecord(products, id, data, 'product')
}

export const deleteProduct = async (id: string): Promise<RepositoryResult<void>> => {
  return deleteRecord(products, id, 'product')
}

export const countProducts = async (where?: Record<string, any>): Promise<RepositoryResult<number>> => {
  return countRecords(products, where, 'product')
}

// ============================================================================
// ADVANCED PRODUCT QUERIES
// ============================================================================

export const findProductsWithFilters = async (filters: ProductFilters): Promise<RepositoryResult<Product[]>> => {
  try {
    const startTime = Date.now()
    let query = db.select().from(products)
    const conditions: any[] = []
    
    // Apply filters
    if (filters.category) {
      conditions.push(eq(products.category, filters.category))
    }
    
    if (filters.minPrice !== undefined) {
      conditions.push(gte(products.price, filters.minPrice.toString()))
    }
    
    if (filters.maxPrice !== undefined) {
      conditions.push(lte(products.price, filters.maxPrice.toString()))
    }
    
    if (filters.isActive !== undefined) {
      conditions.push(eq(products.isActive, filters.isActive))
    }
    
    if (filters.tags && filters.tags.length > 0) {
      conditions.push(sql`${products.tags} && ${filters.tags}`)
    }
    
    if (filters.search) {
      conditions.push(
        or(
          like(products.name, `%${filters.search}%`),
          like(products.description, `%${filters.search}%`),
          like(products.sku, `%${filters.search}%`)
        )
      )
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }
    
    // Apply ordering
    if (filters.sortBy) {
      const field = products[filters.sortBy as keyof typeof products]
      if (field) {
        if (filters.sortOrder === 'desc') {
          query = query.orderBy(desc(field as any)) as any
        } else {
          query = query.orderBy(asc(field as any)) as any
        }
      }
    }
    
    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset)
    }
    
    const result = await query
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    console.log(`Found ${resultArray.length} products with filters`, { filters, duration })
    
    return { success: true, data: resultArray as Product[] }
  } catch (error) {
    console.error('Failed to find products with filters', { error, filters })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const findProductsByCategory = async (category: string): Promise<RepositoryResult<Product[]>> => {
  return findProducts({ where: { category } })
}

export const findProductsByTags = async (tags: string[]): Promise<RepositoryResult<Product[]>> => {
  try {
    const startTime = Date.now()
    const result = await db.select()
      .from(products)
      .where(sql`${products.tags} && ${tags}`)
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    console.log(`Found ${resultArray.length} products by tags`, { tags, duration })
    
    return { success: true, data: resultArray as Product[] }
  } catch (error) {
    console.error('Failed to find products by tags', { error, tags })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const findLowStockProducts = async (threshold: number = 10): Promise<RepositoryResult<Product[]>> => {
  try {
    const startTime = Date.now()
    const result = await db.select()
      .from(products)
      .where(lte(products.stockQuantity, threshold))
      .orderBy(asc(products.stockQuantity))
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    console.log(`Found ${resultArray.length} low stock products`, { threshold, duration })
    
    return { success: true, data: resultArray as Product[] }
  } catch (error) {
    console.error('Failed to find low stock products', { error, threshold })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const searchProducts = async (searchTerm: string): Promise<RepositoryResult<Product[]>> => {
  try {
    const startTime = Date.now()
    const result = await db.select()
      .from(products)
      .where(
        or(
          like(products.name, `%${searchTerm}%`),
          like(products.description, `%${searchTerm}%`),
          like(products.sku, `%${searchTerm}%`),
          like(products.category, `%${searchTerm}%`)
        )
      )
      .orderBy(desc(products.createdAt))
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    console.log(`Found ${resultArray.length} products by search`, { searchTerm, duration })
    
    return { success: true, data: resultArray as Product[] }
  } catch (error) {
    console.error('Failed to search products', { error, searchTerm })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const updateProductStock = async (id: string, quantity: number, operation: 'add' | 'subtract'): Promise<RepositoryResult<Product>> => {
  try {
    const startTime = Date.now()
    
    // Get current product
    const productResult = await findProductById(id)
    if (!productResult.success || !productResult.data) {
      return { success: false, error: 'Product not found' }
    }
    
    const currentStock = productResult.data.stockQuantity
    const newStock = operation === 'add' ? currentStock + quantity : currentStock - quantity
    
    if (newStock < 0) {
      return { success: false, error: 'Insufficient stock' }
    }
    
    // Update stock
    const result = await db.update(products)
      .set({ 
        stockQuantity: newStock,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning()
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    if (resultArray.length > 0) {
      console.log(`Updated product stock`, { 
        id, 
        operation, 
        quantity, 
        oldStock: currentStock, 
        newStock, 
        duration 
      })
      return { success: true, data: resultArray[0] as Product }
    }
    
    return { success: false, error: 'Failed to update stock' }
  } catch (error) {
    console.error('Failed to update product stock', { error, id, quantity, operation })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const getProductStats = async (): Promise<RepositoryResult<{
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  totalCategories: number
}>> => {
  try {
    const startTime = Date.now()
    
    // Get total products
    const totalResult = await countProducts()
    const totalProducts = totalResult.success ? totalResult.data || 0 : 0
    
    // Get active products
    const activeResult = await countProducts({ isActive: true })
    const activeProducts = activeResult.success ? activeResult.data || 0 : 0
    
    // Get low stock products
    const lowStockResult = await findLowStockProducts(10)
    const lowStockProducts = lowStockResult.success ? lowStockResult.data?.length || 0 : 0
    
    // Get unique categories
    const categoriesResult = await db.select({ category: products.category })
      .from(products)
      .groupBy(products.category)
    
    const totalCategories = Array.isArray(categoriesResult) ? categoriesResult.length : 0
    
    const duration = Date.now() - startTime
    console.log('Generated product stats', { duration })
    
    return {
      success: true,
      data: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        totalCategories
      }
    }
  } catch (error) {
    console.error('Failed to get product stats', { error })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Import missing dependencies
import { db } from '../../database/client'
import { or } from 'drizzle-orm'

