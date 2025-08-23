/**
 * Product Creation Aggregate
 * 
 * Pure functional product creation with validation
 * No fp-ts dependencies, clean functional approach
 */

import { z } from 'zod'
import { 
  createAggregateRoot,
  applyEvent,
  validateString,
  validateObject,
  validateBusinessRule,
  type AggregateRoot,
  type DomainResult,
  type AsyncResult,
  Result
} from '../../../shared/functionalArchitecture.js'
import type { 
  ProductId, 
  Product, 
  CreateProductCommand,
  ProductEvent 
} from '../types/index.js'
import { 
  createProductCreatedEvent,
  type ProductCreatedEvent 
} from '../events/index.js'

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

const validateProductName = (name: string): DomainResult<string> => {
  const validation = validateString(z.string().min(1).max(255))(name)
  if (validation.type === 'error') return validation
  
  const isValidName = /^[a-zA-Z0-9\s\-_]+$/.test(validation.value)
  if (!isValidName) {
    return Result.error('Product name contains invalid characters')
  }
  
  return Result.success(validation.value)
}

const validateSku = (sku: string): DomainResult<string> => {
  const validation = validateString(z.string().min(3).max(50).regex(/^[A-Z0-9-]+$/))(sku)
  if (validation.type === 'error') return validation
  
  const isValidSku = /^[A-Z0-9-]+$/.test(validation.value)
  if (!isValidSku) {
    return Result.error('SKU must contain only uppercase letters, numbers, and hyphens')
  }
  
  return Result.success(validation.value)
}

const validatePrice = (price: { amount: number; currency: string }): DomainResult<{ amount: number; currency: string }> => {
  const validation = validateObject<{ amount: number; currency: string }>(z.object({
    amount: z.number().positive().max(999999.99),
    currency: z.string().length(3).toUpperCase()
  }))(price)
  
  if (validation.type === 'error') return validation
  
  const isValidPrice = validation.value.amount > 0 && validation.value.amount <= 999999.99
  if (!isValidPrice) {
    return Result.error('Price must be between 0.01 and 999,999.99')
  }
  
  return Result.success(validation.value)
}

const validateInventory = (inventory: any): DomainResult<any> => {
  const validation = validateObject<any>(z.object({
    stockQuantity: z.number().int().min(0),
    reservedQuantity: z.number().int().min(0).default(0),
    reorderLevel: z.number().int().min(0).default(10),
    maxStockLevel: z.number().int().positive().optional(),
    trackInventory: z.boolean().default(true),
    allowBackorder: z.boolean().default(false),
    lastStockUpdate: z.date()
  }))(inventory)
  
  if (validation.type === 'error') return validation
  
  const typedInventory = {
    ...validation.value,
    reservedQuantity: validation.value.reservedQuantity ?? 0,
    reorderLevel: validation.value.reorderLevel ?? 10,
    trackInventory: validation.value.trackInventory ?? true,
    allowBackorder: validation.value.allowBackorder ?? false
  }
  
  const isValidInventory = typedInventory.stockQuantity >= 0 && typedInventory.reorderLevel >= 0
  if (!isValidInventory) {
    return Result.error('Stock quantity and reorder level must be non-negative')
  }
  
  return Result.success(typedInventory)
}

// ============================================================================
// BUSINESS RULES
// ============================================================================

const canActivateProduct = (product: Product): DomainResult<Product> => {
  // Check if product has a name
  if (!product.name || product.name.trim().length === 0) {
    return Result.error('Product must have a name to be activated')
  }
  
  // Check if product has a positive price
  if (!product.price || product.price.amount <= 0) {
    return Result.error('Product must have a positive price to be activated')
  }
  
  // Check if product has images
  if (!product.images || product.images.length === 0) {
    return Result.error('Product must have at least one image to be activated')
  }
  
  return Result.success(product)
}

// ============================================================================
// PRODUCT CREATION
// ============================================================================

export const createProduct = async (
  command: CreateProductCommand
): Promise<AsyncResult<AggregateRoot<Product, ProductEvent>>> => {
  try {
    // Validate all inputs
    const validatedName = validateProductName(command.name)
    if (validatedName.type === 'error') {
      return Promise.resolve(Result.error(validatedName.error))
    }

    const validatedSku = validateSku(command.sku)
    if (validatedSku.type === 'error') {
      return Promise.resolve(Result.error(validatedSku.error))
    }

    const validatedPrice = validatePrice(command.price)
    if (validatedPrice.type === 'error') {
      return Promise.resolve(Result.error(validatedPrice.error))
    }

    const validatedInventory = validateInventory(command.inventory || {
      stockQuantity: 0,
      lastStockUpdate: new Date()
    })
    if (validatedInventory.type === 'error') {
      return Promise.resolve(Result.error(validatedInventory.error))
    }

    // Create product state
    const product: Product = {
      id: crypto.randomUUID() as ProductId,
      name: validatedName.value,
      slug: validatedName.value.toLowerCase().replace(/\s+/g, '-'),
      sku: validatedSku.value,
      price: validatedPrice.value,
      category: command.category,
      description: command.description,
      shortDescription: command.shortDescription,
      compareAtPrice: command.compareAtPrice,
      costPrice: command.costPrice,
      status: 'draft',
      tags: command.tags || [],
      images: command.images || [],
      variants: command.variants || [],
      inventory: validatedInventory.value,
      weight: command.weight,
      dimensions: command.dimensions,
      seoTitle: command.seoTitle,
      seoDescription: command.seoDescription,
      seoKeywords: command.seoKeywords || [],
      isVisible: command.isVisible ?? true,
      isFeatured: command.isFeatured ?? false,
      requiresShipping: command.requiresShipping ?? true,
      isTaxable: command.isTaxable ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Create aggregate root
    const aggregate = createAggregateRoot<Product, ProductEvent>(
      product.id,
      product
    )

    // Create and apply event
    const event = createProductCreatedEvent(product.id, product)
    const updatedAggregate = applyEvent(aggregate, event, evolveProductState)

    return Promise.resolve(Result.success(updatedAggregate))
  } catch (error) {
    return Promise.resolve(Result.error(`Product creation failed: ${error}`))
  }
}

// ============================================================================
// STATE EVOLUTION
// ============================================================================

const evolveProductState = (state: Product, event: ProductEvent): Product => {
  switch (event.type) {
    case 'ProductCreated':
      return {
        ...state,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    default:
      return state
  }
}
