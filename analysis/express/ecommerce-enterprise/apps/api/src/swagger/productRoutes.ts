/**
 * Product Routes - Simple, Clean, Debuggable
 * 
 * Single function approach for maximum readability and 5-minute debuggability.
 * No over-engineering, no technical debt.
 */

import { createRoute, type MiddlewareHelpers } from './schemaRegistry'
import { RequestHandler } from 'express'
import { middlewarePatterns } from './middlewareHelpers'
import { z } from 'zod'
import {
  createProductSchema,
  updateProductSchema,
  productFiltersSchema,
  productIdSchema,
  baseResponseSchema
} from '@ecommerce-enterprise/core'

// ============================================================================
// SIMPLE ROUTE CREATOR - One function, clear purpose
// ============================================================================

const createProductRoute = (
  path: string,
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  summary: string,
  description: string,
  options: {
    requestSchema?: z.ZodTypeAny
    responseSchema?: z.ZodTypeAny
    requiresAuth?: boolean
    statusCodes?: number[]
    tags?: string[]
    middleware?: RequestHandler[]
    middlewareHelpers?: MiddlewareHelpers
    fileUpload?: {
      fieldName: string
      isMultiple: boolean
      allowedMimeTypes?: string[]
      maxSize?: number
      description?: string
    }
  } = {}
) => {
  const {
    requestSchema,
    responseSchema = baseResponseSchema,
    requiresAuth = false,
    statusCodes = [200],
    tags = ['Product Management'],
    middleware,
    middlewareHelpers,
    fileUpload
  } = options

  return createRoute(
    `/api/v1/products${path}`,
    method,
    summary,
    description,
    tags,
    responseSchema,
    requestSchema,
    requiresAuth,
    statusCodes,
    fileUpload,
    middleware,
    middlewareHelpers
  )
}

// ============================================================================
// ROUTE DEFINITIONS - Simple, readable, debuggable
// ============================================================================

export const productRoutes = [
  // Product CRUD operations
  createProductRoute('/', 'post', 'Create product', 'Create a new product', {
    requestSchema: createProductSchema,
    statusCodes: [201, 400, 409]
  }),

  createProductRoute('/', 'get', 'List products', 'Get paginated list of products', {
    statusCodes: [200]
  }),

  createProductRoute('/search', 'get', 'Search products', 'Search products by query', {
    statusCodes: [200]
  }),

  createProductRoute('/stats', 'get', 'Product statistics', 'Get product analytics and statistics', {
    statusCodes: [200]
  }),

  createProductRoute('/categories', 'get', 'Get categories', 'Get all product categories', {
    statusCodes: [200]
  }),

  createProductRoute('/low-stock', 'get', 'Low stock products', 'Get products with low stock', {
    statusCodes: [200]
  }),

  createProductRoute('/active', 'get', 'Active products', 'Get only active products', {
    statusCodes: [200]
  }),

  // Product by ID operations
  createProductRoute('/:id', 'get', 'Get product', 'Get product by ID', {
    statusCodes: [200, 404]
  }),

  createProductRoute('/:id', 'put', 'Update product', 'Update product by ID', {
    requestSchema: updateProductSchema,
    requiresAuth: true,
    statusCodes: [200, 400, 404]
  }),

  createProductRoute('/:id', 'delete', 'Delete product', 'Delete product by ID', {
    requiresAuth: true,
    statusCodes: [200, 404]
  }),

  createProductRoute('/:id/stock', 'patch', 'Update stock', 'Update product stock quantity', {
    requiresAuth: true,
    statusCodes: [200, 400, 404]
  }),

  createProductRoute('/:id/availability', 'get', 'Check availability', 'Check product availability', {
    statusCodes: [200, 404]
  }),

  // Product by SKU operations
  createProductRoute('/sku/:sku', 'get', 'Get product by SKU', 'Get product by SKU', {
    statusCodes: [200, 404]
  }),

  // Category operations
  createProductRoute('/category/:category', 'get', 'Products by category', 'Get products by category', {
    statusCodes: [200]
  }),

  // Bulk operations
  createProductRoute('/bulk', 'patch', 'Bulk update products', 'Update multiple products at once', {
    requiresAuth: true,
    statusCodes: [200, 400]
  }),

  // File upload operations
  createProductRoute('/upload/images', 'post', 'Upload product images', 'Upload multiple product images', {
    requiresAuth: true,
    statusCodes: [200, 400],
    fileUpload: {
      fieldName: 'images',
      isMultiple: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
      description: 'Upload multiple product images (JPEG, PNG, WebP, max 5MB each)'
    }
  }),

  createProductRoute('/upload/image', 'post', 'Upload single image', 'Upload single product image', {
    requiresAuth: true,
    statusCodes: [200, 400],
    fileUpload: {
      fieldName: 'image',
      isMultiple: false,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
      description: 'Upload single product image (JPEG, PNG, WebP, max 5MB)'
    }
  })
]
