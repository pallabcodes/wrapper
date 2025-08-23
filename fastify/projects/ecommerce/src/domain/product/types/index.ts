/**
 * Product Domain Types
 * 
 * Value objects and schemas for the product domain
 * Pure functional approach with strict typing
 */

import { z } from 'zod'

// ============================================================================
// VALUE OBJECTS
// ============================================================================

export const ProductIdSchema = z.string().uuid()
export type ProductId = z.infer<typeof ProductIdSchema>

export const SkuSchema = z.string().min(3).max(50).regex(/^[A-Z0-9-]+$/)
export type Sku = z.infer<typeof SkuSchema>

export const PriceSchema = z.object({
  amount: z.number().positive().max(999999.99),
  currency: z.string().length(3).toUpperCase()
})
export type Price = z.infer<typeof PriceSchema>

export const ProductStatusSchema = z.enum(['draft', 'active', 'inactive', 'discontinued', 'out_of_stock'])
export type ProductStatus = z.infer<typeof ProductStatusSchema>

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100)
})
export type Category = z.infer<typeof CategorySchema>

export const TagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
})
export type Tag = z.infer<typeof TagSchema>

export const WeightSchema = z.object({
  value: z.number().positive(),
  unit: z.enum(['g', 'kg', 'oz', 'lb'])
})
export type Weight = z.infer<typeof WeightSchema>

export const DimensionsSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  unit: z.enum(['cm', 'in', 'mm'])
})
export type Dimensions = z.infer<typeof DimensionsSchema>

export const InventorySchema = z.object({
  stockQuantity: z.number().int().min(0),
  reservedQuantity: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).default(10),
  maxStockLevel: z.number().int().positive().optional(),
  trackInventory: z.boolean().default(true),
  allowBackorder: z.boolean().default(false),
  lastStockUpdate: z.date()
}).transform(data => ({
  ...data,
  reservedQuantity: data.reservedQuantity ?? 0,
  reorderLevel: data.reorderLevel ?? 10,
  trackInventory: data.trackInventory ?? true,
  allowBackorder: data.allowBackorder ?? false
}))

export type Inventory = {
  stockQuantity: number
  reservedQuantity: number
  reorderLevel: number
  maxStockLevel?: number | undefined
  trackInventory: boolean
  allowBackorder: boolean
  lastStockUpdate: Date
}

export const ProductImageSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  alt: z.string().min(1).max(255),
  caption: z.string().max(500).optional(),
  isPrimary: z.boolean().default(false),
  order: z.number().int().min(0).default(0)
})
export type ProductImage = z.infer<typeof ProductImageSchema>

export const ProductVariantSchema = z.object({
  id: z.string().uuid(),
  sku: SkuSchema,
  name: z.string().min(1).max(255),
  price: PriceSchema,
  weight: WeightSchema.optional(),
  dimensions: DimensionsSchema.optional(),
  inventory: InventorySchema,
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({})
})
export type ProductVariant = z.infer<typeof ProductVariantSchema>

export const ProductSchema = z.object({
  id: ProductIdSchema,
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  sku: SkuSchema,
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(500).optional(),
  price: PriceSchema,
  compareAtPrice: PriceSchema.optional(),
  costPrice: PriceSchema.optional(),
  status: ProductStatusSchema,
  category: CategorySchema,
  tags: z.array(TagSchema).default([]),
  images: z.array(ProductImageSchema).default([]),
  variants: z.array(ProductVariantSchema).default([]),
  inventory: InventorySchema,
  weight: WeightSchema.optional(),
  dimensions: DimensionsSchema.optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.array(z.string()).default([]),
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  requiresShipping: z.boolean().default(true),
  isTaxable: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  publishedAt: z.date().optional()
})

export type Product = z.infer<typeof ProductSchema>

// ============================================================================
// COMMAND TYPES
// ============================================================================

export interface CreateProductCommand {
  name: string
  sku: string
  price: Price
  category: Category
  description?: string
  shortDescription?: string
  compareAtPrice?: Price
  costPrice?: Price
  tags?: Tag[]
  images?: ProductImage[]
  variants?: ProductVariant[]
  inventory?: Partial<Inventory>
  weight?: Weight
  dimensions?: Dimensions
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  isVisible?: boolean
  isFeatured?: boolean
  requiresShipping?: boolean
  isTaxable?: boolean
}

export interface UpdateProductCommand {
  id: ProductId
  name?: string
  sku?: string
  price?: Price
  category?: Category
  description?: string
  shortDescription?: string
  compareAtPrice?: Price
  costPrice?: Price
  tags?: Tag[]
  images?: ProductImage[]
  variants?: ProductVariant[]
  inventory?: Partial<Inventory>
  weight?: Weight
  dimensions?: Dimensions
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  isVisible?: boolean
  isFeatured?: boolean
  requiresShipping?: boolean
  isTaxable?: boolean
}

export interface ChangeProductStatusCommand {
  id: ProductId
  newStatus: ProductStatus
}

export interface UpdateInventoryCommand {
  id: ProductId
  stockQuantity: number
  reservedQuantity?: number
  reorderLevel?: number
  maxStockLevel?: number
  trackInventory?: boolean
  allowBackorder?: boolean
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ProductAggregate = {
  id: ProductId
  version: number
  state: Product
  events: ProductEvent[]
}

import type { 
  ProductCreatedEvent,
  ProductUpdatedEvent,
  ProductStatusChangedEvent,
  ProductInventoryUpdatedEvent
} from '../events/index.js'

export type ProductEvent = 
  | ProductCreatedEvent
  | ProductUpdatedEvent
  | ProductStatusChangedEvent
  | ProductInventoryUpdatedEvent
