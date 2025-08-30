/**
 * Product Service Unit Tests
 * 
 * Comprehensive unit tests for product service.
 * Following internal team testing standards.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { productService, clearProductStorage } from '../../modules/product/productService'

// Mock dependencies
jest.mock('../../utils/logger')

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear in-memory storage for test isolation
    clearProductStorage()
  })

  describe('createProduct', () => {
    it('should create a new product successfully', async () => {
      // Arrange
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        currency: 'USD',
        category: 'electronics',
        stockQuantity: 50,
        sku: 'TEST-001'
      }

      // Act
      const result = await productService.createProduct(productData)

      // Assert
      expect(result).toBeDefined()
      expect(result.name).toBe(productData.name)
      expect(result.price).toBe(productData.price)
      expect(result.sku).toBe(productData.sku)
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('should throw error if SKU already exists', async () => {
      // Arrange
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        currency: 'USD',
        category: 'electronics',
        stockQuantity: 50,
        sku: 'DUPLICATE-001'
      }

      // Create first product
      await productService.createProduct(productData)

      // Act & Assert
      await expect(async () => {
        await productService.createProduct(productData)
      }).rejects.toThrow('Product with this SKU already exists')
    })

    it('should validate required fields', async () => {
      // Arrange
      const invalidProductData = {
        name: '', // Invalid: empty name
        price: -10, // Invalid: negative price
        stockQuantity: -5 // Invalid: negative stock
      }

      // Act & Assert
      await expect(async () => {
        await productService.createProduct(invalidProductData as any)
      }).rejects.toThrow('Validation failed')
    })
  })

  describe('getProductById', () => {
    it('should return product by ID', async () => {
      // Arrange
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        currency: 'USD',
        category: 'electronics',
        stockQuantity: 50,
        sku: 'GET-BY-ID-001'
      }

      const createdProduct = await productService.createProduct(productData)

      // Act
      const result = await productService.getProductById(createdProduct.id)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(createdProduct.id)
      expect(result?.name).toBe(productData.name)
    })

    it('should return null for non-existent product', async () => {
      // Act
      const result = await productService.getProductById('non-existent-id')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getProductBySKU', () => {
    it('should return product by SKU', async () => {
      // Arrange
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        currency: 'USD',
        category: 'electronics',
        stockQuantity: 50,
        sku: 'GET-BY-SKU-001'
      }

      await productService.createProduct(productData)

      // Act
      const result = await productService.getProductBySKU(productData.sku)

      // Assert
      expect(result).toBeDefined()
      expect(result?.sku).toBe(productData.sku)
      expect(result?.name).toBe(productData.name)
    })

    it('should return null for non-existent SKU', async () => {
      // Act
      const result = await productService.getProductBySKU('non-existent-sku')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      // Arrange
      const productData = {
        name: 'Original Product',
        description: 'Original description',
        price: 99.99,
        currency: 'USD',
        category: 'electronics',
        stockQuantity: 50,
        sku: 'UPDATE-001'
      }

      const createdProduct = await productService.createProduct(productData)

      const updateData = {
        name: 'Updated Product',
        price: 149.99,
        description: 'Updated description'
      }

      // Act
      const result = await productService.updateProduct(createdProduct.id, updateData)

      // Assert
      expect(result).toBeDefined()
      expect(result.name).toBe(updateData.name)
      expect(result.price).toBe(updateData.price)
      expect(result.description).toBe(updateData.description)
      expect(result.updatedAt).toBeDefined()
    })

    it('should throw error for non-existent product', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Product',
        price: 149.99
      }

      // Act & Assert
      await expect(async () => {
        await productService.updateProduct('non-existent-id', updateData)
      }).rejects.toThrow('Product not found')
    })
  })

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      // Arrange
      const productData = {
        name: 'Product to Delete',
        description: 'Will be deleted',
        price: 99.99,
        currency: 'USD',
        category: 'electronics',
        stockQuantity: 50,
        sku: 'DELETE-001'
      }

      const createdProduct = await productService.createProduct(productData)

      // Act
      await productService.deleteProduct(createdProduct.id)

      // Assert
      const deletedProduct = await productService.getProductById(createdProduct.id)
      expect(deletedProduct).toBeNull()
    })

    it('should throw error for non-existent product', async () => {
      // Act & Assert
      await expect(async () => {
        await productService.deleteProduct('non-existent-id')
      }).rejects.toThrow('Product not found')
    })
  })

  describe('listProducts', () => {
    it('should list products with pagination', async () => {
      // Arrange
      const products = [
        {
          name: 'Product 1',
          description: 'First product',
          price: 99.99,
          currency: 'USD',
          category: 'electronics',
          stockQuantity: 50,
          sku: 'LIST-001'
        },
        {
          name: 'Product 2',
          description: 'Second product',
          price: 149.99,
          currency: 'USD',
          category: 'electronics',
          stockQuantity: 30,
          sku: 'LIST-002'
        }
      ]

      for (const productData of products) {
        await productService.createProduct(productData)
      }

      // Act
      const result = await productService.listProducts({})

      // Assert
      expect(result).toBeDefined()
      expect(result.products).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.hasMore).toBe(false)
    })

    it('should filter products by category', async () => {
      // Arrange
      const electronicsProduct = {
        name: 'Electronics Product',
        description: 'Electronics category',
        price: 99.99,
        currency: 'USD',
        category: 'electronics',
        stockQuantity: 50,
        sku: 'FILTER-ELECTRONICS'
      }

      const clothingProduct = {
        name: 'Clothing Product',
        description: 'Clothing category',
        price: 49.99,
        currency: 'USD',
        category: 'clothing',
        stockQuantity: 100,
        sku: 'FILTER-CLOTHING'
      }

      await productService.createProduct(electronicsProduct)
      await productService.createProduct(clothingProduct)

      // Act
      const result = await productService.listProducts({ category: 'electronics' })

      // Assert
      expect(result.products).toHaveLength(1)
      expect(result.products[0]?.category).toBe('electronics')
    })
  })

  describe('searchProducts', () => {
    it('should search products by name', async () => {
      // Arrange
      const products = [
        {
          name: 'MacBook Pro',
          description: 'Apple laptop',
          price: 1999.99,
          currency: 'USD',
          category: 'electronics',
          stockQuantity: 10,
          sku: 'SEARCH-MACBOOK'
        },
        {
          name: 'iPhone 15',
          description: 'Apple phone',
          price: 999.99,
          currency: 'USD',
          category: 'electronics',
          stockQuantity: 20,
          sku: 'SEARCH-IPHONE'
        }
      ]

      for (const productData of products) {
        await productService.createProduct(productData)
      }

      // Act
      const result = await productService.searchProducts('MacBook')

      // Assert
      expect(result.products).toHaveLength(1)
      expect(result.products[0]?.name).toContain('MacBook')
    })
  })

  describe('getProductStats', () => {
    it('should return product statistics', async () => {
      // Arrange
      const products = [
        {
          name: 'Product 1',
          description: 'First product',
          price: 100,
          currency: 'USD',
          category: 'electronics',
          stockQuantity: 50,
          sku: 'STATS-001'
        },
        {
          name: 'Product 2',
          description: 'Second product',
          price: 200,
          currency: 'USD',
          category: 'electronics',
          stockQuantity: 30,
          sku: 'STATS-002'
        }
      ]

      for (const productData of products) {
        await productService.createProduct(productData)
      }

      // Act
      const stats = await productService.getProductStats()

      // Assert
      expect(stats).toBeDefined()
      expect(stats.totalProducts).toBe(2)
      expect(stats.averagePrice).toBe(150)
      expect(stats.totalValue).toBe(11000) // (100 * 50) + (200 * 30)
    })
  })
})
