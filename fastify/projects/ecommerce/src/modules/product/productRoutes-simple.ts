/**
 * Product Routes (Simplified)
 * 
 * Basic product management endpoints
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { ProductController } from './productController.js'

// ============================================================================
// PRODUCT ROUTES PLUGIN
// ============================================================================

export async function productRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const productController = new ProductController()

  // Create product
  fastify.post('/', {
    schema: {
      description: 'Create a new product',
      tags: ['Products'],
      body: {
        type: 'object',
        required: ['name', 'description', 'price', 'currency', 'sku'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          description: { type: 'string', minLength: 10, maxLength: 5000 },
          price: { type: 'number', minimum: 0 },
          currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD'] },
          category: { type: 'string', minLength: 1, maxLength: 100 },
          brand: { type: 'string', minLength: 1, maxLength: 100 },
          sku: { type: 'string', minLength: 1, maxLength: 50 },
          inventory: {
            type: 'object',
            properties: {
              quantity: { type: 'number', minimum: 0 },
              lowStockThreshold: { type: 'number', minimum: 0 },
              trackInventory: { type: 'boolean' }
            }
          },
          images: {
            type: 'array',
            items: { type: 'string', format: 'uri' },
            minItems: 1,
            maxItems: 10
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 20
          },
          status: { 
            type: 'string', 
            enum: ['draft', 'active', 'inactive', 'archived'],
            default: 'draft'
          }
        }
      }
    },
    handler: productController.createProduct.bind(productController)
  })

  // Get products (search)
  fastify.get('/', {
    schema: {
      description: 'Search products',
      tags: ['Products'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', pattern: '^\\d+$' },
          limit: { type: 'string', pattern: '^\\d+$' },
          search: { type: 'string' },
          category: { type: 'string' },
          brand: { type: 'string' },
          minPrice: { type: 'string', pattern: '^\\d+(\\.\\d{2})?$' },
          maxPrice: { type: 'string', pattern: '^\\d+(\\.\\d{2})?$' },
          status: { type: 'string', enum: ['draft', 'active', 'inactive', 'archived'] },
          sortBy: { type: 'string', enum: ['name', 'price', 'createdAt', 'updatedAt'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          inStock: { type: 'string', enum: ['true', 'false'] }
        }
      }
    },
    handler: productController.searchProducts.bind(productController)
  })

  // Get product by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get product by ID',
      tags: ['Products'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', minLength: 1 }
        }
      }
    },
    handler: productController.getProduct.bind(productController)
  })

  // Update product
  fastify.put('/:id', {
    schema: {
      description: 'Update product',
      tags: ['Products'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', minLength: 1 }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          description: { type: 'string', minLength: 10, maxLength: 5000 },
          price: { type: 'number', minimum: 0 },
          currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD'] },
          category: { type: 'string', minLength: 1, maxLength: 100 },
          brand: { type: 'string', minLength: 1, maxLength: 100 },
          sku: { type: 'string', minLength: 1, maxLength: 50 },
          status: { type: 'string', enum: ['draft', 'active', 'inactive', 'archived'] }
        }
      }
    },
    handler: productController.updateProduct.bind(productController)
  })

  // Delete product
  fastify.delete('/:id', {
    schema: {
      description: 'Delete product',
      tags: ['Products'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', minLength: 1 }
        }
      }
    },
    handler: productController.deleteProduct.bind(productController)
  })

  // Update inventory
  fastify.patch('/:id/inventory', {
    schema: {
      description: 'Update product inventory',
      tags: ['Products'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', minLength: 1 }
        }
      },
      body: {
        type: 'object',
        required: ['quantity'],
        properties: {
          quantity: { type: 'number', minimum: 0 },
          operation: { type: 'string', enum: ['set', 'add', 'subtract'] },
          reason: { type: 'string', minLength: 1, maxLength: 255 }
        }
      }
    },
    handler: productController.updateInventory.bind(productController)
  })
}
