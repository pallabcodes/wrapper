/**
 * Product Update Aggregate
 * 
 * Pure functional product updates with validation
 * No fp-ts dependencies, clean functional approach
 */

import { z } from 'zod'
import { 
  applyEvent,
  validateString,
  validateObject,
  type AggregateRoot,
  type DomainResult,
  type AsyncResult,
  Result
} from '../../../shared/functionalArchitecture.js'
import type { 
  ProductId, 
  Product, 
  UpdateProductCommand,
  ProductEvent,
  Weight
} from '../types/index.js'
import { 
  createProductUpdatedEvent,
  type ProductUpdatedEvent 
} from '../events/index.js'

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

const validateProductExists = (
  product: AggregateRoot<Product, ProductEvent>
): DomainResult<AggregateRoot<Product, ProductEvent>> => {
  if (!product || !product.state) {
    return Result.error('Product not found')
  }
  return Result.success(product)
}

const validateProductNotDeleted = (
  product: AggregateRoot<Product, ProductEvent>
): DomainResult<AggregateRoot<Product, ProductEvent>> => {
  if (product.state.status === 'discontinued') {
    return Result.error('Cannot update discontinued product')
  }
  return Result.success(product)
}

const validateUpdatePermissions = (
  product: AggregateRoot<Product, ProductEvent>
): DomainResult<AggregateRoot<Product, ProductEvent>> => {
  if (product.state.status === 'discontinued') {
    return Result.error('Cannot update discontinued product')
  }
  return Result.success(product)
}

// ============================================================================
// PRODUCT UPDATE
// ============================================================================

export const updateProduct = async (
  product: AggregateRoot<Product, ProductEvent>,
  command: UpdateProductCommand
): Promise<AsyncResult<AggregateRoot<Product, ProductEvent>>> => {
  try {
    // Validate product exists and can be updated
    const existsValidation = validateProductExists(product)
    if (existsValidation.type === 'error') {
      return Promise.resolve(Result.error(existsValidation.error))
    }

    const notDeletedValidation = validateProductNotDeleted(existsValidation.value)
    if (notDeletedValidation.type === 'error') {
      return Promise.resolve(Result.error(notDeletedValidation.error))
    }

    const permissionsValidation = validateUpdatePermissions(notDeletedValidation.value)
    if (permissionsValidation.type === 'error') {
      return Promise.resolve(Result.error(permissionsValidation.error))
    }

    const validatedProduct = permissionsValidation.value

    // Prepare changes object
    const changes: Partial<Product> = {}
    let hasChanges = false

    // Update name if provided
    if (command.name !== undefined) {
      const nameValidation = validateString(z.string().min(1).max(255))(command.name)
      if (nameValidation.type === 'error') {
        return Promise.resolve(Result.error(nameValidation.error))
      }
      changes.name = nameValidation.value
      changes.slug = nameValidation.value.toLowerCase().replace(/\s+/g, '-')
      hasChanges = true
    }

    // Update SKU if provided
    if (command.sku !== undefined) {
      const skuValidation = validateString(z.string().min(3).max(50).regex(/^[A-Z0-9-]+$/))(command.sku)
      if (skuValidation.type === 'error') {
        return Promise.resolve(Result.error(skuValidation.error))
      }
      changes.sku = skuValidation.value
      hasChanges = true
    }

    // Update price if provided
    if (command.price !== undefined) {
      const priceValidation = validateObject<{ amount: number; currency: string }>(z.object({
        amount: z.number().positive().max(999999.99),
        currency: z.string().length(3).toUpperCase()
      }))(command.price)
      if (priceValidation.type === 'error') {
        return Promise.resolve(Result.error(priceValidation.error))
      }
      changes.price = priceValidation.value
      hasChanges = true
    }

    // Update other fields
    if (command.description !== undefined) {
      changes.description = command.description
      hasChanges = true
    }

    if (command.shortDescription !== undefined) {
      changes.shortDescription = command.shortDescription
      hasChanges = true
    }

    if (command.category !== undefined) {
      changes.category = command.category
      hasChanges = true
    }

    if (command.tags !== undefined) {
      changes.tags = command.tags
      hasChanges = true
    }

    if (command.images !== undefined) {
      changes.images = command.images
      hasChanges = true
    }

    if (command.variants !== undefined) {
      changes.variants = command.variants
      hasChanges = true
    }

    if (command.inventory !== undefined) {
      const inventoryValidation = validateObject<any>(z.object({
        stockQuantity: z.number().int().min(0),
        reservedQuantity: z.number().int().min(0).default(0),
        reorderLevel: z.number().int().min(0).default(10),
        maxStockLevel: z.number().int().positive().optional(),
        trackInventory: z.boolean().default(true),
        allowBackorder: z.boolean().default(false),
        lastStockUpdate: z.date()
      }))(command.inventory)
      if (inventoryValidation.type === 'error') {
        return Promise.resolve(Result.error(inventoryValidation.error))
      }
      changes.inventory = inventoryValidation.value
      hasChanges = true
    }

    if (command.weight !== undefined) {
      changes.weight = command.weight as Weight
      hasChanges = true
    }

    if (command.dimensions !== undefined) {
      changes.dimensions = command.dimensions
      hasChanges = true
    }

    if (command.seoTitle !== undefined) {
      changes.seoTitle = command.seoTitle
      hasChanges = true
    }

    if (command.seoDescription !== undefined) {
      changes.seoDescription = command.seoDescription
      hasChanges = true
    }

    if (command.seoKeywords !== undefined) {
      changes.seoKeywords = command.seoKeywords
      hasChanges = true
    }

    if (command.isVisible !== undefined) {
      changes.isVisible = command.isVisible
      hasChanges = true
    }

    if (command.isFeatured !== undefined) {
      changes.isFeatured = command.isFeatured
      hasChanges = true
    }

    if (command.requiresShipping !== undefined) {
      changes.requiresShipping = command.requiresShipping
      hasChanges = true
    }

    if (command.isTaxable !== undefined) {
      changes.isTaxable = command.isTaxable
      hasChanges = true
    }

    // Check if there are any changes
    if (!hasChanges) {
      return Promise.resolve(Result.error('No changes provided for product update'))
    }

    // Update timestamp
    changes.updatedAt = new Date()

    // Create and apply event
    const event = createProductUpdatedEvent(command.id, changes as any)
    const updatedAggregate = applyEvent(product, event, evolveProductState)

    return Promise.resolve(Result.success(updatedAggregate))
  } catch (error) {
    return Promise.resolve(Result.error(`Product update failed: ${error}`))
  }
}

// ============================================================================
// STATE EVOLUTION
// ============================================================================

const evolveProductState = (state: Product, event: ProductEvent): Product => {
  switch (event.type) {
    case 'ProductUpdated':
      const changes = event.payload.changes as Partial<Product>
      return {
        ...state,
        ...changes,
        updatedAt: new Date()
      }
    default:
      return state
  }
}
