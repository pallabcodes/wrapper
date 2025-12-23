/**
 * Product Controller Unit Tests
 * 
 * Tests all controller methods with proper mocking and error handling.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { productService } from '../../modules/product/productService'
import { productController } from '../../modules/product/productController'
import type { 
  CreateProductData, 
  UpdateProductData, 
  ProductFilters,
  Product,
  ProductSearchResult
} from '../../modules/product/productTypes'

// Mock dependencies
jest.mock('../../modules/product/productService')

const mockProductService = productService as jest.Mocked<typeof productService>

describe('ProductController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createProduct', () => {
    const mockCreateData: CreateProductData = {
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      currency: 'USD',
      sku: 'TEST-SKU-001',
      category: 'Electronics',
      stockQuantity: 100
    }

    const mockProduct: Product = {
      id: 'product-id',
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      currency: 'USD',
      sku: 'TEST-SKU-001',
      category: 'Electronics',
      stockQuantity: 100,
      isActive: true,
      images: [],
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should create a new product successfully', async () => {
      // Arrange
      mockProductService.createProduct.mockResolvedValue(mockProduct)

      // Act
      const result = await productController.createProduct(mockCreateData)

      // Assert
      expect(mockProductService.createProduct).toHaveBeenCalledWith(mockCreateData)
      expect(result).toEqual(mockProduct)
    })

    it('should handle service errors', async () => {
      // Arrange
      const serviceError = new Error('SKU already exists')
      mockProductService.createProduct.mockRejectedValue(serviceError)

      // Act & Assert
      await expect(productController.createProduct(mockCreateData)).rejects.toThrow('SKU already exists')
      expect(mockProductService.createProduct).toHaveBeenCalledWith(mockCreateData)
    })
  })

  describe('getProductById', () => {
    const mockProduct: Product = {
      id: 'product-id',
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      currency: 'USD',
      sku: 'TEST-SKU-001',
      category: 'Electronics',
      stockQuantity: 100,
      isActive: true,
      images: [],
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should get product by ID successfully', async () => {
      // Arrange
      mockProductService.getProductById.mockResolvedValue(mockProduct)

      // Act
      const result = await productController.getProductById('product-id')

      // Assert
      expect(mockProductService.getProductById).toHaveBeenCalledWith('product-id')
      expect(result).toEqual(mockProduct)
    })

    it('should return null for non-existent product', async () => {
      // Arrange
      mockProductService.getProductById.mockResolvedValue(null)

      // Act
      const result = await productController.getProductById('non-existent-id')

      // Assert
      expect(mockProductService.getProductById).toHaveBeenCalledWith('non-existent-id')
      expect(result).toBeNull()
    })

    it('should handle service errors', async () => {
      // Arrange
      const serviceError = new Error('Database error')
      mockProductService.getProductById.mockRejectedValue(serviceError)

      // Act & Assert
      await expect(productController.getProductById('product-id')).rejects.toThrow('Database error')
      expect(mockProductService.getProductById).toHaveBeenCalledWith('product-id')
    })
  })

  describe('getProductBySKU', () => {
    const mockProduct: Product = {
      id: 'product-id',
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      currency: 'USD',
      sku: 'TEST-SKU-001',
      category: 'Electronics',
      stockQuantity: 100,
      isActive: true,
      images: [],
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should get product by SKU successfully', async () => {
      // Arrange
      mockProductService.getProductBySKU.mockResolvedValue(mockProduct)

      // Act
      const result = await productController.getProductBySKU('TEST-SKU-001')

      // Assert
      expect(mockProductService.getProductBySKU).toHaveBeenCalledWith('TEST-SKU-001')
      expect(result).toEqual(mockProduct)
    })

    it('should return null for non-existent SKU', async () => {
      // Arrange
      mockProductService.getProductBySKU.mockResolvedValue(null)

      // Act
      const result = await productController.getProductBySKU('NON-EXISTENT-SKU')

      // Assert
      expect(mockProductService.getProductBySKU).toHaveBeenCalledWith('NON-EXISTENT-SKU')
      expect(result).toBeNull()
    })
  })

  describe('updateProduct', () => {
    const mockUpdateData: UpdateProductData = {
      name: 'Updated Product',
      price: 149.99
    }

    const mockUpdatedProduct: Product = {
      id: 'product-id',
      name: 'Updated Product',
      description: 'Test Description',
      price: 149.99,
      currency: 'USD',
      sku: 'TEST-SKU-001',
      category: 'Electronics',
      stockQuantity: 100,
      isActive: true,
      images: [],
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should update product successfully', async () => {
      // Arrange
      mockProductService.updateProduct.mockResolvedValue(mockUpdatedProduct)

      // Act
      const result = await productController.updateProduct('product-id', mockUpdateData)

      // Assert
      expect(mockProductService.updateProduct).toHaveBeenCalledWith('product-id', mockUpdateData)
      expect(result).toEqual(mockUpdatedProduct)
    })

    it('should handle service errors', async () => {
      // Arrange
      const serviceError = new Error('Product not found')
      mockProductService.updateProduct.mockRejectedValue(serviceError)

      // Act & Assert
      await expect(productController.updateProduct('product-id', mockUpdateData)).rejects.toThrow('Product not found')
      expect(mockProductService.updateProduct).toHaveBeenCalledWith('product-id', mockUpdateData)
    })
  })

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      // Arrange
      mockProductService.deleteProduct.mockResolvedValue(undefined)

      // Act
      await productController.deleteProduct('product-id')

      // Assert
      expect(mockProductService.deleteProduct).toHaveBeenCalledWith('product-id')
    })

    it('should handle service errors', async () => {
      // Arrange
      const serviceError = new Error('Product not found')
      mockProductService.deleteProduct.mockRejectedValue(serviceError)

      // Act & Assert
      await expect(productController.deleteProduct('product-id')).rejects.toThrow('Product not found')
      expect(mockProductService.deleteProduct).toHaveBeenCalledWith('product-id')
    })
  })

  describe('listProducts', () => {
    const mockProducts: Product[] = [
      {
        id: 'product-1',
        name: 'Product 1',
        description: 'Description 1',
        price: 99.99,
        currency: 'USD',
        sku: 'SKU-001',
        category: 'Electronics',
        stockQuantity: 100,
        isActive: true,
        images: [],
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'product-2',
        name: 'Product 2',
        description: 'Description 2',
        price: 149.99,
        currency: 'USD',
        sku: 'SKU-002',
        category: 'Electronics',
        stockQuantity: 50,
        isActive: true,
        images: [],
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const mockSearchResult: ProductSearchResult = {
      products: mockProducts,
      total: 2,
      page: 1,
      limit: 20,
      hasMore: false
    }

    const mockFilters: ProductFilters = {
      category: 'Electronics',
      minPrice: 50,
      maxPrice: 200
    }

    it('should list products with filters', async () => {
      // Arrange
      mockProductService.listProducts.mockResolvedValue(mockSearchResult)

      // Act
      const result = await productController.listProducts(mockFilters)

      // Assert
      expect(mockProductService.listProducts).toHaveBeenCalledWith(mockFilters)
      expect(result).toEqual(mockSearchResult)
    })

    it('should list products without filters', async () => {
      // Arrange
      mockProductService.listProducts.mockResolvedValue(mockSearchResult)

      // Act
      const result = await productController.listProducts()

      // Assert
      expect(mockProductService.listProducts).toHaveBeenCalledWith({})
      expect(result).toEqual(mockSearchResult)
    })
  })

  describe('searchProducts', () => {
    const mockProducts: Product[] = [
      {
        id: 'product-1',
        name: 'iPhone 13',
        description: 'Apple iPhone 13',
        price: 999.99,
        currency: 'USD',
        sku: 'IPHONE-13',
        category: 'Electronics',
        stockQuantity: 100,
        isActive: true,
        images: [],
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const mockSearchResult: ProductSearchResult = {
      products: mockProducts,
      total: 1,
      page: 1,
      limit: 20,
      hasMore: false
    }

    const mockFilters: ProductFilters = {
      category: 'Electronics'
    }

    it('should search products successfully', async () => {
      // Arrange
      mockProductService.searchProducts.mockResolvedValue(mockSearchResult)

      // Act
      const result = await productController.searchProducts('iPhone', mockFilters)

      // Assert
      expect(mockProductService.searchProducts).toHaveBeenCalledWith('iPhone', mockFilters)
      expect(result).toEqual(mockSearchResult)
    })

    it('should search products without filters', async () => {
      // Arrange
      mockProductService.searchProducts.mockResolvedValue(mockSearchResult)

      // Act
      const result = await productController.searchProducts('iPhone')

      // Assert
      expect(mockProductService.searchProducts).toHaveBeenCalledWith('iPhone', {})
      expect(result).toEqual(mockSearchResult)
    })
  })

  describe('getProductsByCategory', () => {
    const mockProducts: Product[] = [
      {
        id: 'product-1',
        name: 'iPhone 13',
        description: 'Apple iPhone 13',
        price: 999.99,
        currency: 'USD',
        sku: 'IPHONE-13',
        category: 'Electronics',
        stockQuantity: 100,
        isActive: true,
        images: [],
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const mockSearchResult: ProductSearchResult = {
      products: mockProducts,
      total: 1,
      page: 1,
      limit: 20,
      hasMore: false
    }

    it('should get products by category successfully', async () => {
      // Arrange
      mockProductService.getProductsByCategory.mockResolvedValue(mockSearchResult)

      // Act
      const result = await productController.getProductsByCategory('Electronics')

      // Assert
      expect(mockProductService.getProductsByCategory).toHaveBeenCalledWith('Electronics', {})
      expect(result).toEqual(mockSearchResult)
    })

    it('should get products by category with filters', async () => {
      // Arrange
      const filters: ProductFilters = { minPrice: 500 }
      mockProductService.getProductsByCategory.mockResolvedValue(mockSearchResult)

      // Act
      const result = await productController.getProductsByCategory('Electronics', filters)

      // Assert
      expect(mockProductService.getProductsByCategory).toHaveBeenCalledWith('Electronics', filters)
      expect(result).toEqual(mockSearchResult)
    })
  })

  describe('getActiveProducts', () => {
    const mockProducts: Product[] = [
      {
        id: 'product-1',
        name: 'Active Product',
        description: 'Active Description',
        price: 99.99,
        currency: 'USD',
        sku: 'ACTIVE-001',
        category: 'Electronics',
        stockQuantity: 100,
        isActive: true,
        images: [],
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const mockSearchResult: ProductSearchResult = {
      products: mockProducts,
      total: 1,
      page: 1,
      limit: 20,
      hasMore: false
    }

    it('should get active products successfully', async () => {
      // Arrange
      mockProductService.getActiveProducts.mockResolvedValue(mockSearchResult)

      // Act
      const result = await productController.getActiveProducts()

      // Assert
      expect(mockProductService.getActiveProducts).toHaveBeenCalledWith({})
      expect(result).toEqual(mockSearchResult)
    })

    it('should get active products with filters', async () => {
      // Arrange
      const filters: ProductFilters = { category: 'Electronics' }
      mockProductService.getActiveProducts.mockResolvedValue(mockSearchResult)

      // Act
      const result = await productController.getActiveProducts(filters)

      // Assert
      expect(mockProductService.getActiveProducts).toHaveBeenCalledWith(filters)
      expect(result).toEqual(mockSearchResult)
    })
  })

  describe('updateProductStock', () => {
    const mockUpdatedProduct: Product = {
      id: 'product-id',
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      currency: 'USD',
      sku: 'TEST-SKU-001',
      category: 'Electronics',
      stockQuantity: 90,
      isActive: true,
      images: [],
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should add stock successfully', async () => {
      // Arrange
      mockProductService.updateProductStock.mockResolvedValue(mockUpdatedProduct)

      // Act
      const result = await productController.updateProductStock('product-id', 10, 'add')

      // Assert
      expect(mockProductService.updateProductStock).toHaveBeenCalledWith('product-id', 10, 'add')
      expect(result).toEqual(mockUpdatedProduct)
    })

    it('should subtract stock successfully', async () => {
      // Arrange
      mockProductService.updateProductStock.mockResolvedValue(mockUpdatedProduct)

      // Act
      const result = await productController.updateProductStock('product-id', 10, 'subtract')

      // Assert
      expect(mockProductService.updateProductStock).toHaveBeenCalledWith('product-id', 10, 'subtract')
      expect(result).toEqual(mockUpdatedProduct)
    })

    it('should handle service errors', async () => {
      // Arrange
      const serviceError = new Error('Insufficient stock')
      mockProductService.updateProductStock.mockRejectedValue(serviceError)

      // Act & Assert
      await expect(productController.updateProductStock('product-id', 10, 'subtract')).rejects.toThrow('Insufficient stock')
      expect(mockProductService.updateProductStock).toHaveBeenCalledWith('product-id', 10, 'subtract')
    })
  })

  describe('getProductStats', () => {
    const mockStats = {
      totalProducts: 100,
      activeProducts: 85,
      inactiveProducts: 15,
      totalValue: 14999.99,
      averagePrice: 149.99,
      uniqueCategories: 5,
      categories: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports']
    }

    it('should get product statistics successfully', async () => {
      // Arrange
      mockProductService.getProductStats.mockResolvedValue(mockStats)

      // Act
      const result = await productController.getProductStats()

      // Assert
      expect(mockProductService.getProductStats).toHaveBeenCalled()
      expect(result).toEqual(mockStats)
    })
  })

  describe('getCategories', () => {
    const mockCategories = ['Electronics', 'Clothing', 'Books', 'Home & Garden']

    it('should get categories successfully', async () => {
      // Arrange
      mockProductService.getCategories.mockResolvedValue(mockCategories)

      // Act
      const result = await productController.getCategories()

      // Assert
      expect(mockProductService.getCategories).toHaveBeenCalled()
      expect(result).toEqual(mockCategories)
    })
  })

  describe('getLowStockProducts', () => {
    const mockLowStockProducts: Product[] = [
      {
        id: 'product-1',
        name: 'Low Stock Product',
        description: 'Low Stock Description',
        price: 99.99,
        currency: 'USD',
        sku: 'LOW-STOCK-001',
        category: 'Electronics',
        stockQuantity: 5,
        isActive: true,
        images: [],
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    it('should get low stock products with default threshold', async () => {
      // Arrange
      mockProductService.getLowStockProducts.mockResolvedValue(mockLowStockProducts)

      // Act
      const result = await productController.getLowStockProducts()

      // Assert
      expect(mockProductService.getLowStockProducts).toHaveBeenCalledWith(10)
      expect(result).toEqual(mockLowStockProducts)
    })

    it('should get low stock products with custom threshold', async () => {
      // Arrange
      mockProductService.getLowStockProducts.mockResolvedValue(mockLowStockProducts)

      // Act
      const result = await productController.getLowStockProducts(5)

      // Assert
      expect(mockProductService.getLowStockProducts).toHaveBeenCalledWith(5)
      expect(result).toEqual(mockLowStockProducts)
    })
  })

  describe('bulkUpdateProducts', () => {
    const mockUpdates = [
      { id: 'product-1', data: { name: 'Updated Product 1' } },
      { id: 'product-2', data: { price: 199.99 } }
    ]

    const mockUpdatedProducts: Product[] = [
      {
        id: 'product-1',
        name: 'Updated Product 1',
        description: 'Description 1',
        price: 99.99,
        currency: 'USD',
        sku: 'SKU-001',
        category: 'Electronics',
        stockQuantity: 100,
        isActive: true,
        images: [],
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'product-2',
        name: 'Product 2',
        description: 'Description 2',
        price: 199.99,
        currency: 'USD',
        sku: 'SKU-002',
        category: 'Electronics',
        stockQuantity: 50,
        isActive: true,
        images: [],
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    it('should bulk update products successfully', async () => {
      // Arrange
      mockProductService.bulkUpdateProducts.mockResolvedValue(mockUpdatedProducts)

      // Act
      const result = await productController.bulkUpdateProducts(mockUpdates)

      // Assert
      expect(mockProductService.bulkUpdateProducts).toHaveBeenCalledWith(mockUpdates)
      expect(result).toEqual(mockUpdatedProducts)
    })

    it('should handle service errors', async () => {
      // Arrange
      const serviceError = new Error('Bulk update failed')
      mockProductService.bulkUpdateProducts.mockRejectedValue(serviceError)

      // Act & Assert
      await expect(productController.bulkUpdateProducts(mockUpdates)).rejects.toThrow('Bulk update failed')
      expect(mockProductService.bulkUpdateProducts).toHaveBeenCalledWith(mockUpdates)
    })
  })

  describe('validateProductAvailability', () => {
    it('should validate product availability successfully', async () => {
      // Arrange
      mockProductService.validateProductAvailability.mockResolvedValue(true)

      // Act
      const result = await productController.validateProductAvailability('product-id', 5)

      // Assert
      expect(mockProductService.validateProductAvailability).toHaveBeenCalledWith('product-id', 5)
      expect(result).toBe(true)
    })

    it('should return false for insufficient stock', async () => {
      // Arrange
      mockProductService.validateProductAvailability.mockResolvedValue(false)

      // Act
      const result = await productController.validateProductAvailability('product-id', 1000)

      // Assert
      expect(mockProductService.validateProductAvailability).toHaveBeenCalledWith('product-id', 1000)
      expect(result).toBe(false)
    })

    it('should handle service errors', async () => {
      // Arrange
      const serviceError = new Error('Product not found')
      mockProductService.validateProductAvailability.mockRejectedValue(serviceError)

      // Act & Assert
      await expect(productController.validateProductAvailability('product-id', 5)).rejects.toThrow('Product not found')
      expect(mockProductService.validateProductAvailability).toHaveBeenCalledWith('product-id', 5)
    })
  })
})
