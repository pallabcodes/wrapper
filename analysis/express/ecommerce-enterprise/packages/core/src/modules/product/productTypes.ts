/**
 * Product Types - Functional Programming Approach
 * 
 * Type definitions for the product module using functional programming patterns.
 */

import { z } from 'zod'

// ============================================================================
// CORE PRODUCT TYPES
// ============================================================================

export interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  category: string
  sku: string
  stockQuantity: number
  isActive: boolean
  images: string[]
  tags: string[]
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface CreateProductData {
  name: string
  description: string
  price: number
  currency: string
  category: string
  sku: string
  stockQuantity: number
  images?: string[]
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface UpdateProductData {
  name?: string
  description?: string
  price?: number
  currency?: string
  category?: string
  sku?: string
  stockQuantity?: number
  isActive?: boolean
  images?: string[]
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  isActive?: boolean
  tags?: string[]
  search?: string
  limit?: number
  offset?: number
}

export interface ProductSearchResult {
  products: Product[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

// Schemas moved to productSchemas.ts for consistency with auth module

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ProductResponse {
  success: boolean
  message: string
  data: Product | Product[] | ProductSearchResult | null
  timestamp: string
  meta: {
    version: string
    environment: string
  }
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export enum ProductErrorCode {
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  PRODUCT_ALREADY_EXISTS = 'PRODUCT_ALREADY_EXISTS',
  INVALID_PRODUCT_DATA = 'INVALID_PRODUCT_DATA',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  PRODUCT_INACTIVE = 'PRODUCT_INACTIVE'
}

export interface ProductError {
  code: ProductErrorCode
  message: string
  details?: Record<string, unknown>
}
