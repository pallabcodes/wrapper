/**
 * Product Utilities - Functional Programming Approach
 * 
 * Utility functions for product operations using functional programming patterns.
 */

import crypto from 'crypto'
import type { 
  Product, 
  CreateProductData, 
  UpdateProductData, 
  ProductFilters,
  ProductSearchResult 
} from './productTypes'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Functional utility for generating unique IDs
export const generateProductId = (): string => crypto.randomUUID()

// Functional utility for generating SKU
export const generateSKU = (category: string, name: string): string => {
  const prefix = category.substring(0, 3).toUpperCase()
  const nameCode = name.substring(0, 3).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${nameCode}-${random}`
}

// Functional utility for creating product object
export const createProduct = (data: CreateProductData): Product => {
  const now = new Date()
  return {
    id: generateProductId(),
    name: data.name,
    description: data.description,
    price: data.price,
    currency: data.currency,
    category: data.category,
    sku: data.sku || generateSKU(data.category, data.name),
    stockQuantity: data.stockQuantity,
    isActive: true,
    images: data.images || [],
    tags: data.tags || [],
    metadata: data.metadata || {},
    createdAt: now,
    updatedAt: now
  }
}

// Functional utility for updating product
export const updateProduct = (product: Product, data: UpdateProductData): Product => {
  return {
    ...product,
    ...(data.name && { name: data.name }),
    ...(data.description && { description: data.description }),
    ...(data.price !== undefined && { price: data.price }),
    ...(data.currency && { currency: data.currency }),
    ...(data.category && { category: data.category }),
    ...(data.sku && { sku: data.sku }),
    ...(data.stockQuantity !== undefined && { stockQuantity: data.stockQuantity }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
    ...(data.images && { images: data.images }),
    ...(data.tags && { tags: data.tags }),
    ...(data.metadata && { metadata: { ...product.metadata, ...data.metadata } }),
    updatedAt: new Date()
  }
}

// Functional utility for filtering products
export const filterProducts = (products: Product[], filters: ProductFilters): Product[] => {
  return products.filter(product => {
    // Category filter
    if (filters.category && product.category !== filters.category) {
      return false
    }

    // Price range filter
    if (filters.minPrice && product.price < filters.minPrice) {
      return false
    }
    if (filters.maxPrice && product.price > filters.maxPrice) {
      return false
    }

    // Active status filter
    if (filters.isActive !== undefined && product.isActive !== filters.isActive) {
      return false
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => product.tags.includes(tag))
      if (!hasMatchingTag) {
        return false
      }
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const matchesName = product.name.toLowerCase().includes(searchTerm)
      const matchesDescription = product.description.toLowerCase().includes(searchTerm)
      const matchesSKU = product.sku.toLowerCase().includes(searchTerm)
      
      if (!matchesName && !matchesDescription && !matchesSKU) {
        return false
      }
    }

    return true
  })
}

// Functional utility for paginating products
export const paginateProducts = (
  products: Product[], 
  limit: number = 20, 
  offset: number = 0
): ProductSearchResult => {
  const total = products.length
  const paginatedProducts = products.slice(offset, offset + limit)
  const page = Math.floor(offset / limit) + 1
  const hasMore = offset + limit < total

  return {
    products: paginatedProducts,
    total,
    page,
    limit,
    hasMore
  }
}

// Functional utility for sorting products
export const sortProducts = (products: Product[], sortBy: string = 'createdAt', order: 'asc' | 'desc' = 'desc'): Product[] => {
  return [...products].sort((a, b) => {
    let aValue: any = a[sortBy as keyof Product]
    let bValue: any = b[sortBy as keyof Product]

    // Handle date sorting
    if (aValue instanceof Date && bValue instanceof Date) {
      aValue = aValue.getTime()
      bValue = bValue.getTime()
    }

    // Handle string sorting
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (order === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
    }
  })
}

// Functional utility for validating product data
export const validateProductData = (data: CreateProductData): string[] => {
  const errors: string[] = []

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Product name is required')
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push('Product description is required')
  }

  if (data.price <= 0) {
    errors.push('Product price must be positive')
  }

  if (!data.currency || data.currency.length !== 3) {
    errors.push('Currency must be 3 characters')
  }

  if (!data.category || data.category.trim().length === 0) {
    errors.push('Product category is required')
  }

  if (data.stockQuantity < 0) {
    errors.push('Stock quantity cannot be negative')
  }

  return errors
}

// Functional utility for calculating product statistics
export const calculateProductStats = (products: Product[]) => {
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.isActive).length
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0)
  const averagePrice = totalProducts > 0 ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts : 0
  const categories = [...new Set(products.map(p => p.category))]

  return {
    totalProducts,
    activeProducts,
    inactiveProducts: totalProducts - activeProducts,
    totalValue,
    averagePrice,
    uniqueCategories: categories.length,
    categories
  }
}

// Functional utility for checking stock availability
export const checkStockAvailability = (product: Product, requestedQuantity: number): boolean => {
  return product.isActive && product.stockQuantity >= requestedQuantity
}

// Functional utility for updating stock
export const updateStock = (product: Product, quantity: number, operation: 'add' | 'subtract'): Product => {
  const newStock = operation === 'add' 
    ? product.stockQuantity + quantity 
    : Math.max(0, product.stockQuantity - quantity)

  return {
    ...product,
    stockQuantity: newStock,
    updatedAt: new Date()
  }
}
