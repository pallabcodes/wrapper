/**
 * Product Schemas - Functional Programming Approach
 * 
 * Zod schemas for product validation and Swagger documentation.
 * Following the same pattern as auth module.
 */

const { z } = require('zod')

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().min(1, 'Product description is required').max(2000),
  price: z.number().positive('Price must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  category: z.string().min(1, 'Category is required'),
  sku: z.string().min(1, 'SKU is required').max(50),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be non-negative'),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional()
})

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  price: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  category: z.string().min(1).optional(),
  sku: z.string().min(1).max(50).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional()
})

export const productFiltersSchema = z.object({
  category: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

export const productIdSchema = z.object({
  id: z.string().uuid('Invalid product ID')
})

export const productStockUpdateSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
  operation: z.enum(['add', 'subtract'], {
    errorMap: () => ({ message: 'Operation must be either "add" or "subtract"' })
  })
})

export const bulkProductUpdateSchema = z.object({
  updates: z.array(z.object({
    id: z.string().uuid('Invalid product ID'),
    data: updateProductSchema
  })).min(1, 'At least one update is required').max(100, 'Maximum 100 updates allowed')
})

export const productSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  ...productFiltersSchema.shape
})

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

export const productResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
  timestamp: z.string(),
  meta: z.object({
    version: z.string(),
    environment: z.string()
  })
})

export const productListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    products: z.array(z.any()),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    hasMore: z.boolean()
  }),
  timestamp: z.string(),
  meta: z.object({
    version: z.string(),
    environment: z.string()
  })
})

export const productStatsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    totalProducts: z.number(),
    activeProducts: z.number(),
    inactiveProducts: z.number(),
    totalValue: z.number(),
    averagePrice: z.number(),
    uniqueCategories: z.number(),
    categories: z.array(z.string())
  }),
  timestamp: z.string(),
  meta: z.object({
    version: z.string(),
    environment: z.string()
  })
})
