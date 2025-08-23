/**
 * Advanced E-Commerce Platform - API Integration Tests
 * Comprehensive test suite for all advanced features
 */

const { test, before, after } = require('tap');
const { ECommerceAPIServer } = require('../src/features/api');
const { build } = require('fastify');

let app;

before(async () => {
  const server = new ECommerceAPIServer({
    port: 0, // Use random port for testing
    logger: false
  });
  
  app = await server.initialize();
});

after(async () => {
  if (app) {
    await app.close();
  }
});

test('Health check endpoint', async (t) => {
  const response = await app.inject({
    method: 'GET',
    url: '/health'
  });

  t.equal(response.statusCode, 200);
  const data = JSON.parse(response.payload);
  t.equal(data.status, 'healthy');
  t.ok(data.timestamp);
  t.equal(data.version, '1.0.0');
});

test('Product lifecycle', async (t) => {
  // Create product
  const createResponse = await app.inject({
    method: 'POST',
    url: '/api/v1/products',
    payload: {
      name: 'Test Product',
      sku: 'TEST-001',
      price: 99.99,
      currency: 'USD',
      initialQuantity: 100,
      description: 'A test product for advanced e-commerce',
      categoryId: 'electronics'
    }
  });

  t.equal(createResponse.statusCode, 201);
  const product = JSON.parse(createResponse.payload);
  t.ok(product.productId);
  t.equal(product.name, 'Test Product');
  t.equal(product.sku, 'TEST-001');
  t.equal(product.price, 99.99);

  // Get product by ID
  const getResponse = await app.inject({
    method: 'GET',
    url: `/api/v1/products/${product.productId}`
  });

  t.equal(getResponse.statusCode, 200);
  const retrievedProduct = JSON.parse(getResponse.payload);
  t.equal(retrievedProduct.id, product.productId);

  // Update product price
  const priceUpdateResponse = await app.inject({
    method: 'PUT',
    url: `/api/v1/products/${product.productId}/price`,
    payload: {
      newPrice: 79.99,
      currency: 'USD',
      reason: 'Promotional pricing'
    }
  });

  t.equal(priceUpdateResponse.statusCode, 200);
  const priceUpdate = JSON.parse(priceUpdateResponse.payload);
  t.equal(priceUpdate.newPrice, 79.99);
});

test('Order lifecycle', async (t) => {
  // First create a product for the order
  const productResponse = await app.inject({
    method: 'POST',
    url: '/api/v1/products',
    payload: {
      name: 'Order Test Product',
      sku: 'ORDER-001',
      price: 49.99,
      currency: 'USD',
      initialQuantity: 50
    }
  });

  const product = JSON.parse(productResponse.payload);

  // Create order
  const createOrderResponse = await app.inject({
    method: 'POST',
    url: '/api/v1/orders',
    payload: {
      customerId: 'customer-123',
      lineItems: [
        {
          productId: product.productId,
          quantity: 2
        }
      ],
      shippingAddress: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        country: 'USA',
        postalCode: '12345'
      }
    }
  });

  t.equal(createOrderResponse.statusCode, 201);
  const order = JSON.parse(createOrderResponse.payload);
  t.ok(order.orderId);
  t.ok(order.orderNumber);
  t.equal(order.customerId, 'customer-123');
  t.equal(order.status, 'PENDING');

  // Get order by ID
  const getOrderResponse = await app.inject({
    method: 'GET',
    url: `/api/v1/orders/${order.orderId}`
  });

  t.equal(getOrderResponse.statusCode, 200);

  // Confirm order
  const confirmResponse = await app.inject({
    method: 'POST',
    url: `/api/v1/orders/${order.orderId}/confirm`,
    payload: {
      paymentConfirmation: {
        transactionId: 'txn_123456789',
        amount: order.total,
        currency: order.currency
      }
    }
  });

  t.equal(confirmResponse.statusCode, 200);
  const confirmedOrder = JSON.parse(confirmResponse.payload);
  t.equal(confirmedOrder.status, 'CONFIRMED');

  // Ship order
  const shipResponse = await app.inject({
    method: 'POST',
    url: `/api/v1/orders/${order.orderId}/ship`,
    payload: {
      trackingNumber: 'TRK123456789',
      carrier: 'UPS'
    }
  });

  t.equal(shipResponse.statusCode, 200);
  const shippedOrder = JSON.parse(shipResponse.payload);
  t.equal(shippedOrder.status, 'SHIPPED');
  t.equal(shippedOrder.trackingNumber, 'TRK123456789');
});

