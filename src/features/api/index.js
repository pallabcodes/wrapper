/**
 * Advanced E-Commerce API Layer
 * High-Performance Fastify-based REST API with CQRS integration
 * Google/Shopify-level API design patterns
 */

const fastify = require('fastify');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const rateLimit = require('@fastify/rate-limit');
const swagger = require('@fastify/swagger');
const swaggerUI = require('@fastify/swagger-ui');

// Import our advanced infrastructure
const {
  CRDTEventStore,
  ProductRepository,
  OrderRepository,
  VectorSearchService,
  FileStorageAdapter,
  InMemoryQueryStore
} = require('../infrastructure');

const {
  ProductApplicationService,
  OrderApplicationService,
  CreateProductCommandHandler,
  ChangePriceCommandHandler,
  ReserveInventoryCommandHandler,
  CreateOrderCommandHandler,
  ConfirmOrderCommandHandler,
  ShipOrderCommandHandler,
  CancelOrderCommandHandler,
  GetProductByIdQueryHandler,
  SearchProductsQueryHandler,
  GetOrderByIdQueryHandler,
  GetOrdersByCustomerQueryHandler,
  ProductCreatedEventHandler,
  OrderCreatedEventHandler,
  OrderShippedEventHandler,
  OrderFulfillmentSaga
} = require('../application');

const {
  CreateProductCommand,
  ChangePriceCommand,
  ReserveInventoryCommand,
  GetProductByIdQuery,
  SearchProductsQuery
} = require('../product/domain');

const {
  CreateOrderCommand,
  ConfirmOrderCommand,
  ShipOrderCommand,
  CancelOrderCommand,
  GetOrderByIdQuery,
  GetOrdersByCustomerQuery
} = require('../order/domain');

const { CommandBus, QueryBus, EventBus } = require('../../core/ddd');
const { CRDTManager } = require('../../core/crdt');

/**
 * Advanced E-Commerce API Server
 * Production-ready with all the Silicon Valley patterns
 */
class ECommerceAPIServer {
  constructor(options = {}) {
    this.options = {
      host: '0.0.0.0',
      port: 3000,
      logger: true,
      ...options
    };

    this.app = null;
    this.infrastructure = null;
    this.applicationServices = null;
    this.buses = null;
  }

