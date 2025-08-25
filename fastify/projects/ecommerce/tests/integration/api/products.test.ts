/**
 * Product API Integration Tests
 * Testing HTTP endpoints with database integration
 */

import { test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fastify, { type FastifyInstance } from 'fastify';

// Mock database for integration testing
interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  category: string;
  inventory: number;
  status: 'active' | 'inactive' | 'discontinued';
  createdAt: string;
  updatedAt: string;
}

class MockDatabase {
  private products: Map<string, Product> = new Map();

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  async findAll(options: { category?: string; status?: string } = {}): Promise<Product[]> {
    let products = Array.from(this.products.values());
    
    if (options.category) {
      products = products.filter(p => p.category === options.category);
    }
    
    if (options.status) {
      products = products.filter(p => p.status === options.status);
    }
    
    return products;
  }

  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const product: Product = {
      ...data,
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.products.set(product.id, product);
    return product;
  }

  async update(id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product | null> {
    const existing = this.products.get(id);
    if (!existing) return null;

    const updated: Product = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    this.products.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async clear(): Promise<void> {
    this.products.clear();
  }
}

// Mock service layer
class ProductService {
  constructor(private db: MockDatabase) {}

  async getAllProducts(query: { category?: string; status?: string } = {}) {
    return this.db.findAll(query);
  }

  async getProductById(id: string) {
    const product = await this.db.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async createProduct(data: {
    name: string;
    price: number;
    sku: string;
    category: string;
    inventory: number;
  }) {
    // Business validation
    if (data.price <= 0) {
      throw new Error('Price must be positive');
    }
    if (!data.sku || data.sku.length < 6) {
      throw new Error('SKU must be at least 6 characters');
    }
    if (!data.name.trim()) {
      throw new Error('Product name is required');
    }

    return this.db.create({
      ...data,
      status: 'active'
    });
  }

  async updateProduct(id: string, data: Partial<{
    name: string;
    price: number;
    inventory: number;
    status: 'active' | 'inactive' | 'discontinued';
  }>) {
    const product = await this.db.update(id, data);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async deleteProduct(id: string) {
    const success = await this.db.delete(id);
    if (!success) {
      throw new Error('Product not found');
    }
  }
}

// Setup Fastify app for testing
async function createTestApp(): Promise<FastifyInstance> {
  const app = fastify({ logger: false });
  const db = new MockDatabase();
  const productService = new ProductService(db);

  // Register routes
  app.get('/api/products', async (request, reply) => {
    try {
      const query = request.query as { category?: string; status?: string };
      const products = await productService.getAllProducts(query);
      return { data: products, count: products.length };
    } catch (error) {
      reply.code(500).send({ error: (error as Error).message });
    }
  });

  app.get('/api/products/:id', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const product = await productService.getProductById(params.id);
      return { data: product };
    } catch (error) {
      reply.code(404).send({ error: (error as Error).message });
    }
  });

  app.post('/api/products', async (request, reply) => {
    try {
      const body = request.body as {
        name: string;
        price: number;
        sku: string;
        category: string;
        inventory: number;
      };
      
      const product = await productService.createProduct(body);
      reply.code(201).send({ data: product });
    } catch (error) {
      reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.put('/api/products/:id', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const body = request.body as Partial<{
        name: string;
        price: number;
        inventory: number;
        status: 'active' | 'inactive' | 'discontinued';
      }>;
      
      const product = await productService.updateProduct(params.id, body);
      return { data: product };
    } catch (error) {
      reply.code(404).send({ error: (error as Error).message });
    }
  });

  app.delete('/api/products/:id', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      await productService.deleteProduct(params.id);
      reply.code(204).send();
    } catch (error) {
      reply.code(404).send({ error: (error as Error).message });
    }
  });

  // Store references for testing
  (app as any).testDb = db;
  (app as any).productService = productService;

  return app;
}

describe('Product API Integration Tests', () => {
  let app: FastifyInstance;
  let db: MockDatabase;

  beforeAll(async () => {
    app = await createTestApp();
    db = (app as any).testDb;
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await db.clear();
  });

  describe('GET /api/products', () => {
    test('should return empty list when no products exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual([]);
      expect(body.count).toBe(0);
    });

    test('should return list of products', async () => {
      // Create test data
      await db.create({
        name: 'Test Product 1',
        price: 99.99,
        sku: 'TEST001',
        category: 'Electronics',
        inventory: 10,
        status: 'active'
      });

      await db.create({
        name: 'Test Product 2',
        price: 149.99,
        sku: 'TEST002',
        category: 'Electronics',
        inventory: 5,
        status: 'active'
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/products'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      expect(body.count).toBe(2);
      expect(body.data[0].name).toBe('Test Product 1');
      expect(body.data[1].name).toBe('Test Product 2');
    });

    test('should filter products by category', async () => {
      await db.create({
        name: 'Electronics Product',
        price: 99.99,
        sku: 'ELEC001',
        category: 'Electronics',
        inventory: 10,
        status: 'active'
      });

      await db.create({
        name: 'Books Product',
        price: 19.99,
        sku: 'BOOK001',
        category: 'Books',
        inventory: 20,
        status: 'active'
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/products?category=Electronics'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].category).toBe('Electronics');
    });

    test('should filter products by status', async () => {
      await db.create({
        name: 'Active Product',
        price: 99.99,
        sku: 'ACTV001',
        category: 'Electronics',
        inventory: 10,
        status: 'active'
      });

      await db.create({
        name: 'Inactive Product',
        price: 149.99,
        sku: 'INAC001',
        category: 'Electronics',
        inventory: 5,
        status: 'inactive'
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/products?status=active'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].status).toBe('active');
    });
  });

  describe('GET /api/products/:id', () => {
    test('should return product by id', async () => {
      const product = await db.create({
        name: 'Test Product',
        price: 99.99,
        sku: 'TEST001',
        category: 'Electronics',
        inventory: 10,
        status: 'active'
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/products/${product.id}`
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.id).toBe(product.id);
      expect(body.data.name).toBe('Test Product');
    });

    test('should return 404 for non-existent product', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products/non-existent'
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Product not found');
    });
  });

  describe('POST /api/products', () => {
    test('should create new product', async () => {
      const productData = {
        name: 'New Product',
        price: 99.99,
        sku: 'NEW001',
        category: 'Electronics',
        inventory: 10
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: productData
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.name).toBe('New Product');
      expect(body.data.price).toBe(99.99);
      expect(body.data.status).toBe('active');
      expect(body.data.id).toBeDefined();
      expect(body.data.createdAt).toBeDefined();
    });

    test('should reject product with invalid price', async () => {
      const productData = {
        name: 'Invalid Product',
        price: -10,
        sku: 'INVALID001',
        category: 'Electronics',
        inventory: 10
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: productData
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Price must be positive');
    });

    test('should reject product with invalid SKU', async () => {
      const productData = {
        name: 'Invalid Product',
        price: 99.99,
        sku: 'SHORT',
        category: 'Electronics',
        inventory: 10
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: productData
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('SKU must be at least 6 characters');
    });

    test('should reject product with empty name', async () => {
      const productData = {
        name: '',
        price: 99.99,
        sku: 'EMPTY001',
        category: 'Electronics',
        inventory: 10
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: productData
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Product name is required');
    });
  });

  describe('PUT /api/products/:id', () => {
    test('should update existing product', async () => {
      const product = await db.create({
        name: 'Original Product',
        price: 99.99,
        sku: 'ORIG001',
        category: 'Electronics',
        inventory: 10,
        status: 'active'
      });

      const updateData = {
        name: 'Updated Product',
        price: 149.99,
        inventory: 15
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/products/${product.id}`,
        payload: updateData
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.name).toBe('Updated Product');
      expect(body.data.price).toBe(149.99);
      expect(body.data.inventory).toBe(15);
      expect(body.data.sku).toBe('ORIG001'); // Should remain unchanged
    });

    test('should return 404 for non-existent product', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/products/non-existent',
        payload: { name: 'Updated' }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Product not found');
    });

    test('should update product status', async () => {
      const product = await db.create({
        name: 'Test Product',
        price: 99.99,
        sku: 'TEST001',
        category: 'Electronics',
        inventory: 10,
        status: 'active'
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/products/${product.id}`,
        payload: { status: 'inactive' }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.status).toBe('inactive');
    });
  });

  describe('DELETE /api/products/:id', () => {
    test('should delete existing product', async () => {
      const product = await db.create({
        name: 'To Delete',
        price: 99.99,
        sku: 'DEL001',
        category: 'Electronics',
        inventory: 10,
        status: 'active'
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/products/${product.id}`
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');

      // Verify product is deleted
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/products/${product.id}`
      });
      expect(getResponse.statusCode).toBe(404);
    });

    test('should return 404 for non-existent product', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/products/non-existent'
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Product not found');
    });
  });

  describe('complex scenarios', () => {
    test('should handle complete product lifecycle', async () => {
      // Create product
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          name: 'Lifecycle Product',
          price: 99.99,
          sku: 'LIFE001',
          category: 'Electronics',
          inventory: 10
        }
      });

      expect(createResponse.statusCode).toBe(201);
      const product = JSON.parse(createResponse.body).data;

      // Update product
      const updateResponse = await app.inject({
        method: 'PUT',
        url: `/api/products/${product.id}`,
        payload: {
          name: 'Updated Lifecycle Product',
          price: 149.99,
          inventory: 20
        }
      });

      expect(updateResponse.statusCode).toBe(200);

      // Get updated product
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/products/${product.id}`
      });

      expect(getResponse.statusCode).toBe(200);
      const updatedProduct = JSON.parse(getResponse.body).data;
      expect(updatedProduct.name).toBe('Updated Lifecycle Product');
      expect(updatedProduct.price).toBe(149.99);
      expect(updatedProduct.inventory).toBe(20);

      // Deactivate product
      const deactivateResponse = await app.inject({
        method: 'PUT',
        url: `/api/products/${product.id}`,
        payload: { status: 'inactive' }
      });

      expect(deactivateResponse.statusCode).toBe(200);

      // Delete product
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: `/api/products/${product.id}`
      });

      expect(deleteResponse.statusCode).toBe(204);
    });

    test('should handle concurrent operations', async () => {
      const product = await db.create({
        name: 'Concurrent Test',
        price: 99.99,
        sku: 'CONC001',
        category: 'Electronics',
        inventory: 10,
        status: 'active'
      });

      // Simulate concurrent updates
      const updates = [
        app.inject({
          method: 'PUT',
          url: `/api/products/${product.id}`,
          payload: { inventory: 15 }
        }),
        app.inject({
          method: 'PUT',
          url: `/api/products/${product.id}`,
          payload: { price: 129.99 }
        }),
        app.inject({
          method: 'GET',
          url: `/api/products/${product.id}`
        })
      ];

      const responses = await Promise.all(updates);

      // All operations should succeed
      expect(responses[0].statusCode).toBe(200);
      expect(responses[1].statusCode).toBe(200);
      expect(responses[2].statusCode).toBe(200);
    });
  });
});