test('Advanced search functionality', async (t) => {
  // Create some test products first
  const products = [
    {
      name: 'iPhone 15 Pro',
      sku: 'APPLE-001',
      price: 999.99,
      currency: 'USD',
      initialQuantity: 25,
      description: 'Latest Apple smartphone with advanced features'
    },
    {
      name: 'Samsung Galaxy S24',
      sku: 'SAMSUNG-001',
      price: 899.99,
      currency: 'USD',
      initialQuantity: 30,
      description: 'Premium Android smartphone with excellent camera'
    },
    {
      name: 'MacBook Pro 16',
      sku: 'APPLE-002',
      price: 2499.99,
      currency: 'USD',
      initialQuantity: 10,
      description: 'Professional laptop for developers and creators'
    }
  ];

  // Create all products
  for (const productData of products) {
    await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      payload: productData
    });
  }

  // Test search functionality
  const searchResponse = await app.inject({
    method: 'GET',
    url: '/api/v1/search/products?q=smartphone&limit=10'
  });

  t.equal(searchResponse.statusCode, 200);
  const searchResults = JSON.parse(searchResponse.payload);
  t.ok(searchResults.products);
  t.ok(Array.isArray(searchResults.products));
  t.ok(searchResults.total >= 0);
  t.equal(searchResults.offset, 0);
  t.equal(searchResults.limit, 10);
});

test('Error handling', async (t) => {
  // Test 404 for non-existent product
  const notFoundResponse = await app.inject({
    method: 'GET',
    url: '/api/v1/products/non-existent-id'
  });

  t.equal(notFoundResponse.statusCode, 404);
  const error = JSON.parse(notFoundResponse.payload);
  t.equal(error.error, 'Product not found');

  // Test validation error for invalid product creation
  const validationResponse = await app.inject({
    method: 'POST',
    url: '/api/v1/products',
    payload: {
      name: '', // Invalid empty name
      sku: 'XX', // Invalid short SKU
      price: -10, // Invalid negative price
      currency: 'INVALID'
    }
  });

  t.equal(validationResponse.statusCode, 400);
  const validationError = JSON.parse(validationResponse.payload);
  t.ok(validationError.error);
});

test('Rate limiting', async (t) => {
  // Make multiple rapid requests to test rate limiting
  const requests = [];
  for (let i = 0; i < 105; i++) { // Exceed the 100 requests per minute limit
    requests.push(
      app.inject({
        method: 'GET',
        url: '/health'
      })
    );
  }

  const responses = await Promise.all(requests);
  
  // Some requests should be rate limited
  const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
  t.ok(rateLimitedResponses.length > 0, 'Should have some rate limited responses');
});

test('CORS headers', async (t) => {
  const response = await app.inject({
    method: 'OPTIONS',
    url: '/api/v1/products',
    headers: {
      'Origin': 'https://example.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  });

  t.equal(response.statusCode, 204);
  t.ok(response.headers['access-control-allow-origin']);
  t.ok(response.headers['access-control-allow-methods']);
  t.ok(response.headers['access-control-allow-headers']);
});

test('Security headers', async (t) => {
  const response = await app.inject({
    method: 'GET',
    url: '/health'
  });

  t.ok(response.headers['x-frame-options']);
  t.ok(response.headers['x-content-type-options']);
  t.ok(response.headers['x-xss-protection']);
});

test('API documentation', async (t) => {
  const docsResponse = await app.inject({
    method: 'GET',
    url: '/docs'
  });

  t.equal(docsResponse.statusCode, 200);
  t.ok(docsResponse.payload.includes('swagger'));
});

test('Performance monitoring', async (t) => {
  const start = Date.now();
  
  const response = await app.inject({
    method: 'GET',
    url: '/health'
  });

  const duration = Date.now() - start;
  
  t.equal(response.statusCode, 200);
  t.ok(duration < 100, 'Health check should respond in under 100ms');
});

test('Memory usage monitoring', async (t) => {
  const initialMemory = process.memoryUsage().heapUsed;
  
  // Create and process multiple products to test memory management
  for (let i = 0; i < 50; i++) {
    await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      payload: {
        name: `Memory Test Product ${i}`,
        sku: `MEM-${i.toString().padStart(3, '0')}`,
        price: 29.99,
        currency: 'USD',
        initialQuantity: 100
      }
    });
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;
  
  // Memory increase should be reasonable (less than 50MB)
  t.ok(memoryIncrease < 50 * 1024 * 1024, 'Memory usage should remain reasonable');
});

test('Concurrent operations', async (t) => {
  // Test concurrent product creation
  const concurrentRequests = [];
  
  for (let i = 0; i < 20; i++) {
    concurrentRequests.push(
      app.inject({
        method: 'POST',
        url: '/api/v1/products',
        payload: {
          name: `Concurrent Product ${i}`,
          sku: `CONC-${i.toString().padStart(3, '0')}`,
          price: 19.99,
          currency: 'USD',
          initialQuantity: 50
        }
      })
    );
  }

  const responses = await Promise.all(concurrentRequests);
  
  // All requests should succeed
  const successfulResponses = responses.filter(r => r.statusCode === 201);
  t.equal(successfulResponses.length, 20, 'All concurrent requests should succeed');
  
  // All should have unique product IDs
  const productIds = successfulResponses.map(r => JSON.parse(r.payload).productId);
  const uniqueIds = new Set(productIds);
  t.equal(uniqueIds.size, 20, 'All products should have unique IDs');
});