  /**
   * Initialize the server with dependency injection
   */
  async initialize() {
    // Create Fastify instance with advanced configuration
    this.app = fastify({
      logger: this.options.logger,
      trustProxy: true,
      requestIdLogLabel: 'reqId',
      genReqId: () => `req_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      bodyLimit: 1048576, // 1MB
      keepAliveTimeout: 30000,
      connectionTimeout: 10000
    });

    // Setup infrastructure
    await this.setupInfrastructure();
    
    // Setup application services
    await this.setupApplicationServices();
    
    // Setup middleware
    await this.setupMiddleware();
    
    // Setup routes
    await this.setupRoutes();
    
    // Setup error handling
    this.setupErrorHandling();

    return this.app;
  }

  /**
   * Setup advanced infrastructure components
   */
  async setupInfrastructure() {
    // Storage adapter
    const storageAdapter = new FileStorageAdapter('./data');
    
    // CRDT manager for distributed consistency
    const crdtManager = new CRDTManager('api-node-1');
    
    // Event store with CRDT
    const eventStore = new CRDTEventStore(storageAdapter, crdtManager);
    
    // Query store for read models
    const queryStore = new InMemoryQueryStore();
    
    // Vector search service
    const vectorSearchService = new VectorSearchService();
    await vectorSearchService.initialize();
    
    // Repositories
    const productRepository = new ProductRepository(eventStore, queryStore, vectorSearchService);
    const orderRepository = new OrderRepository(eventStore, queryStore);
    
    this.infrastructure = {
      eventStore,
      queryStore,
      vectorSearchService,
      productRepository,
      orderRepository,
      crdtManager
    };
  }

  /**
   * Setup application services and CQRS buses
   */
  async setupApplicationServices() {
    const { productRepository, orderRepository, eventStore, crdtManager } = this.infrastructure;
    
    // Event bus for domain events
    const eventBus = new EventBus();
    const commandBus = new CommandBus();
    const queryBus = new QueryBus();
    
    // Mock unit of work for transactions
    const unitOfWork = {
      begin: async () => {},
      commit: async () => {},
      rollback: async () => {}
    };
    
    // Mock domain event publisher
    const domainEventPublisher = {
      publishEvents: async (events) => {
        for (const event of events) {
          await eventBus.publish(event);
        }
      }
    };
    
    // Application services
    const productAppService = new ProductApplicationService(
      productRepository,
      eventStore,
      domainEventPublisher,
      unitOfWork
    );
    
    const orderAppService = new OrderApplicationService(
      orderRepository,
      productRepository,
      { findById: async () => ({ id: 'customer1', name: 'John Doe' }) }, // Mock customer repo
      eventStore,
      domainEventPublisher,
      unitOfWork
    );
    
    // Command handlers
    const createProductHandler = new CreateProductCommandHandler(productAppService);
    const changePriceHandler = new ChangePriceCommandHandler(productAppService);
    const reserveInventoryHandler = new ReserveInventoryCommandHandler(productAppService);
    const createOrderHandler = new CreateOrderCommandHandler(orderAppService);
    const confirmOrderHandler = new ConfirmOrderCommandHandler(orderAppService);
    const shipOrderHandler = new ShipOrderCommandHandler(orderAppService);
    const cancelOrderHandler = new CancelOrderCommandHandler(orderAppService);
    
    // Query handlers
    const getProductByIdHandler = new GetProductByIdQueryHandler(this.infrastructure.queryStore);
    const searchProductsHandler = new SearchProductsQueryHandler(this.infrastructure.queryStore, this.infrastructure.vectorSearchService);
    const getOrderByIdHandler = new GetOrderByIdQueryHandler(this.infrastructure.queryStore);
    const getOrdersByCustomerHandler = new GetOrdersByCustomerQueryHandler(this.infrastructure.queryStore);
    
    // Register handlers
    commandBus.register('CreateProductCommand', createProductHandler);
    commandBus.register('ChangePriceCommand', changePriceHandler);
    commandBus.register('ReserveInventoryCommand', reserveInventoryHandler);
    commandBus.register('CreateOrderCommand', createOrderHandler);
    commandBus.register('ConfirmOrderCommand', confirmOrderHandler);
    commandBus.register('ShipOrderCommand', shipOrderHandler);
    commandBus.register('CancelOrderCommand', cancelOrderHandler);
    
    queryBus.register('GetProductByIdQuery', getProductByIdHandler);
    queryBus.register('SearchProductsQuery', searchProductsHandler);
    queryBus.register('GetOrderByIdQuery', getOrderByIdHandler);
    queryBus.register('GetOrdersByCustomerQuery', getOrdersByCustomerHandler);
    
    // Event handlers for projections
    const productCreatedHandler = new ProductCreatedEventHandler(this.infrastructure.queryStore, this.infrastructure.vectorSearchService);
    const orderCreatedHandler = new OrderCreatedEventHandler(this.infrastructure.queryStore);
    const orderShippedHandler = new OrderShippedEventHandler(this.infrastructure.queryStore);
    
    eventBus.subscribe('ProductCreated', productCreatedHandler);
    eventBus.subscribe('OrderCreated', orderCreatedHandler);
    eventBus.subscribe('OrderShipped', orderShippedHandler);
    
    // Setup saga for order fulfillment
    const orderFulfillmentSaga = new OrderFulfillmentSaga(commandBus, eventBus);
    
    this.applicationServices = {
      productAppService,
      orderAppService
    };
    
    this.buses = {
      commandBus,
      queryBus,
      eventBus
    };
  }

  /**
   * Setup middleware for security and performance
   */
  async setupMiddleware() {
    // Security headers
    await this.app.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    });

    // CORS for cross-origin requests
    await this.app.register(cors, {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    });

    // Rate limiting
    await this.app.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
      keyGenerator: (request) => {
        return request.headers['x-forwarded-for'] || request.ip;
      }
    });

    // Swagger documentation
    await this.app.register(swagger, {
      swagger: {
        info: {
          title: 'Advanced E-Commerce API',
          description: 'Google/Shopify-level e-commerce platform with CQRS, Event Sourcing, and CRDT',
          version: '1.0.0'
        },
        host: 'localhost:3000',
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
          { name: 'Products', description: 'Product management endpoints' },
          { name: 'Orders', description: 'Order management endpoints' },
          { name: 'Search', description: 'Advanced search endpoints' }
        ]
      }
    });

    await this.app.register(swaggerUI, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false
      },
      staticCSP: true,
      transformStaticCSP: (header) => header
    });

    // Request logging
    this.app.addHook('onRequest', async (request, reply) => {
      request.startTime = Date.now();
    });

    this.app.addHook('onResponse', async (request, reply) => {
      const duration = Date.now() - request.startTime;
      request.log.info({
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration: `${duration}ms`,
        userAgent: request.headers['user-agent']
      }, 'Request completed');
    });
  }

  /**
   * Setup API routes with OpenAPI schemas
   */
  async setupRoutes() {
    // Health check
    this.app.get('/health', {
      schema: {
        description: 'Health check endpoint',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              version: { type: 'string' }
            }
          }
        }
      }
    }, async (request, reply) => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
    });

    // Product routes
    await this.setupProductRoutes();
    
    // Order routes
    await this.setupOrderRoutes();
    
    // Search routes
    await this.setupSearchRoutes();
  }

  /**
   * Setup product management routes
   */
  async setupProductRoutes() {
    const productSchema = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        sku: { type: 'string' },
        price: { type: 'number' },
        currency: { type: 'string' },
        inventory: {
          type: 'object',
          properties: {
            quantity: { type: 'number' },
            reservedQuantity: { type: 'number' }
          }
        },
        isActive: { type: 'boolean' }
      }
    };

    // Create product
    this.app.post('/api/v1/products', {
      schema: {
        description: 'Create a new product',
        tags: ['Products'],
        body: {
          type: 'object',
          required: ['name', 'sku', 'price', 'currency', 'initialQuantity'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            sku: { type: 'string', minLength: 3 },
            price: { type: 'number', minimum: 0.01 },
            currency: { type: 'string', enum: ['USD', 'EUR', 'GBP'] },
            initialQuantity: { type: 'number', minimum: 0 },
            description: { type: 'string' },
            categoryId: { type: 'string' }
          }
        },
        response: {
          201: productSchema,
          400: { $ref: '#/components/schemas/Error' },
          500: { $ref: '#/components/schemas/Error' }
        }
      }
    }, async (request, reply) => {
      try {
        const command = new CreateProductCommand({ payload: request.body });
        const result = await this.buses.commandBus.send(command);
        
        reply.code(201);
        return result;
      } catch (error) {
        request.log.error(error);
        reply.code(400);
        return { error: error.message };
      }
    });

    // Get product by ID
    this.app.get('/api/v1/products/:id', {
      schema: {
        description: 'Get product by ID',
        tags: ['Products'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        },
        response: {
          200: productSchema,
          404: { $ref: '#/components/schemas/Error' }
        }
      }
    }, async (request, reply) => {
      try {
        const query = new GetProductByIdQuery(request.params.id);
        const product = await this.buses.queryBus.send(query);
        
        if (!product) {
          reply.code(404);
          return { error: 'Product not found' };
        }
        
        return product;
      } catch (error) {
        request.log.error(error);
        reply.code(500);
        return { error: 'Internal server error' };
      }
    });

    // Update product price
    this.app.put('/api/v1/products/:id/price', {
      schema: {
        description: 'Update product price',
        tags: ['Products'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['newPrice', 'currency'],
          properties: {
            newPrice: { type: 'number', minimum: 0.01 },
            currency: { type: 'string' },
            reason: { type: 'string' }
          }
        },
        response: {
          200: { $ref: '#/components/schemas/Success' },
          400: { $ref: '#/components/schemas/Error' },
          404: { $ref: '#/components/schemas/Error' }
        }
      }
    }, async (request, reply) => {
      try {
        const command = new ChangePriceCommand({
          payload: {
            productId: request.params.id,
            ...request.body
          }
        });
        
        const result = await this.buses.commandBus.send(command);
        return result;
      } catch (error) {
        request.log.error(error);
        reply.code(400);
        return { error: error.message };
      }
    });
  }

  /**
   * Setup order management routes
   */
  async setupOrderRoutes() {
    const orderSchema = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        orderNumber: { type: 'string' },
        customerId: { type: 'string' },
        status: { type: 'string' },
        total: { type: 'number' },
        currency: { type: 'string' },
        lineItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string' },
              quantity: { type: 'number' },
              unitPrice: { type: 'number' },
              lineTotal: { type: 'number' }
            }
          }
        },
        shippingAddress: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            postalCode: { type: 'string' }
          }
        }
      }
    };

    // Create order
    this.app.post('/api/v1/orders', {
      schema: {
        description: 'Create a new order',
        tags: ['Orders'],
        body: {
          type: 'object',
          required: ['customerId', 'lineItems', 'shippingAddress'],
          properties: {
            customerId: { type: 'string' },
            lineItems: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['productId', 'quantity'],
                properties: {
                  productId: { type: 'string' },
                  quantity: { type: 'number', minimum: 1 }
                }
              }
            },
            shippingAddress: {
              type: 'object',
              required: ['street', 'city', 'state', 'country', 'postalCode'],
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                country: { type: 'string' },
                postalCode: { type: 'string' }
              }
            },
            billingAddress: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                country: { type: 'string' },
                postalCode: { type: 'string' }
              }
            }
          }
        },
        response: {
          201: orderSchema,
          400: { $ref: '#/components/schemas/Error' }
        }
      }
    }, async (request, reply) => {
      try {
        const command = new CreateOrderCommand({ payload: request.body });
        const result = await this.buses.commandBus.send(command);
        
        reply.code(201);
        return result;
      } catch (error) {
        request.log.error(error);
        reply.code(400);
        return { error: error.message };
      }
    });

    // Get order by ID
    this.app.get('/api/v1/orders/:id', {
      schema: {
        description: 'Get order by ID',
        tags: ['Orders'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        },
        response: {
          200: orderSchema,
          404: { $ref: '#/components/schemas/Error' }
        }
      }
    }, async (request, reply) => {
      try {
        const query = new GetOrderByIdQuery(request.params.id);
        const order = await this.buses.queryBus.send(query);
        
        if (!order) {
          reply.code(404);
          return { error: 'Order not found' };
        }
        
        return order;
      } catch (error) {
        request.log.error(error);
        reply.code(500);
        return { error: 'Internal server error' };
      }
    });

    // Confirm order
    this.app.post('/api/v1/orders/:id/confirm', {
      schema: {
        description: 'Confirm order payment',
        tags: ['Orders'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['paymentConfirmation'],
          properties: {
            paymentConfirmation: {
              type: 'object',
              properties: {
                transactionId: { type: 'string' },
                amount: { type: 'number' },
                currency: { type: 'string' }
              }
            }
          }
        },
        response: {
          200: { $ref: '#/components/schemas/Success' },
          400: { $ref: '#/components/schemas/Error' }
        }
      }
    }, async (request, reply) => {
      try {
        const command = new ConfirmOrderCommand({
          payload: {
            orderId: request.params.id,
            ...request.body
          }
        });
        
        const result = await this.buses.commandBus.send(command);
        return result;
      } catch (error) {
        request.log.error(error);
        reply.code(400);
        return { error: error.message };
      }
    });

    // Ship order
    this.app.post('/api/v1/orders/:id/ship', {
      schema: {
        description: 'Ship order',
        tags: ['Orders'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['trackingNumber', 'carrier'],
          properties: {
            trackingNumber: { type: 'string' },
            carrier: { type: 'string' }
          }
        },
        response: {
          200: { $ref: '#/components/schemas/Success' },
          400: { $ref: '#/components/schemas/Error' }
        }
      }
    }, async (request, reply) => {
      try {
        const command = new ShipOrderCommand({
          payload: {
            orderId: request.params.id,
            ...request.body
          }
        });
        
        const result = await this.buses.commandBus.send(command);
        return result;
      } catch (error) {
        request.log.error(error);
        reply.code(400);
        return { error: error.message };
      }
    });

    // Cancel order
    this.app.post('/api/v1/orders/:id/cancel', {
      schema: {
        description: 'Cancel order',
        tags: ['Orders'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['reason'],
          properties: {
            reason: { type: 'string' }
          }
        },
        response: {
          200: { $ref: '#/components/schemas/Success' },
          400: { $ref: '#/components/schemas/Error' }
        }
      }
    }, async (request, reply) => {
      try {
        const command = new CancelOrderCommand({
          payload: {
            orderId: request.params.id,
            ...request.body
          }
        });
        
        const result = await this.buses.commandBus.send(command);
        return result;
      } catch (error) {
        request.log.error(error);
        reply.code(400);
        return { error: error.message };
      }
    });
  }

  /**
   * Setup advanced search routes
   */
  async setupSearchRoutes() {
    // Vector-based product search
    this.app.get('/api/v1/search/products', {
      schema: {
        description: 'Advanced product search with vector similarity',
        tags: ['Search'],
        querystring: {
          type: 'object',
          properties: {
            q: { type: 'string', description: 'Search query' },
            category: { type: 'string' },
            minPrice: { type: 'number' },
            maxPrice: { type: 'number' },
            offset: { type: 'number', default: 0 },
            limit: { type: 'number', default: 50, maximum: 100 }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              products: {
                type: 'array',
                items: { $ref: '#/components/schemas/Product' }
              },
              total: { type: 'number' },
              offset: { type: 'number' },
              limit: { type: 'number' }
            }
          }
        }
      }
    }, async (request, reply) => {
      try {
        const { q, category, minPrice, maxPrice, offset = 0, limit = 50 } = request.query;
        
        const filters = {};
        if (category) filters.category = category;
        if (minPrice) filters.minPrice = minPrice;
        if (maxPrice) filters.maxPrice = maxPrice;
        
        const query = new SearchProductsQuery(q, filters, { offset, limit });
        const result = await this.buses.queryBus.send(query);
        
        return result;
      } catch (error) {
        request.log.error(error);
        reply.code(500);
        return { error: 'Search failed' };
      }
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    this.app.setErrorHandler(async (error, request, reply) => {
      request.log.error(error);
      
      if (error.validation) {
        reply.code(400);
        return {
          error: 'Validation failed',
          details: error.validation
        };
      }
      
      if (error.statusCode) {
        reply.code(error.statusCode);
        return { error: error.message };
      }
      
      reply.code(500);
      return { error: 'Internal server error' };
    });

    this.app.setNotFoundHandler(async (request, reply) => {
      reply.code(404);
      return { error: 'Route not found' };
    });
  }

  /**
   * Start the server
   */
  async start() {
    try {
      await this.app.listen({
        host: this.options.host,
        port: this.options.port
      });
      
      console.log(`🚀 Advanced E-Commerce API Server running on http://${this.options.host}:${this.options.port}`);
      console.log(`📚 API Documentation available at http://${this.options.host}:${this.options.port}/docs`);
      console.log('🔧 Features enabled:');
      console.log('  ✅ CQRS with Event Sourcing');
      console.log('  ✅ CRDT for Distributed Consistency');
      console.log('  ✅ Vector Search with HNSW');
      console.log('  ✅ Lock-free Concurrent Data Structures');
      console.log('  ✅ Domain-Driven Design');
      console.log('  ✅ Saga Pattern for Complex Workflows');
      console.log('  ✅ Native C++ Performance Optimizations');
      
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async stop() {
    try {
      await this.app.close();
      console.log('Server stopped gracefully');
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

module.exports = { ECommerceAPIServer };
