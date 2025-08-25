/**
 * Product Validation Schemas
 * 
 * Zod schemas for product validation and type safety
 */

import { z } from 'zod'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(10).max(5000),
  price: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CAD']),
  category: z.string().min(1).max(100),
  brand: z.string().min(1).max(100).optional(),
  sku: z.string().min(1).max(50),
  inventory: z.object({
    quantity: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0).default(10),
    trackInventory: z.boolean().default(true)
  }),
  specifications: z.record(z.string()).optional(),
  images: z.array(z.string().url()).min(1).max(10),
  tags: z.array(z.string()).max(20).default([]),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).default('draft'),
  seo: z.object({
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/).optional()
  }).optional()
})

export const UpdateProductSchema = CreateProductSchema.partial()

export const ProductQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.string().regex(/^\d+(\.\d{2})?$/).transform(Number).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d{2})?$/).transform(Number).optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  inStock: z.string().transform(val => val === 'true').optional()
})

export const UpdateInventorySchema = z.object({
  quantity: z.number().int().min(0),
  operation: z.enum(['set', 'add', 'subtract']).default('set'),
  reason: z.string().min(1).max(255).optional()
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateProductRequest = z.infer<typeof CreateProductSchema>
export type UpdateProductRequest = z.infer<typeof UpdateProductSchema>
export type ProductQuery = z.infer<typeof ProductQuerySchema>
export type UpdateInventoryRequest = z.infer<typeof UpdateInventorySchema>
