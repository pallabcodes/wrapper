/**
 * Module Registration System
 * Dynamic module loading with dependency injection
 */

const path = require('path');
const { existsSync } = require('fs');

/**
 * Register all business modules
 * @param {Object} app - Fastify instance
 * @param {Object} config - Application configuration
 */
const registerModules = async (app, config) => {
  app.log.info('Registering business modules...');
  
  // Define module load order (dependencies first)
  const moduleOrder = [
    'auth',       // Authentication first
    'customer',   // Customer management
    'vendor',     // Vendor management
    'product',    // Product catalog
    'inventory',  // Inventory management
    'order',      // Order processing
    'payment',    // Payment processing
    'shipping',   // Shipping management
    'notification', // Notification system
    'chat',       // Chat/messaging
  ];
  
  const loadedModules = new Map();
  
  try {
    for (const moduleName of moduleOrder) {
      const modulePath = path.join(__dirname, moduleName);
      
      if (existsSync(modulePath)) {
        app.log.debug(`Loading module: ${moduleName}`);
        
        // Load module
        const moduleLoader = require(modulePath);
        
        // Register module with dependency injection
        const moduleInstance = await moduleLoader.register(app, {
          config,
          modules: loadedModules,
        });
        
        // Store module reference
        loadedModules.set(moduleName, moduleInstance);
        
        app.log.info(`✅ Module registered: ${moduleName}`);
      } else {
        app.log.warn(`Module not found: ${moduleName}`);
      }
    }
    
    // Register API routes
    await registerAPIRoutes(app, config, loadedModules);
    
    app.log.info(`🚀 All modules registered successfully (${loadedModules.size} modules)`);
    
  } catch (error) {
    app.log.error('Failed to register modules:', error);
    throw error;
  }
};

/**
 * Register API routes for all modules
 * @param {Object} app - Fastify instance
 * @param {Object} config - Application configuration
 * @param {Map} modules - Loaded modules
 */
const registerAPIRoutes = async (app, config, modules) => {
  // Register API v1 routes
  await app.register(async (fastify) => {
    // Add API-wide middleware
    fastify.addHook('onRequest', async (request, reply) => {
      // Add request context
      request.context = {
        requestId: request.id,
        timestamp: new Date(),
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      };
    });
    
    // Add response headers
    fastify.addHook('onSend', async (request, reply, payload) => {
      reply.header('X-API-Version', 'v1');
      reply.header('X-Request-ID', request.id);
      reply.header('X-Response-Time', Date.now() - request.context.timestamp.getTime());
      return payload;
    });
    
    // Register module routes
    for (const [moduleName, moduleInstance] of modules) {
      if (moduleInstance && moduleInstance.routes) {
        const routePrefix = `/api/v1/${moduleName}`;
        
        await fastify.register(moduleInstance.routes, {
          prefix: routePrefix,
        });
        
        fastify.log.debug(`Routes registered for ${moduleName} at ${routePrefix}`);
      }
    }
  });
};

/**
 * Module base class with common functionality
 */
class ModuleBase {
  constructor(name, app, options = {}) {
    this.name = name;
    this.app = app;
    this.config = options.config;
    this.modules = options.modules;
    this.logger = app.log.child({ module: name });
  }
  
  /**
   * Get database instance
   */
  get db() {
    return this.app.db;
  }
  
  /**
   * Get cache instance
   */
  get cache() {
    return this.app.cache;
  }
  
  /**
   * Get queue instance
   */
  get queue() {
    return this.app.queue;
  }
  
  /**
   * Get storage instance
   */
  get storage() {
    return this.app.storage;
  }
  
  /**
   * Get another module
   */
  getModule(name) {
    return this.modules.get(name);
  }
  
  /**
   * Log with module context
   */
  log(level, message, ...args) {
    this.logger[level](message, ...args);
  }
  
  /**
   * Create module-specific cache key
   */
  cacheKey(...parts) {
    return `${this.name}:${parts.join(':')}`;
  }
  
  /**
   * Handle module errors consistently
   */
  handleError(error, context = {}) {
    this.logger.error({
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
    }, 'Module error occurred');
    
    // Re-throw with module context
    const moduleError = new Error(`${this.name}: ${error.message}`);
    moduleError.originalError = error;
    moduleError.module = this.name;
    moduleError.statusCode = error.statusCode || 500;
    
    throw moduleError;
  }
}

/**
 * Create a standardized module structure
 */
const createModule = (name, definition) => {
  return {
    async register(app, options) {
      const module = new ModuleBase(name, app, options);
      
      // Initialize module-specific services
      if (definition.services) {
        module.services = {};
        for (const [serviceName, ServiceClass] of Object.entries(definition.services)) {
          module.services[serviceName] = new ServiceClass(module);
        }
      }
      
      // Initialize module-specific models
      if (definition.models) {
        module.models = {};
        for (const [modelName, ModelClass] of Object.entries(definition.models)) {
          module.models[modelName] = new ModelClass(module);
        }
      }
      
      // Initialize module-specific handlers
      if (definition.handlers) {
        module.handlers = {};
        for (const [handlerName, HandlerClass] of Object.entries(definition.handlers)) {
          module.handlers[handlerName] = new HandlerClass(module);
        }
      }
      
      // Setup module routes
      if (definition.routes) {
        module.routes = definition.routes(module);
      }
      
      // Run module initialization
      if (definition.init) {
        await definition.init(module);
      }
      
      return module;
    },
  };
};

module.exports = {
  registerModules,
  ModuleBase,
  createModule,
};
