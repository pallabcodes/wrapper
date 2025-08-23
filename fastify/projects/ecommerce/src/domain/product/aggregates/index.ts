/**
 * Product Aggregates Index
 * 
 * Centralized exports for all product domain aggregates
 * Clean functional approach without fp-ts dependencies
 */

export { createProduct } from './createProduct.js'
export { updateProduct } from './updateProduct.js'
export { changeProductStatus } from './changeStatus.js'
export { updateProductInventory } from './updateInventory.js'

// Re-export types for convenience
export type { 
  ProductId, 
  Product, 
  ProductStatus,
  CreateProductCommand,
  UpdateProductCommand,
  ChangeProductStatusCommand,
  UpdateInventoryCommand,
  ProductEvent 
} from '../types/index.js'
