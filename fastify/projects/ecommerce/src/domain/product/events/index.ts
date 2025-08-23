/**
 * Product Domain Events
 * 
 * Domain events for the product aggregate
 * Pure functional approach with immutable events
 */

import type { Event } from '../../../shared/functionalArchitecture.js'
import type { 
  ProductId, 
  Product, 
  ProductStatus, 
  Inventory,
  Price,
  Category,
  Tag,
  ProductImage,
  ProductVariant,
  Weight,
  Dimensions
} from '../types/index.js'

// ============================================================================
// PRODUCT EVENTS
// ============================================================================

export interface ProductCreatedEvent extends Event {
  type: 'ProductCreated'
  payload: {
    productId: ProductId
    name: string
    sku: string
    price: Price
    category: Category
    description?: string
    shortDescription?: string
    compareAtPrice?: Price
    costPrice?: Price
    tags: Tag[]
    images: ProductImage[]
    variants: ProductVariant[]
    inventory: Inventory
    weight?: {
      value: number
      unit: string
    }
    dimensions?: {
      length: number
      width: number
      height: number
      unit: string
    }
    seoTitle?: string
    seoDescription?: string
    seoKeywords: string[]
    isVisible: boolean
    isFeatured: boolean
    requiresShipping: boolean
    isTaxable: boolean
  }
}

export interface ProductUpdatedEvent extends Event {
  type: 'ProductUpdated'
  payload: {
    productId: ProductId
    changes: Partial<{
      name: string
      sku: string
      price: Price
      category: Category
      description: string
      shortDescription: string
      compareAtPrice: Price
      costPrice: Price
      tags: Tag[]
      images: ProductImage[]
      variants: ProductVariant[]
      inventory: Inventory
      weight: {
        value: number
        unit: string
      }
      dimensions: {
        length: number
        width: number
        height: number
        unit: string
      }
      seoTitle: string
      seoDescription: string
      seoKeywords: string[]
      isVisible: boolean
      isFeatured: boolean
      requiresShipping: boolean
      isTaxable: boolean
    }>
  }
}

export interface ProductStatusChangedEvent extends Event {
  type: 'ProductStatusChanged'
  payload: {
    productId: ProductId
    oldStatus: ProductStatus
    newStatus: ProductStatus
    reason?: string
  }
}

export interface ProductInventoryUpdatedEvent extends Event {
  type: 'ProductInventoryUpdated'
  payload: {
    productId: ProductId
    oldQuantity: number
    newQuantity: number
    reservedQuantity: number
    reorderLevel: number
    maxStockLevel?: number
    trackInventory: boolean
    allowBackorder: boolean
  }
}

export interface ProductPublishedEvent extends Event {
  type: 'ProductPublished'
  payload: {
    productId: ProductId
    publishedAt: Date
  }
}

export interface ProductUnpublishedEvent extends Event {
  type: 'ProductUnpublished'
  payload: {
    productId: ProductId
    unpublishedAt: Date
  }
}

export interface ProductDeletedEvent extends Event {
  type: 'ProductDeleted'
  payload: {
    productId: ProductId
    deletedAt: Date
    reason?: string
  }
}

export interface ProductImageAddedEvent extends Event {
  type: 'ProductImageAdded'
  payload: {
    productId: ProductId
    image: {
      id: string
      url: string
      alt: string
      caption?: string
      isPrimary: boolean
      order: number
    }
  }
}

export interface ProductImageRemovedEvent extends Event {
  type: 'ProductImageRemoved'
  payload: {
    productId: ProductId
    imageId: string
  }
}

export interface ProductVariantAddedEvent extends Event {
  type: 'ProductVariantAdded'
  payload: {
    productId: ProductId
    variant: ProductVariant
  }
}

export interface ProductVariantUpdatedEvent extends Event {
  type: 'ProductVariantUpdated'
  payload: {
    productId: ProductId
    variantId: string
    changes: Partial<ProductVariant>
  }
}

export interface ProductVariantRemovedEvent extends Event {
  type: 'ProductVariantRemoved'
  payload: {
    productId: ProductId
    variantId: string
  }
}

// ============================================================================
// EVENT UNION TYPE
// ============================================================================

