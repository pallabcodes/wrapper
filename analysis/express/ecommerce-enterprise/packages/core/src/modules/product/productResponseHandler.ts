/**
 * Product Response Handler - Functional Programming Approach
 * 
 * Consistent response handling for product operations.
 * Following the same pattern as auth module.
 */

import { Response } from 'express'
import { logger } from '../../utils/logger'
import type { Product, ProductSearchResult } from './productTypes'

// ============================================================================
// RESPONSE HANDLER FUNCTIONS
// ============================================================================

export const productResponseHandler = {
  // Success responses
  success: (res: Response, data: unknown, message: string = 'Operation successful') => {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      meta: {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    }
    
    logger.info('Product operation successful', { message, dataType: typeof data })
    return res.status(200).json(response)
  },

  created: (res: Response, data: unknown, message: string = 'Product created successfully') => {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      meta: {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    }
    
    logger.info('Product created', { message, dataType: typeof data })
    return res.status(201).json(response)
  },

  // Error responses
  error: (res: Response, message: string, statusCode: number = 500, error?: unknown) => {
    const response = {
      success: false,
      message,
      error: error ? {
        code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
        details: error instanceof Error ? error.message : String(error)
      } : undefined,
      timestamp: new Date().toISOString(),
      meta: {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    }
    
    logger.error('Product operation failed', { message, statusCode, error })
    return res.status(statusCode).json(response)
  },

  notFound: (res: Response, message: string = 'Product not found') => {
    return productResponseHandler.error(res, message, 404)
  },

  badRequest: (res: Response, message: string = 'Invalid request data') => {
    return productResponseHandler.error(res, message, 400)
  },

  conflict: (res: Response, message: string = 'Product already exists') => {
    return productResponseHandler.error(res, message, 409)
  },

  unauthorized: (res: Response, message: string = 'Authentication required') => {
    return productResponseHandler.error(res, message, 401)
  },

  forbidden: (res: Response, message: string = 'Insufficient permissions') => {
    return productResponseHandler.error(res, message, 403)
  },

  // Specific product responses
  productList: (res: Response, result: ProductSearchResult, message: string = 'Products retrieved successfully') => {
    return productResponseHandler.success(res, result, message)
  },

  productDetails: (res: Response, product: Product, message: string = 'Product retrieved successfully') => {
    return productResponseHandler.success(res, product, message)
  },

  productCreated: (res: Response, product: Product, message: string = 'Product created successfully') => {
    return productResponseHandler.created(res, product, message)
  },

  productUpdated: (res: Response, product: Product, message: string = 'Product updated successfully') => {
    return productResponseHandler.success(res, product, message)
  },

  productDeleted: (res: Response, message: string = 'Product deleted successfully') => {
    return productResponseHandler.success(res, null, message)
  },

  productStats: (res: Response, stats: unknown, message: string = 'Product statistics retrieved') => {
    return productResponseHandler.success(res, stats, message)
  },

  categoriesList: (res: Response, categories: string[], message: string = 'Categories retrieved') => {
    return productResponseHandler.success(res, categories, message)
  },

  stockUpdated: (res: Response, product: Product, message: string = 'Product stock updated successfully') => {
    return productResponseHandler.success(res, product, message)
  },

  availabilityChecked: (res: Response, isAvailable: boolean, message: string = 'Product availability validated') => {
    return productResponseHandler.success(res, { isAvailable }, message)
  },

  bulkUpdated: (res: Response, products: Product[], message: string = 'Products bulk updated successfully') => {
    return productResponseHandler.success(res, products, message)
  }
}
