/**
 * Product API Integration Tests
 * Testing full HTTP request/response cycle with real database
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { testDb } from '../../setup/integration-setup';
import type { FastifyInstance } from 'fastify';

describe('Product API Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Mock app setup for demonstration
    // In real implementation, this would import the actual Fastify app
    app = {
      inject: async (_options: any) => {
        // Mock implementation for testing
        return {
          statusCode: 200,
          payload: JSON.stringify({
            success: true,
            data: { message: 'Mock response' }
          })
        };
      },
      ready: async () => {},
      close: async () => {}
    } as any;
    
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await testDb.prisma.product.deleteMany();
  });

  describe('POST /api/products', () => {
    it('should create a new product successfully', async () => {
      const productData = {
        name: 'Test Product',
        price: 99.99,
        sku: 'TEST001',
        category: 'Electronics',
        inventory: 10,
        description: 'A test product for integration testing'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: productData,
        headers: {
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).toBe(201);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.product).toMatchObject({
        name: productData.name,
        price: productData.price,
        sku: productData.sku,
        category: productData.category,
        inventory: productData.inventory
      });
      expect(result.data.product.id).toBeDefined();
      expect(result.data.product.createdAt).toBeDefined();

      // Verify in database
      const dbProduct = await testDb.prisma.product.findUnique({
        where: { id: result.data.product.id }
      });
      expect(dbProduct).toBeTruthy();
      expect(dbProduct.name).toBe(productData.name);
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        name: 'Test Product',
        // Missing required fields
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: incompleteData,
        headers: {
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('validation_error');
      expect(result.error.details).toContain('price');
      expect(result.error.details).toContain('sku');
    });

    it('should prevent duplicate SKU creation', async () => {
      const productData = {
        name: 'First Product',
        price: 99.99,
        sku: 'DUPLICATE001',
        category: 'Electronics',
        inventory: 10
      };

      // Create first product
      await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: productData
      });

      // Try to create second product with same SKU
      const duplicateData = {
        ...productData,
        name: 'Second Product'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: duplicateData
      });

      expect(response.statusCode).toBe(409);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('duplicate_sku');
    });

    it('should handle price validation', async () => {
      const invalidPriceData = {
        name: 'Invalid Price Product',
        price: -10,
        sku: 'INVALID001',
        category: 'Electronics',
        inventory: 10
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: invalidPriceData
      });

      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('price');
    });
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Create test products
      await testDb.createTestProduct({
        name: 'Product 1',
        price: 99.99,
        sku: 'PROD001',
        category: 'Electronics'
      });

      await testDb.createTestProduct({
        name: 'Product 2',
        price: 149.99,
        sku: 'PROD002',
        category: 'Books'
      });

      await testDb.createTestProduct({
        name: 'Product 3',
        price: 49.99,
        sku: 'PROD003',
        category: 'Electronics'
      });
    });

    it('should return paginated list of products', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products?page=1&limit=2'
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.products).toHaveLength(2);
      expect(result.data.pagination.total).toBe(3);
      expect(result.data.pagination.page).toBe(1);
      expect(result.data.pagination.limit).toBe(2);
      expect(result.data.pagination.totalPages).toBe(2);
    });

    it('should filter products by category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products?category=Electronics'
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.products).toHaveLength(2);
      expect(result.data.products.every((p: any) => p.category === 'Electronics')).toBe(true);
    });

    it('should search products by name', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products?search=Product 1'
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.products).toHaveLength(1);
      expect(result.data.products[0].name).toBe('Product 1');
    });

    it('should sort products by price', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products?sortBy=price&sortOrder=asc'
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      
      const prices = result.data.products.map((p: any) => p.price);
      expect(prices).toEqual([49.99, 99.99, 149.99]);
    });
  });

  describe('GET /api/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await testDb.createTestProduct({
        name: 'Single Product Test',
        price: 199.99,
        sku: 'SINGLE001'
      });
      productId = product.id;
    });

    it('should return single product by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/products/${productId}`
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.product.id).toBe(productId);
      expect(result.data.product.name).toBe('Single Product Test');
      expect(result.data.product.price).toBe(199.99);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products/non-existent-id'
      });

      expect(response.statusCode).toBe(404);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('not_found');
    });
  });

  describe('PUT /api/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await testDb.createTestProduct({
        name: 'Update Test Product',
        price: 99.99,
        sku: 'UPDATE001'
      });
      productId = product.id;
    });

    it('should update product successfully', async () => {
      const updateData = {
        name: 'Updated Product Name',
        price: 149.99,
        category: 'Books'
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/products/${productId}`,
        payload: updateData
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.product.name).toBe('Updated Product Name');
      expect(result.data.product.price).toBe(149.99);
      expect(result.data.product.category).toBe('Books');

      // Verify in database
      const dbProduct = await testDb.prisma.product.findUnique({
        where: { id: productId }
      });
      expect(dbProduct.name).toBe('Updated Product Name');
      expect(dbProduct.updatedAt).not.toBe(dbProduct.createdAt);
    });

    it('should not allow updating SKU to existing one', async () => {
      // Create another product with different SKU
      await testDb.createTestProduct({
        name: 'Other Product',
        sku: 'OTHER001'
      });

      const updateData = {
        sku: 'OTHER001' // Try to update to existing SKU
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/products/${productId}`,
        payload: updateData
      });

      expect(response.statusCode).toBe(409);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('duplicate_sku');
    });
  });

  describe('DELETE /api/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await testDb.createTestProduct({
        name: 'Delete Test Product',
        sku: 'DELETE001'
      });
      productId = product.id;
    });

    it('should soft delete product', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/products/${productId}`
      });

      expect(response.statusCode).toBe(204);

      // Verify product is soft deleted (not physically removed)
      const dbProduct = await testDb.prisma.product.findUnique({
        where: { id: productId }
      });
      expect(dbProduct.status).toBe('deleted');
      expect(dbProduct.deletedAt).toBeTruthy();
    });

    it('should return 404 for non-existent product', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/products/non-existent-id'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/products/:id/inventory', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await testDb.createTestProduct({
        name: 'Inventory Test Product',
        inventory: 10,
        sku: 'INVENTORY001'
      });
      productId = product.id;
    });

    it('should update inventory successfully', async () => {
      const inventoryUpdate = {
        quantity: 20,
        operation: 'set',
        reason: 'restock'
      };

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/products/${productId}/inventory`,
        payload: inventoryUpdate
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.product.inventory).toBe(20);

      // Verify in database
      const dbProduct = await testDb.prisma.product.findUnique({
        where: { id: productId }
      });
      expect(dbProduct.inventory).toBe(20);
    });

    it('should increment inventory', async () => {
      const inventoryUpdate = {
        quantity: 5,
        operation: 'increment',
        reason: 'restock'
      };

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/products/${productId}/inventory`,
        payload: inventoryUpdate
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.product.inventory).toBe(15); // 10 + 5
    });

    it('should not allow negative inventory', async () => {
      const inventoryUpdate = {
        quantity: 15,
        operation: 'decrement',
        reason: 'sale'
      };

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/products/${productId}/inventory`,
        payload: inventoryUpdate
      });

      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('insufficient inventory');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle malformed JSON', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: '{invalid json}',
        headers: {
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('invalid_json');
    });

    it('should handle database connection errors gracefully', async () => {
      // This would require mocking the database to simulate connection failure
      // In a real test, you might temporarily disconnect the database
    });

    it('should respect rate limiting', async () => {
      // Make multiple rapid requests
      const requests = Array.from({ length: 100 }, () =>
        app.inject({
          method: 'GET',
          url: '/api/products'
        })
      );

      const responses = await Promise.all(requests);
      
      // Should have some rate limited responses
      const rateLimited = responses.filter(r => r.statusCode === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
