/**
 * Product Domain - Functional Implementation (Fixed)
 * 
 * Pure functional domain model for products using DDD patterns.
 * Zero OOP, immutable data structures, event sourcing ready.
 */

import { z } from 'zod'
import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import * as TE from 'fp-ts/lib/TaskEither'
import { 
  createAggregateRoot,
  applyEvent,
  createValidationError,
  createBusinessRuleError,
  validateWith,
  validateBusinessRule,
  type DomainError,
  type DomainEvent,
  type AggregateRoot,
  type DomainResult,
  type AsyncResult
} from '@/shared/functionalArchitecture.js'

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
  maxStockLevel?: number
  trackInventory: boolean
  allowBackorder: boolean
  lastStockUpdate: Date
}

export const ProductImageSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  altText: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0)
})
export type ProductImage = z.infer<typeof ProductImageSchema>

export const SeoSchema = z.object({
  title: z.string().max(60).optional(),
  description: z.string().max(160).optional(),
  keywords: z.array(z.string()).default([]),
  canonicalUrl: z.string().url().optional(),
  noIndex: z.boolean().default(false),
  noFollow: z.boolean().default(false)
})
export type Seo = z.infer<typeof SeoSchema>

// ============================================================================
// PRODUCT AGGREGATE STATE
// ============================================================================

export const ProductStateSchema = z.object({
  id: ProductIdSchema,
  sku: SkuSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(500).optional(),
  slug: z.string().min(1).max(255),
  status: ProductStatusSchema,
  price: PriceSchema,
  compareAtPrice: PriceSchema.optional(),
  cost: PriceSchema.optional(),
  inventory: InventorySchema,
  dimensions: DimensionsSchema.optional(),
  weight: WeightSchema.optional(),
  categories: z.array(CategorySchema).default([]),
  tags: z.array(TagSchema).default([]),
  images: z.array(ProductImageSchema).default([]),
  attributes: z.record(z.string()).default({}),
  seo: SeoSchema.optional(),
  isFeatured: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  requiresShipping: z.boolean().default(true),
  taxable: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  publishedAt: z.date().optional()
})

export type ProductState = z.infer<typeof ProductStateSchema>

// ============================================================================
// DOMAIN EVENTS - Properly typed to extend DomainEvent
// ============================================================================

export type ProductEvent = DomainEvent & {
  aggregateType: 'Product'
  payload: {
    productId: string
    [key: string]: unknown
  }
}

// Event constructors that create proper DomainEvents
export const createProductEvent = (
  type: string,
  aggregateId: string,
  version: number,
  payload: Record<string, unknown>
): ProductEvent => ({
  id: crypto.randomUUID(),
  type,
  aggregateId,
  aggregateType: 'Product',
  version,
  occurredAt: new Date(),
  payload: {
    productId: aggregateId,
    ...payload
  },
  metadata: {}
})

// ============================================================================
// BUSINESS RULES (Pure Functions)
// ============================================================================

export const validateProductName = (name: string): DomainResult<string> =>
  pipe(
    validateWith(z.string().min(1).max(255))(name),
    E.chain(validName =>
      pipe(
        validateBusinessRule(
          'unique-product-name',
          validName.length >= 3,
          'Product name must be at least 3 characters long'
        ),
        E.map(() => validName)
      )
    )
  )

export const validateSku = (sku: string): DomainResult<Sku> =>
  pipe(
    validateWith(SkuSchema)(sku),
    E.chain(validSku =>
      pipe(
        validateBusinessRule(
          'sku-format',
          /^[A-Z0-9-]+$/.test(validSku),
          'SKU must contain only uppercase letters, numbers, and hyphens'
        ),
        E.map(() => validSku)
      )
    )
  )

export const validatePrice = (price: Price): DomainResult<Price> =>
  pipe(
    validateWith(PriceSchema)(price),
    E.chain(validPrice =>
      pipe(
        validateBusinessRule(
          'positive-price',
          validPrice.amount > 0,
          'Price must be positive',
          { price: validPrice }
        ),
        E.map(() => validPrice)
      )
    )
  )

