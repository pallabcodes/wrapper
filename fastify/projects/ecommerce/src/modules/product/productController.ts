/**
 * Product Controller
 * 
 * Handles HTTP requests for product operations
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { ResponseBuilder } from '../../shared/response/index.js'
import { ProductService } from './productService.js'
import { 
  CreateProductSchema, 
  UpdateProductSchema, 
  ProductQuerySchema,
  UpdateInventorySchema,
  type CreateProductRequest,
  type UpdateProductRequest,
  type ProductQuery,
  type UpdateInventoryRequest
} from './productSchemas.js'
import type { ProductId } from '../../shared/types/index.js'

// ============================================================================
// PRODUCT CONTROLLER
// ============================================================================

export class ProductController {
  private productService = new ProductService()

  /**
   * Create a new product
   * POST /api/products
   */
  async createProduct(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Validate input
      const validationResult = CreateProductSchema.safeParse(request.body)
      
      if (!validationResult.success) {
        return reply.status(400).send(
          ResponseBuilder
            .create()
            .error('VALIDATION_ERROR', 'Invalid product data')
            .build()
        )
      }

      // Mock user ID - replace with actual auth
      const userId = 'user_123'
      
      // Create product
      const result = await this.productService.createProduct(validationResult.data, userId)

      return reply.status(201).send(
        ResponseBuilder
          .create()
          .created(result)
          .build()
      )

    } catch (error) {
      return reply.status(500).send(
        ResponseBuilder
          .create()
          .error('INTERNAL_ERROR', 'Failed to create product')
          .build()
      )
    }
  }

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  async getProduct(
    request: FastifyRequest<{ Params: { id: ProductId } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params
      const result = await this.productService.getProduct(id)

      return reply.status(200).send(
        ResponseBuilder
          .create()
          .success(result)
          .build()
      )

    } catch (error) {
      return reply.status(500).send(
        ResponseBuilder
          .create()
          .error('INTERNAL_ERROR', 'Failed to get product')
          .build()
      )
    }
  }

  /**
   * Update product
   * PUT /api/products/:id
   */
  async updateProduct(
    request: FastifyRequest<{ Params: { id: ProductId } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Validate input
      const validationResult = UpdateProductSchema.safeParse(request.body)
      
      if (!validationResult.success) {
        return reply.status(400).send(
          ResponseBuilder
            .create()
            .error('VALIDATION_ERROR', 'Invalid product data')
            .build()
        )
      }

      const { id } = request.params
      const userId = 'user_123' // Mock user ID
      
      const result = await this.productService.updateProduct(id, validationResult.data, userId)

      return reply.status(200).send(
        ResponseBuilder
          .create()
          .success(result)
          .build()
      )

    } catch (error) {
      return reply.status(500).send(
        ResponseBuilder
          .create()
          .error('INTERNAL_ERROR', 'Failed to update product')
          .build()
      )
    }
  }

  /**
   * Delete product
   * DELETE /api/products/:id
   */
  async deleteProduct(
    request: FastifyRequest<{ Params: { id: ProductId } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params
      const userId = 'user_123' // Mock user ID
      
      const result = await this.productService.deleteProduct(id, userId)

      return reply.status(200).send(
        ResponseBuilder
          .create()
          .success(result)
          .build()
      )

    } catch (error) {
      return reply.status(500).send(
        ResponseBuilder
          .create()
          .error('INTERNAL_ERROR', 'Failed to delete product')
          .build()
      )
    }
  }

  /**
   * Search products
   * GET /api/products
   */
  async searchProducts(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Validate query parameters
      const validationResult = ProductQuerySchema.safeParse(request.query)
      
      if (!validationResult.success) {
        return reply.status(400).send(
          ResponseBuilder
            .create()
            .error('VALIDATION_ERROR', 'Invalid query parameters')
            .build()
        )
      }

      const result = await this.productService.searchProducts(validationResult.data)

      return reply.status(200).send(
        ResponseBuilder
          .create()
          .success(result)
          .build()
      )

    } catch (error) {
      return reply.status(500).send(
        ResponseBuilder
          .create()
          .error('INTERNAL_ERROR', 'Failed to search products')
          .build()
      )
    }
  }

  /**
   * Update product inventory
   * PATCH /api/products/:id/inventory
   */
  async updateInventory(
    request: FastifyRequest<{ Params: { id: ProductId } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Validate input
      const validationResult = UpdateInventorySchema.safeParse(request.body)
      
      if (!validationResult.success) {
        return reply.status(400).send(
          ResponseBuilder
            .create()
            .error('VALIDATION_ERROR', 'Invalid inventory data')
            .build()
        )
      }

      const { id } = request.params
      const userId = 'user_123' // Mock user ID
      
      const result = await this.productService.updateInventory(id, validationResult.data, userId)

      return reply.status(200).send(
        ResponseBuilder
          .create()
          .success(result)
          .build()
      )

    } catch (error) {
      return reply.status(500).send(
        ResponseBuilder
          .create()
          .error('INTERNAL_ERROR', 'Failed to update inventory')
          .build()
      )
    }
  }
}
