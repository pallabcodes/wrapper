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

describe('Product API Simple Integration Tests', () => {
  let authToken: string
  let testProductId: string

  beforeAll(async () => {
    logger.info('Setting up simple product integration tests')
  })

  afterAll(async () => {
    logger.info('Cleaning up simple product integration tests')
  })

  beforeEach(async () => {
    authToken = ''
    testProductId = ''
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
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBeDefined()
      expect(response.body.data).toBeDefined()
      expect(response.body.data.name).toBe(productData.name)
      expect(response.body.data.description).toBe(productData.description)
      expect(response.body.data.price).toBe(productData.price)
      expect(response.body.data.currency).toBe(productData.currency)
      expect(response.body.data.sku).toBe(productData.sku)
      expect(response.body.data.category).toBe(productData.category)
      expect(response.body.data.stockQuantity).toBe(productData.stockQuantity)

      testProductId = response.body.data.id
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

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('No token provided')
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

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBeDefined()
      expect(response.body.data).toBeDefined()
      expect(response.body.data.products).toBeDefined()
      expect(response.body.data.products).toBeDefined()
      expect(response.body.data.total).toBeDefined()
      expect(response.body.data.page).toBeDefined()
      expect(response.body.data.limit).toBeDefined()
      expect(response.body.data.hasMore).toBeDefined()
      expect(Array.isArray(response.body.data.products)).toBe(true)
      expect(response.body.data.products.length).toBeGreaterThan(0)
      expect(response.body.data.products[0]).toHaveProperty('id')
      expect(response.body.data.products[0]).toHaveProperty('name')
      expect(response.body.data.products[0]).toHaveProperty('price')
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

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBeDefined()
      expect(response.body.data).toBeDefined()
      expect(response.body.data.products).toBeDefined()
      expect(Array.isArray(response.body.data.products)).toBe(true)
      expect(response.body.data.products.length).toBeGreaterThan(0)
      
      // Should find iPhone products
      const foundProducts = response.body.data.products
      foundProducts.forEach((product: any) => {
        expect(product.name.toLowerCase()).toContain('iphone')
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

      testProductId = createResponse.body.data.id
    })

    it('should get product by ID successfully', async () => {
      const response = await request(app)
        .get(`/products/${testProductId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBeDefined()
      expect(response.body.data).toBeDefined()
      expect(response.body.data).toBeDefined()
      expect(response.body.data.id).toBe(testProductId)
      expect(response.body.data.name).toBe('Test Product for Get')
      expect(response.body.data.description).toBe('A test product for get by ID')
      expect(response.body.data.price).toBe(199.99)
      expect(response.body.data.currency).toBe('USD')
      expect(response.body.data.category).toBe('Electronics')
      expect(response.body.data.stockQuantity).toBe(100)
    })

    it('should handle non-existent product ID', async () => {
      const response = await request(app)
        .get('/products/non-existent-id')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('not found')
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

      testProductId = createResponse.body.data.id
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

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBeDefined()
      expect(response.body.data).toBeDefined()
      expect(response.body.data).toBeDefined()
      expect(response.body.data.id).toBe(testProductId)
      expect(response.body.data.name).toBe('Updated Product Name')
      expect(response.body.data.description).toBe('Updated product description')
      expect(response.body.data.price).toBe(399.99)
    })

    it('should require authentication', async () => {
      const updateData = {
        name: 'Updated Product Name'
      }

      const response = await request(app)
        .put(`/products/${testProductId}`)
        .send(updateData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('No token provided')
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

      testProductId = createResponse.body.data.id
    })

    it('should delete product successfully', async () => {
      const response = await request(app)
        .delete(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('deleted successfully')

      // Verify product is deleted
      await request(app)
        .get(`/products/${testProductId}`)
        .expect(404)
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/products/${testProductId}`)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('No token provided')
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

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBeDefined()
      expect(response.body.data).toBeDefined()
      expect(response.body.data.totalProducts).toBeGreaterThan(0)
      expect(response.body.data.activeProducts).toBeGreaterThan(0)
      expect(response.body.data.uniqueCategories).toBeGreaterThan(0)
      expect(Array.isArray(response.body.data.categories)).toBe(true)
      expect(response.body.data.categories.length).toBeGreaterThan(0)
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

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBeDefined()
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
      expect(response.body.data).toContain('Electronics')
      expect(response.body.data).toContain('Books')
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

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBeDefined()
      expect(response.body.data).toBeDefined()
      expect(response.body.data.products).toBeDefined()
      expect(Array.isArray(response.body.data.products)).toBe(true)
      expect(response.body.data.products.length).toBeGreaterThan(0)
      
      // All returned products should be active
      response.body.data.products.forEach((product: any) => {
        expect(product.isActive).toBe(true)
      })
    })
  })
})
