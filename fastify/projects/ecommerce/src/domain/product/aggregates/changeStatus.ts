/**
 * Product Status Change Aggregate
 * 
 * Pure functional product status changes with validation
 * No fp-ts dependencies, clean functional approach
 */

import { 
  applyEvent,
  validateBusinessRule,
  type AggregateRoot,
  type DomainResult,
  type AsyncResult,
  Result
} from '../../../shared/functionalArchitecture.js'
import type { 
  ProductId, 
  Product, 
  ProductStatus,
  ChangeProductStatusCommand,
  ProductEvent 
} from '../types/index.js'
import { 
  createProductStatusChangedEvent,
  type ProductStatusChangedEvent 
} from '../events/index.js'

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

const validateProductExists = (
  product: AggregateRoot<Product, ProductEvent>
): DomainResult<AggregateRoot<Product, ProductEvent>> => {
  return validateBusinessRule(
    'product-exists',
    Boolean(product && product.state),
    'Product not found',
    product
  )
}

const validateStatusChange = (
  product: AggregateRoot<Product, ProductEvent>,
  newStatus: ProductStatus
): DomainResult<AggregateRoot<Product, ProductEvent>> => {
  return validateBusinessRule(
    'different-status',
    product.state.status !== newStatus,
    'Product already has this status',
    product
  )
}

const validateStatusTransition = (
  product: AggregateRoot<Product, ProductEvent>,
  newStatus: ProductStatus
): DomainResult<Product> => {
  switch (newStatus) {
    case 'active':
      return canActivateProduct(product.state)
    case 'inactive':
      return canDeactivateProduct(product.state)
    case 'draft':
    case 'discontinued':
    case 'out_of_stock':
      return Result.success(product.state)
    default:
      return Result.error(`Invalid status transition to ${newStatus}`)
  }
}

// ============================================================================
// BUSINESS RULES
// ============================================================================

const canActivateProduct = (product: Product): DomainResult<Product> => {
  const nameValidation = validateBusinessRule(
    'has-name',
    Boolean(product.name && product.name.trim().length > 0),
    'Product must have a name to be activated'
  )
  if (nameValidation.type === 'error') return nameValidation

  const priceValidation = validateBusinessRule(
    'has-price',
    product.price && product.price.amount > 0,
    'Product must have a positive price to be activated'
  )
  if (priceValidation.type === 'error') return priceValidation

  const imagesValidation = validateBusinessRule(
    'has-images',
    product.images && product.images.length > 0,
    'Product must have at least one image to be activated'
  )
  if (imagesValidation.type === 'error') return imagesValidation

  return Result.success(product)
}

const canDeactivateProduct = (product: Product): DomainResult<Product> => {
  return validateBusinessRule(
    'not-discontinued',
    product.status !== 'discontinued',
    'Cannot deactivate discontinued product',
    product
  )
}

// ============================================================================
// STATUS CHANGE
// ============================================================================

export const changeProductStatus = async (
  product: AggregateRoot<Product, ProductEvent>,
  command: ChangeProductStatusCommand
): Promise<AsyncResult<AggregateRoot<Product, ProductEvent>>> => {
  try {
    // Validate product exists
    const productValidation = validateProductExists(product)
    if (productValidation.type === 'error') {
      return Promise.resolve(Result.error(productValidation.error))
    }

    // Validate status change
    const statusValidation = validateStatusChange(product, command.newStatus)
    if (statusValidation.type === 'error') {
      return Promise.resolve(Result.error(statusValidation.error))
    }

    // Validate status transition
    const transitionValidation = validateStatusTransition(product, command.newStatus)
    if (transitionValidation.type === 'error') {
      return Promise.resolve(Result.error(transitionValidation.error))
    }

    // Create and apply event
    const event = createProductStatusChangedEvent(
      command.id,
      product.state.status,
      command.newStatus
    ) as ProductEvent
    const updatedAggregate = applyEvent(product, event, evolveProductState)

    return Promise.resolve(Result.success(updatedAggregate))
  } catch (error) {
    return Promise.resolve(Result.error(`Product status change failed: ${error}`))
  }
}

// ============================================================================
// STATE EVOLUTION
// ============================================================================

const evolveProductState = (state: Product, event: ProductEvent): Product => {
  switch (event.type) {
    case 'ProductStatusChanged':
      const payload = event.payload as { newStatus: ProductStatus }
      return {
        ...state,
        status: payload.newStatus,
        updatedAt: new Date()
      }
    default:
      return state
  }
}