export const validateInventory = (inventory: Inventory): DomainResult<Inventory> => {
  const transformed: Inventory = {
    stockQuantity: inventory.stockQuantity,
    reservedQuantity: inventory.reservedQuantity ?? 0,
    reorderLevel: inventory.reorderLevel ?? 10,
    trackInventory: inventory.trackInventory ?? true,
    allowBackorder: inventory.allowBackorder ?? false,
    lastStockUpdate: inventory.lastStockUpdate,
    ...(inventory.maxStockLevel !== undefined && { maxStockLevel: inventory.maxStockLevel })
  }
  
  return pipe(
    validateBusinessRule(
      'reserved-not-exceed-stock',
      transformed.reservedQuantity <= transformed.stockQuantity,
      'Reserved quantity cannot exceed stock quantity',
      { inventory: transformed }
    ),
    E.map(() => transformed)
  )
}

export const canActivateProduct = (product: ProductState): DomainResult<ProductState> =>
  pipe(
    validateBusinessRule(
      'has-name',
      product.name.length > 0,
      'Product must have a name to be activated'
    ),
    E.chain(() =>
      validateBusinessRule(
        'has-price',
        product.price.amount > 0,
        'Product must have a positive price to be activated'
      )
    ),
    E.chain(() =>
      validateBusinessRule(
        'has-images',
        product.images.length > 0,
        'Product must have at least one image to be activated'
      )
    ),
    E.map(() => product)
  )

export const canDeactivateProduct = (product: ProductState): DomainResult<ProductState> =>
  pipe(
    validateBusinessRule(
      'not-already-inactive',
      product.status !== 'inactive',
      'Product is already inactive'
    ),
    E.map(() => product)
  )

export const calculateAvailableStock = (inventory: { stockQuantity: number; reservedQuantity?: number }): number =>
  Math.max(0, inventory.stockQuantity - (inventory.reservedQuantity ?? 0))

// ============================================================================
// AGGREGATE BEHAVIOR
// ============================================================================

export type ProductAggregate = AggregateRoot<ProductState, ProductEvent>

// Product state evolution function
export const evolveProductState = (state: ProductState, event: ProductEvent): ProductState => {
  switch (event.type) {
    case 'ProductCreated':
      return state
    
    case 'ProductUpdated':
      return {
        ...state,
        ...event.payload.changes as Partial<ProductState>,
        updatedAt: event.occurredAt
      }
    
    case 'ProductStatusChanged':
      return {
        ...state,
        status: event.payload.newStatus as ProductStatus,
        updatedAt: event.occurredAt,
        publishedAt: event.payload.newStatus === 'active' ? event.occurredAt : state.publishedAt
      }
    
    case 'ProductInventoryUpdated':
      return {
        ...state,
        inventory: {
          ...state.inventory,
          stockQuantity: event.payload.newQuantity as number,
          lastStockUpdate: event.occurredAt
        },
        updatedAt: event.occurredAt
      }
    
    case 'ProductPriceChanged':
      return {
        ...state,
        price: event.payload.newPrice as Price,
        updatedAt: event.occurredAt
      }
    
    default:
      return state
  }
}

// ============================================================================
// COMMANDS
// ============================================================================

export interface CreateProductCommand {
  id: string
  name: string
  sku: string
  price: Price
  inventory: Inventory
  createdBy: string
}

export interface UpdateProductCommand {
  productId: string
  changes: Partial<ProductState>
  updatedBy: string
}

export interface ChangeProductStatusCommand {
  productId: string
  newStatus: ProductStatus
  changedBy: string
}

export interface UpdateInventoryCommand {
  productId: string
  quantity: number
  reason: 'sale' | 'restock' | 'adjustment' | 'return'
  updatedBy: string
}

// ============================================================================
// COMMAND HANDLERS
// ============================================================================

