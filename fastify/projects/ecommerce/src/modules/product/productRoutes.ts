/**
 * Product Routes
 * 
 * Fastify routes for product management endpoints
 * Demonstrates complete product catalog with OpenAPI specs
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
        required: ['name', 'description', 'price', 'currency', 'category', 'sku', 'inventory', 'images'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          description: { type: 'string', minLength: 10, maxLength: 5000 },
          price: { type: 'number', minimum: 0.01 },
          currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD'] },
          category: { type: 'string', minLength: 1, maxLength: 100 },
          brand: { type: 'string', minLength: 1, maxLength: 100 },
          sku: { type: 'string', minLength: 1, maxLength: 50 },
          inventory: {
            type: 'object',
            required: ['quantity'],
            properties: {
              quantity: { type: 'integer', minimum: 0 },
              lowStockThreshold: { type: 'integer', minimum: 0, default: 10 },
              trackInventory: { type: 'boolean', default: true }
            }
          },
          specifications: {
            type: 'object',
            additionalProperties: { type: 'string' }
          },
          images: {
            type: 'array',
            minItems: 1,
            maxItems: 10,
            items: { type: 'string', format: 'uri' }
          },
          tags: {
            type: 'array',
            maxItems: 20,
            items: { type: 'string' }
          },
          status: {
            type: 'string',
            enum: ['draft', 'active', 'inactive', 'archived'],
            default: 'draft'
          },
          seo: {
            type: 'object',
            properties: {
              metaTitle: { type: 'string', maxLength: 60 },
              metaDescription: { type: 'string', maxLength: 160 },
              slug: { type: 'string', pattern: '^[a-z0-9-]+$' }
            }
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'number' },
                currency: { type: 'string' },
                category: { type: 'string' },
                brand: { type: 'string' },
                sku: { type: 'string' },
                status: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' },
                message: { type: 'string' },
                productId: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [false] },
            error: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    handler: productController.createProduct.bind(productController)
  })

  // Get products with filtering
  fastify.get('/', {
    schema: {
      description: 'Get products with filtering and pagination',
      tags: ['Products'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', pattern: '^\\d+$', default: '1' },
          limit: { type: 'string', pattern: '^\\d+$', default: '20' },
          category: { type: 'string' },
          brand: { type: 'string' },
          minPrice: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$' },
          maxPrice: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$' },
          search: { type: 'string', minLength: 1, maxLength: 100 },
          status: { type: 'string', enum: ['draft', 'active', 'inactive', 'archived'] },
          sortBy: { type: 'string', enum: ['name', 'price', 'createdAt', 'updatedAt'], default: 'createdAt' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'number' },
                  currency: { type: 'string' },
                  category: { type: 'string' },
                  brand: { type: 'string' },
                  sku: { type: 'string' },
                  status: { type: 'string' },
                  images: { type: 'array', items: { type: 'string' } },
                  tags: { type: 'array', items: { type: 'string' } },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' }
              }
            }
          }
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
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'number' },
                currency: { type: 'string' },
                category: { type: 'string' },
                brand: { type: 'string' },
                sku: { type: 'string' },
                inventory: {
                  type: 'object',
                  properties: {
                    quantity: { type: 'number' },
                    lowStockThreshold: { type: 'number' },
                    trackInventory: { type: 'boolean' }
                  }
                },
                specifications: { type: 'object' },
                images: { type: 'array', items: { type: 'string' } },
                tags: { type: 'array', items: { type: 'string' } },
                status: { type: 'string' },
                seo: {
                  type: 'object',
                  properties: {
                    metaTitle: { type: 'string' },
                    metaDescription: { type: 'string' },
                    slug: { type: 'string' }
                  }
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [false] },
            error: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    handler: productController.getProduct.bind(productController)
  })
}

// ============================================================================
// ROUTE PLUGIN METADATA
// ============================================================================

Object.defineProperty(productRoutes, Symbol.for('plugin-meta'), {
  value: {
    name: 'product-routes',
    version: '1.0.0'
  },
  writable: false,
  enumerable: false,
  configurable: false
})
