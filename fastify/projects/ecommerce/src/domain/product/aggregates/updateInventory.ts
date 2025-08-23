/**
 * Product Inventory Update Aggregate
 * 
 * Pure functional inventory updates with validation
 * No fp-ts dependencies, clean functional approach
 */

import { z } from 'zod'
import { 
  applyEvent,
  validateWith,
  validateBusinessRule,
  type AggregateRoot,
  type DomainResult,
  type AsyncResult,
  Result
} from '../../../shared/functionalArchitecture.js'
import type { 
  ProductId, 
  Product, 
  Inventory,
  UpdateInventoryCommand,
  ProductEvent 
} from '../types/index.js'
import { 
  createProductInventoryUpdatedEvent,
  type ProductInventoryUpdatedEvent 
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

const validateInventoryUpdate = (
  command: UpdateInventoryCommand
): DomainResult<UpdateInventoryCommand> => {
  // Validate stock quantity
  if (command.stockQuantity < 0) {
    return Result.error('Stock quantity cannot be negative')
  }
  
  // Validate reorder level
  if (command.reorderLevel !== undefined && command.reorderLevel < 0) {
    return Result.error('Reorder level cannot be negative')
  }
  
  // Validate max stock level
  if (command.maxStockLevel !== undefined && command.maxStockLevel <= 0) {
    return Result.error('Max stock level must be positive')
  }
  
  return Result.success(command)
}

const validateInventoryLogic = (
  command: UpdateInventoryCommand,
  currentInventory: Inventory
): DomainResult<UpdateInventoryCommand> => {
  // Validate reserved quantity doesn't exceed stock
  if (command.reservedQuantity !== undefined && command.reservedQuantity > command.stockQuantity) {
    return Result.error('Reserved quantity cannot exceed stock quantity')
  }
  
  // Validate max stock is greater than reorder level
  if (command.maxStockLevel !== undefined && command.reorderLevel !== undefined && command.maxStockLevel <= command.reorderLevel) {
    return Result.error('Max stock level must be greater than reorder level')
  }
  
  return Result.success(command)
}

// ============================================================================
// INVENTORY UPDATE
// ============================================================================

export const updateProductInventory = async (
  product: AggregateRoot<Product, ProductEvent>,
  command: UpdateInventoryCommand
): Promise<AsyncResult<AggregateRoot<Product, ProductEvent>>> => {
  try {
    // Validate product exists
    const productValidation = validateProductExists(product)
    if (productValidation.type === 'error') {
      return Promise.resolve(Result.error(productValidation.error))
    }

    // Validate inventory update
    const inventoryValidation = validateInventoryUpdate(command)
    if (inventoryValidation.type === 'error') {
      return Promise.resolve(Result.error(inventoryValidation.error))
    }

    // Validate inventory logic
    const logicValidation = validateInventoryLogic(command, product.state.inventory)
    if (logicValidation.type === 'error') {
      return Promise.resolve(Result.error(logicValidation.error))
    }

    // Prepare new inventory state
    const oldQuantity = product.state.inventory.stockQuantity
    const newInventory: Inventory = {
      ...product.state.inventory,
      stockQuantity: command.stockQuantity,
      lastStockUpdate: new Date()
    }

    // Update optional fields if provided
    if (command.reservedQuantity !== undefined) {
      newInventory.reservedQuantity = command.reservedQuantity
    }
    if (command.reorderLevel !== undefined) {
      newInventory.reorderLevel = command.reorderLevel
    }
    if (command.maxStockLevel !== undefined) {
      newInventory.maxStockLevel = command.maxStockLevel
    }
    if (command.trackInventory !== undefined) {
      newInventory.trackInventory = command.trackInventory
    }
    if (command.allowBackorder !== undefined) {
      newInventory.allowBackorder = command.allowBackorder
    }

    // Create and apply event
    const event = createProductInventoryUpdatedEvent(
      command.id,
      oldQuantity,
      command.stockQuantity,
      newInventory
    )
    const updatedAggregate = applyEvent(product, event, evolveProductState)

    return Promise.resolve(Result.success(updatedAggregate))
  } catch (error) {
    return Promise.resolve(Result.error(`Product inventory update failed: ${error}`))
  }
}

// ============================================================================
// STATE EVOLUTION
// ============================================================================

const evolveProductState = (state: Product, event: ProductEvent): Product => {
  switch (event.type) {
    case 'ProductInventoryUpdated':
      return {
        ...state,
        inventory: {
          stockQuantity: event.payload.newQuantity,
          reservedQuantity: event.payload.reservedQuantity,
          reorderLevel: event.payload.reorderLevel,
          maxStockLevel: event.payload.maxStockLevel,
          trackInventory: event.payload.trackInventory,
          allowBackorder: event.payload.allowBackorder,
          lastStockUpdate: new Date()
        },
        updatedAt: new Date()
      }
    default:
      return state
  }
}