export const createProduct = (command: CreateProductCommand): DomainResult<ProductAggregate> => {
  const now = new Date()
  
  return pipe(
    E.Do,
    E.bind('validatedName', () => validateProductName(command.name)),
    E.bind('validatedSku', () => validateSku(command.sku)),
    E.bind('validatedPrice', () => validatePrice(command.price)),
    E.bind('validatedInventory', () => validateInventory(command.inventory)),
    E.map(({ validatedName, validatedSku, validatedPrice, validatedInventory }) => {
      const initialState: ProductState = {
        id: command.id,
        sku: validatedSku,
        name: validatedName,
        slug: validatedName.toLowerCase().replace(/\s+/g, '-'),
        status: 'draft',
        price: validatedPrice,
        inventory: validatedInventory,
        categories: [],
        tags: [],
        images: [],
        attributes: {},
        isFeatured: false,
        isDigital: false,
        requiresShipping: true,
        taxable: true,
        createdAt: now,
        updatedAt: now
      }
      
      const event = createProductEvent(
        'ProductCreated',
        command.id,
        1,
        {
          name: validatedName,
          sku: validatedSku,
          price: validatedPrice,
          createdBy: command.createdBy
        }
      )
      
      const aggregate = createAggregateRoot<ProductState, ProductEvent>(
        command.id,
        initialState,
        0
      )
      
      return applyEvent(aggregate, event, evolveProductState)
    })
  )
}

export const updateProduct = (product: ProductAggregate, command: UpdateProductCommand): DomainResult<ProductAggregate> => {
  return pipe(
    validateBusinessRule(
      'product-exists',
      product.state.id === command.productId,
      'Product not found'
    ),
    E.map(() => {
      const now = new Date()
      const event = createProductEvent(
        'ProductUpdated',
        command.productId,
        product.version + 1,
        {
          changes: command.changes,
          updatedBy: command.updatedBy
        }
      )
      
      return applyEvent(product, event, evolveProductState)
    })
  )
}

export const changeProductStatus = (product: ProductAggregate, command: ChangeProductStatusCommand): DomainResult<ProductAggregate> => {
  return pipe(
    validateBusinessRule(
      'different-status',
      product.state.status !== command.newStatus,
      'Product already has this status'
    ),
    E.chain(() => 
      command.newStatus === 'active'
        ? canActivateProduct(product.state)
        : command.newStatus === 'inactive'
        ? canDeactivateProduct(product.state)
        : E.right(product.state)
    ),
    E.map(() => {
      const event = createProductEvent(
        'ProductStatusChanged',
        command.productId,
        product.version + 1,
        {
          oldStatus: product.state.status,
          newStatus: command.newStatus,
          changedBy: command.changedBy
        }
      )
      
      return applyEvent(product, event, evolveProductState)
    })
  )
}

export const updateInventory = (product: ProductAggregate, command: UpdateInventoryCommand): DomainResult<ProductAggregate> => {
  return pipe(
    validateBusinessRule(
      'valid-quantity',
      command.quantity >= 0,
      'Inventory quantity cannot be negative'
    ),
    E.map(() => {
      const oldQuantity = product.state.inventory.stockQuantity
      const event = createProductEvent(
        'ProductInventoryUpdated',
        command.productId,
        product.version + 1,
        {
          oldQuantity,
          newQuantity: command.quantity,
          reason: command.reason,
          updatedBy: command.updatedBy
        }
      )
      
      return applyEvent(product, event, evolveProductState)
    })
  )
}

// ============================================================================
// HELPERS AND UTILITIES
// ============================================================================

export const generateSku = (name: string, id: string): string => {
  const namePrefix = name.replace(/[^A-Z0-9]/gi, '').toUpperCase().substring(0, 6)
  const idSuffix = id.replace(/-/g, '').substring(0, 6).toUpperCase()
  return `${namePrefix}-${idSuffix}`
}

export const calculateDiscountedPrice = (price: Price, discountPercent: number): Price => ({
  ...price,
  amount: Math.round(price.amount * (1 - discountPercent / 100) * 100) / 100
})

export const isProductAvailable = (product: ProductState): boolean =>
  product.status === 'active' && 
  calculateAvailableStock(product.inventory) > 0

export const needsRestock = (inventory: Inventory): boolean =>
  inventory.trackInventory && inventory.stockQuantity <= inventory.reorderLevel
