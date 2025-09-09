import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import { productRouter } from '../../product/productRoutes'
import { authRouter } from '../../auth/authRoutes'
import { logger } from '@ecommerce-enterprise/core'

// Create test app
const app = express()
app.use(express.json())
app.use('/auth', authRouter)
app.use('/products', productRouter)

describe('Product API Integration Tests', () => {
  let authToken: string
  let testProductId: string
  let testProductSKU: string

  beforeAll(async () => {
    // Setup test environment
    logger.info('Setting up product integration tests')
  })

  afterAll(async () => {
    // Cleanup test environment
    logger.info('Cleaning up product integration tests')
  })

  beforeEach(async () => {
    // Reset test state
    authToken = ''
    testProductId = ''
    testProductSKU = ''
  })

  afterEach(async () => {
    // Clean up after each test
  })

  // Helper function to create authenticated user
  const createAuthenticatedUser = async () => {
    const userData = {
      email: `test-${Date.now()}@example.com`,
      password: 'StrongPass123!',
      firstName: 'Test',
      lastName: 'User'
    }

    const response = await request(app)
      .post('/auth/register')
      .send(userData)

    return response.body.data.tokens.accessToken
  }

  describe('POST /products', () => {
    beforeEach(async () => {
      authToken = await createAuthenticatedUser()
    })

    it('should create a new product successfully', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product for integration testing',
        price: 99.99,
        currency: 'USD',
        sku: `TEST-${Date.now()}`,
        category: 'Electronics',
        stockQuantity: 100
      }

      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          product: {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            currency: productData.currency,
            sku: productData.sku,
            category: productData.category,
            stockQuantity: productData.stockQuantity,
            isActive: true
          }
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })

      testProductId = response.body.data.product.id
      testProductSKU = response.body.data.product.sku
    })

    it('should handle duplicate SKU', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        currency: 'USD',
        sku: `DUPLICATE-${Date.now()}`,
        category: 'Electronics',
        stockQuantity: 100
      }

      // Create first product
      await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201)

      // Try to create product with same SKU
      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(409)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('SKU already exists'),
        errorCode: 'CONFLICT',
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })
    })

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Empty name should be invalid
        price: -10, // Negative price should be invalid
        sku: 'invalid-sku'
      }

      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Object),
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })
    })

    it('should require authentication', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        currency: 'USD',
        sku: `TEST-${Date.now()}`,
        category: 'Electronics',
        stockQuantity: 100
      }

      const response = await request(app)
        .post('/products')
        .send(productData)
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('No token provided'),
        errorCode: 'UNAUTHORIZED',
        timestamp: expect.any(String)
      })
    })
  })

  describe('GET /products', () => {
    beforeEach(async () => {
      // Create some test products
      authToken = await createAuthenticatedUser()
      
      const products = [
        {
          name: 'Product 1',
          description: 'First test product',
          price: 99.99,
          currency: 'USD',
          sku: `PROD-1-${Date.now()}`,
          category: 'Electronics',
          stockQuantity: 100
        },
        {
          name: 'Product 2',
          description: 'Second test product',
          price: 149.99,
          currency: 'USD',
          sku: `PROD-2-${Date.now()}`,
          category: 'Books',
          stockQuantity: 50
        }
      ]

      for (const product of products) {
        await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(product)
      }
    })

    it('should list products with pagination', async () => {
      const response = await request(app)
        .get('/products')
        .query({ page: 1, limit: 10 })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          products: expect.any(Array),
          pagination: {
            page: 1,
            limit: 10,
            total: expect.any(Number),
            hasMore: expect.any(Boolean)
          }
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })

      expect(response.body.data.products.length).toBeGreaterThan(0)
      expect(response.body.data.products[0]).toHaveProperty('id')
      expect(response.body.data.products[0]).toHaveProperty('name')
      expect(response.body.data.products[0]).toHaveProperty('price')
    })

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/products')
        .query({ category: 'Electronics' })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          products: expect.any(Array),
          pagination: expect.any(Object)
        }
      })

      // All returned products should be in Electronics category
      response.body.data.products.forEach((product: any) => {
        expect(product.category).toBe('Electronics')
      })
    })

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/products')
        .query({ page: -1, limit: 0 })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Object),
        timestamp: expect.any(String)
      })
    })
  })

  describe('GET /products/search', () => {
    beforeEach(async () => {
      // Create test products for search
      authToken = await createAuthenticatedUser()
      
      const products = [
        {
          name: 'iPhone 13 Pro',
          description: 'Latest iPhone model',
          price: 999.99,
          currency: 'USD',
          sku: `IPHONE-${Date.now()}`,
          category: 'Electronics',
          stockQuantity: 100
        },
        {
          name: 'Samsung Galaxy S21',
          description: 'Android smartphone',
          price: 799.99,
          currency: 'USD',
          sku: `SAMSUNG-${Date.now()}`,
          category: 'Electronics',
          stockQuantity: 75
        }
      ]

      for (const product of products) {
        await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(product)
      }
    })

    it('should search products by name', async () => {
      const response = await request(app)
        .get('/products/search')
        .query({ q: 'iPhone' })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          products: expect.any(Array),
          pagination: expect.any(Object)
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })

      // Should find iPhone products
      const foundProducts = response.body.data.products
      expect(foundProducts.length).toBeGreaterThan(0)
      foundProducts.forEach((product: any) => {
        expect(product.name.toLowerCase()).toContain('iphone')
      })
    })

    it('should search products by description', async () => {
      const response = await request(app)
        .get('/products/search')
        .query({ q: 'Android' })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          products: expect.any(Array),
          pagination: expect.any(Object)
        }
      })

      // Should find Android products
      const foundProducts = response.body.data.products
      expect(foundProducts.length).toBeGreaterThan(0)
      foundProducts.forEach((product: any) => {
        expect(product.description.toLowerCase()).toContain('android')
      })
    })

    it('should return empty results for non-matching search', async () => {
      const response = await request(app)
        .get('/products/search')
        .query({ q: 'NonExistentProduct' })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          products: [],
          pagination: expect.any(Object)
        }
      })
    })
  })

  describe('GET /products/:id', () => {
    beforeEach(async () => {
      // Create a test product
      authToken = await createAuthenticatedUser()
      
      const productData = {
        name: 'Test Product for Get',
        description: 'A test product for get by ID',
        price: 199.99,
        currency: 'USD',
        sku: `GET-TEST-${Date.now()}`,
        category: 'Electronics',
        stockQuantity: 100
      }

      const createResponse = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)

      testProductId = createResponse.body.data.product.id
    })

    it('should get product by ID successfully', async () => {
      const response = await request(app)
        .get(`/products/${testProductId}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          product: {
            id: testProductId,
            name: 'Test Product for Get',
            description: 'A test product for get by ID',
            price: 199.99,
            currency: 'USD',
            category: 'Electronics',
            stockQuantity: 100,
            isActive: true
          }
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })
    })

    it('should handle non-existent product ID', async () => {
      const response = await request(app)
        .get('/products/non-existent-id')
        .expect(404)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('not found'),
        errorCode: 'NOT_FOUND',
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })
    })

    it('should handle invalid product ID format', async () => {
      const response = await request(app)
        .get('/products/invalid-id-format')
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Object),
        timestamp: expect.any(String)
      })
    })
  })

  describe('PUT /products/:id', () => {
    beforeEach(async () => {
      // Create a test product
      authToken = await createAuthenticatedUser()
      
      const productData = {
        name: 'Test Product for Update',
        description: 'A test product for update',
        price: 299.99,
        currency: 'USD',
        sku: `UPDATE-TEST-${Date.now()}`,
        category: 'Electronics',
        stockQuantity: 100
      }

      const createResponse = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)

      testProductId = createResponse.body.data.product.id
    })

    it('should update product successfully', async () => {
      const updateData = {
        name: 'Updated Product Name',
        description: 'Updated product description',
        price: 399.99
      }

      const response = await request(app)
        .put(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          product: {
            id: testProductId,
            name: 'Updated Product Name',
            description: 'Updated product description',
            price: 399.99,
            currency: 'USD',
            category: 'Electronics',
            stockQuantity: 100
          }
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })
    })

    it('should handle non-existent product ID', async () => {
      const updateData = {
        name: 'Updated Product Name'
      }

      const response = await request(app)
        .put('/products/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('not found'),
        errorCode: 'NOT_FOUND',
        timestamp: expect.any(String)
      })
    })

    it('should validate update data', async () => {
      const invalidData = {
        name: '', // Empty name should be invalid
        price: -100 // Negative price should be invalid
      }

      const response = await request(app)
        .put(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Object),
        timestamp: expect.any(String)
      })
    })

    it('should require authentication', async () => {
      const updateData = {
        name: 'Updated Product Name'
      }

      const response = await request(app)
        .put(`/products/${testProductId}`)
        .send(updateData)
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('No token provided'),
        errorCode: 'UNAUTHORIZED',
        timestamp: expect.any(String)
      })
    })
  })

  describe('DELETE /products/:id', () => {
    beforeEach(async () => {
      // Create a test product
      authToken = await createAuthenticatedUser()
      
      const productData = {
        name: 'Test Product for Delete',
        description: 'A test product for delete',
        price: 199.99,
        currency: 'USD',
        sku: `DELETE-TEST-${Date.now()}`,
        category: 'Electronics',
        stockQuantity: 100
      }

      const createResponse = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)

      testProductId = createResponse.body.data.product.id
    })

    it('should delete product successfully', async () => {
      const response = await request(app)
        .delete(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('deleted successfully'),
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })

      // Verify product is deleted
      await request(app)
        .get(`/products/${testProductId}`)
        .expect(404)
    })

    it('should handle non-existent product ID', async () => {
      const response = await request(app)
        .delete('/products/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('not found'),
        errorCode: 'NOT_FOUND',
        timestamp: expect.any(String)
      })
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/products/${testProductId}`)
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('No token provided'),
        errorCode: 'UNAUTHORIZED',
        timestamp: expect.any(String)
      })
    })
  })

  describe('GET /products/stats', () => {
    beforeEach(async () => {
      // Create test products for stats
      authToken = await createAuthenticatedUser()
      
      const products = [
        {
          name: 'Active Product 1',
          description: 'Active product',
          price: 100,
          currency: 'USD',
          sku: `ACTIVE-1-${Date.now()}`,
          category: 'Electronics',
          stockQuantity: 50
        },
        {
          name: 'Active Product 2',
          description: 'Another active product',
          price: 200,
          currency: 'USD',
          sku: `ACTIVE-2-${Date.now()}`,
          category: 'Books',
          stockQuantity: 25
        }
      ]

      for (const product of products) {
        await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(product)
      }
    })

    it('should get product statistics', async () => {
      const response = await request(app)
        .get('/products/stats')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          stats: {
            totalProducts: expect.any(Number),
            activeProducts: expect.any(Number),
            inactiveProducts: expect.any(Number),
            totalValue: expect.any(Number),
            uniqueCategories: expect.any(Number),
            categories: expect.any(Array)
          }
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })

      const stats = response.body.data.stats
      expect(stats.totalProducts).toBeGreaterThan(0)
      expect(stats.activeProducts).toBeGreaterThan(0)
      expect(stats.uniqueCategories).toBeGreaterThan(0)
      expect(stats.categories.length).toBeGreaterThan(0)
    })
  })

  describe('GET /products/categories', () => {
    beforeEach(async () => {
      // Create test products with different categories
      authToken = await createAuthenticatedUser()
      
      const products = [
        {
          name: 'Electronics Product',
          description: 'Electronics category product',
          price: 100,
          currency: 'USD',
          sku: `CAT-ELEC-${Date.now()}`,
          category: 'Electronics',
          stockQuantity: 50
        },
        {
          name: 'Books Product',
          description: 'Books category product',
          price: 50,
          currency: 'USD',
          sku: `CAT-BOOKS-${Date.now()}`,
          category: 'Books',
          stockQuantity: 25
        }
      ]

      for (const product of products) {
        await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(product)
      }
    })

    it('should get product categories', async () => {
      const response = await request(app)
        .get('/products/categories')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          categories: expect.any(Array)
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })

      const categories = response.body.data.categories
      expect(categories.length).toBeGreaterThan(0)
      expect(categories).toContain('Electronics')
      expect(categories).toContain('Books')
    })
  })

  describe('GET /products/active', () => {
    beforeEach(async () => {
      // Create test products
      authToken = await createAuthenticatedUser()
      
      const products = [
        {
          name: 'Active Product 1',
          description: 'Active product',
          price: 100,
          currency: 'USD',
          sku: `ACTIVE-1-${Date.now()}`,
          category: 'Electronics',
          stockQuantity: 50
        },
        {
          name: 'Active Product 2',
          description: 'Another active product',
          price: 200,
          currency: 'USD',
          sku: `ACTIVE-2-${Date.now()}`,
          category: 'Books',
          stockQuantity: 25
        }
      ]

      for (const product of products) {
        await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(product)
      }
    })

    it('should get active products', async () => {
      const response = await request(app)
        .get('/products/active')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          products: expect.any(Array),
          pagination: expect.any(Object)
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })

      const products = response.body.data.products
      expect(products.length).toBeGreaterThan(0)
      
      // All returned products should be active
      products.forEach((product: any) => {
        expect(product.isActive).toBe(true)
      })
    })

    it('should filter active products by category', async () => {
      const response = await request(app)
        .get('/products/active')
        .query({ category: 'Electronics' })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          products: expect.any(Array),
          pagination: expect.any(Object)
        }
      })

      const products = response.body.data.products
      expect(products.length).toBeGreaterThan(0)
      
      // All returned products should be active and in Electronics category
      products.forEach((product: any) => {
        expect(product.isActive).toBe(true)
        expect(product.category).toBe('Electronics')
      })
    })
  })

  describe('GET /products/low-stock', () => {
    beforeEach(async () => {
      // Create test products with low stock
      authToken = await createAuthenticatedUser()
      
      const products = [
        {
          name: 'Low Stock Product 1',
          description: 'Product with low stock',
          price: 100,
          currency: 'USD',
          sku: `LOW-1-${Date.now()}`,
          category: 'Electronics',
          stockQuantity: 5
        },
        {
          name: 'Low Stock Product 2',
          description: 'Another product with low stock',
          price: 200,
          currency: 'USD',
          sku: `LOW-2-${Date.now()}`,
          category: 'Books',
          stockQuantity: 3
        }
      ]

      for (const product of products) {
        await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(product)
      }
    })

    it('should get low stock products with default threshold', async () => {
      const response = await request(app)
        .get('/products/low-stock')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          products: expect.any(Array),
          pagination: expect.any(Object)
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })

      const products = response.body.data.products
      expect(products.length).toBeGreaterThan(0)
      
      // All returned products should have low stock (default threshold is 10)
      products.forEach((product: any) => {
        expect(product.stockQuantity).toBeLessThanOrEqual(10)
      })
    })

    it('should get low stock products with custom threshold', async () => {
      const response = await request(app)
        .get('/products/low-stock')
        .query({ threshold: 20 })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          products: expect.any(Array),
          pagination: expect.any(Object)
        }
      })

      const products = response.body.data.products
      expect(products.length).toBeGreaterThan(0)
      
      // All returned products should have stock below custom threshold
      products.forEach((product: any) => {
        expect(product.stockQuantity).toBeLessThanOrEqual(20)
      })
    })
  })

  describe('PATCH /products/:id/stock', () => {
    beforeEach(async () => {
      // Create a test product
      authToken = await createAuthenticatedUser()
      
      const productData = {
        name: 'Stock Test Product',
        description: 'A test product for stock updates',
        price: 199.99,
        currency: 'USD',
        sku: `STOCK-TEST-${Date.now()}`,
        category: 'Electronics',
        stockQuantity: 100
      }

      const createResponse = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)

      testProductId = createResponse.body.data.product.id
    })

    it('should add stock successfully', async () => {
      const stockData = {
        quantity: 50,
        operation: 'add'
      }

      const response = await request(app)
        .patch(`/products/${testProductId}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(stockData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Stock updated successfully'),
        data: {
          product: {
            id: testProductId,
            stockQuantity: 150 // 100 + 50
          }
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })
    })

    it('should subtract stock successfully', async () => {
      const stockData = {
        quantity: 30,
        operation: 'subtract'
      }

      const response = await request(app)
        .patch(`/products/${testProductId}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(stockData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Stock updated successfully'),
        data: {
          product: {
            id: testProductId,
            stockQuantity: 70 // 100 - 30
          }
        },
        timestamp: expect.any(String)
      })
    })

    it('should handle insufficient stock for subtraction', async () => {
      const stockData = {
        quantity: 150, // More than available stock (100)
        operation: 'subtract'
      }

      const response = await request(app)
        .patch(`/products/${testProductId}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(stockData)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Insufficient stock'),
        errorCode: 'VALIDATION_ERROR',
        timestamp: expect.any(String)
      })
    })

    it('should validate stock update data', async () => {
      const invalidData = {
        quantity: -10, // Negative quantity should be invalid
        operation: 'invalid' // Invalid operation
      }

      const response = await request(app)
        .patch(`/products/${testProductId}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Object),
        timestamp: expect.any(String)
      })
    })

    it('should require authentication', async () => {
      const stockData = {
        quantity: 50,
        operation: 'add'
      }

      const response = await request(app)
        .patch(`/products/${testProductId}/stock`)
        .send(stockData)
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('No token provided'),
        errorCode: 'UNAUTHORIZED',
        timestamp: expect.any(String)
      })
    })
  })

  describe('GET /products/:id/availability', () => {
    beforeEach(async () => {
      // Create a test product
      authToken = await createAuthenticatedUser()
      
      const productData = {
        name: 'Availability Test Product',
        description: 'A test product for availability check',
        price: 199.99,
        currency: 'USD',
        sku: `AVAIL-TEST-${Date.now()}`,
        category: 'Electronics',
        stockQuantity: 50
      }

      const createResponse = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)

      testProductId = createResponse.body.data.product.id
    })

    it('should check product availability successfully', async () => {
      const response = await request(app)
        .get(`/products/${testProductId}/availability`)
        .query({ quantity: 10 })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          available: true,
          requestedQuantity: 10,
          availableQuantity: 50,
          product: {
            id: testProductId,
            name: 'Availability Test Product',
            stockQuantity: 50
          }
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })
    })

    it('should handle insufficient stock', async () => {
      const response = await request(app)
        .get(`/products/${testProductId}/availability`)
        .query({ quantity: 100 }) // More than available stock (50)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          available: false,
          requestedQuantity: 100,
          availableQuantity: 50,
          product: {
            id: testProductId,
            stockQuantity: 50
          }
        },
        timestamp: expect.any(String)
      })
    })

    it('should handle non-existent product', async () => {
      const response = await request(app)
        .get('/products/non-existent-id/availability')
        .query({ quantity: 10 })
        .expect(404)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('not found'),
        errorCode: 'NOT_FOUND',
        timestamp: expect.any(String)
      })
    })

    it('should validate quantity parameter', async () => {
      const response = await request(app)
        .get(`/products/${testProductId}/availability`)
        .query({ quantity: -10 }) // Negative quantity should be invalid
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Object),
        timestamp: expect.any(String)
      })
    })
  })
})