export type ProductEvent = 
  | ProductCreatedEvent
  | ProductUpdatedEvent
  | ProductStatusChangedEvent
  | ProductInventoryUpdatedEvent
  | ProductPublishedEvent
  | ProductUnpublishedEvent
  | ProductDeletedEvent
  | ProductImageAddedEvent
  | ProductImageRemovedEvent
  | ProductVariantAddedEvent
  | ProductVariantUpdatedEvent
  | ProductVariantRemovedEvent

// ============================================================================
// EVENT CREATORS
// ============================================================================

export const createProductCreatedEvent = (
  productId: ProductId,
  product: Product
): ProductCreatedEvent => ({
  type: 'ProductCreated',
  id: crypto.randomUUID(),
  aggregateId: productId,
  aggregateType: 'Product' as const,
  version: 1,
  occurredAt: new Date(),
  payload: {
    productId,
    name: product.name,
    sku: product.sku,
    price: product.price,
    category: product.category,
    ...(product.description && { description: product.description }),
    ...(product.shortDescription && { shortDescription: product.shortDescription }),
    ...(product.compareAtPrice && { compareAtPrice: product.compareAtPrice }),
    ...(product.costPrice && { costPrice: product.costPrice }),
    tags: product.tags,
    images: product.images,
    variants: product.variants,
    inventory: product.inventory,
    ...(product.weight && { weight: product.weight }),
    ...(product.dimensions && { dimensions: product.dimensions }),
    ...(product.seoTitle && { seoTitle: product.seoTitle }),
    ...(product.seoDescription && { seoDescription: product.seoDescription }),
    seoKeywords: product.seoKeywords,
    isVisible: product.isVisible,
    isFeatured: product.isFeatured,
    requiresShipping: product.requiresShipping,
    isTaxable: product.isTaxable
  },
  metadata: {}
})

export const createProductUpdatedEvent = (
  productId: ProductId,
  changes: Partial<{
    name: string
    sku: string
    price: Price
    category: Category
    description: string
    shortDescription: string
    compareAtPrice: Price
    costPrice: Price
    tags: Tag[]
    images: ProductImage[]
    variants: ProductVariant[]
    inventory: Inventory
    weight: Weight
    dimensions: Dimensions
    seoTitle: string
    seoDescription: string
    seoKeywords: string[]
    isVisible: boolean
    isFeatured: boolean
    requiresShipping: boolean
    isTaxable: boolean
  }>
): ProductUpdatedEvent => ({
  type: 'ProductUpdated',
  id: crypto.randomUUID(),
  aggregateId: productId,
  aggregateType: 'Product' as const,
  version: 1,
  occurredAt: new Date(),
  payload: {
    productId,
    changes
  },
  metadata: {}
})

export const createProductStatusChangedEvent = (
  productId: ProductId,
  oldStatus: ProductStatus,
  newStatus: ProductStatus,
  reason?: string
): ProductStatusChangedEvent => {
  const payload: ProductStatusChangedEvent['payload'] = {
    productId,
    oldStatus,
    newStatus
  }

  if (reason !== undefined) {
    payload.reason = reason
  }

  return {
    type: 'ProductStatusChanged',
    id: crypto.randomUUID(),
    aggregateId: productId,
    aggregateType: 'Product' as const,
    version: 1,
    occurredAt: new Date(),
    payload,
    metadata: {}
  }
}

export const createProductInventoryUpdatedEvent = (
  productId: ProductId,
  oldQuantity: number,
  newQuantity: number,
  inventory: Inventory
): ProductInventoryUpdatedEvent => {
  const payload: ProductInventoryUpdatedEvent['payload'] = {
    productId,
    oldQuantity,
    newQuantity,
    reservedQuantity: inventory.reservedQuantity,
    reorderLevel: inventory.reorderLevel,
    trackInventory: inventory.trackInventory,
    allowBackorder: inventory.allowBackorder
  }

  if (inventory.maxStockLevel !== undefined) {
    payload.maxStockLevel = inventory.maxStockLevel
  }

  return {
    type: 'ProductInventoryUpdated',
    id: crypto.randomUUID(),
    aggregateId: productId,
    aggregateType: 'Product' as const,
    version: 1,
    occurredAt: new Date(),
    payload,
    metadata: {}
  }
}
