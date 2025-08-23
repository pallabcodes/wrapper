/**
 * Enterprise E-Commerce Platform - Main Application Entry Point
 * Built with Silicon Valley Engineering Standards
 * Scalable from 100 users to 1M+ users
 * Modular Monolith → Microservices Ready
 */

const { createAdvancedFramework } = require('../fastify');
const { loadConfig } = require('./config');
const { setupInfrastructure } = require('./infrastructure');
const { registerModules } = require('./modules');
const { setupMonitoring } = require('./infrastructure/monitoring');
const { setupSecurity } = require('./infrastructure/security');

/**
 * Bootstrap the e-commerce application
 * @returns {Promise<Object>} Configured Fastify instance
 */
const createApp = async () => {
  // Load configuration based on environment
  const config = await loadConfig();
  
  // Create the advanced framework with optimized settings
  const app = await createAdvancedFramework({
    logger: {
      level: config.logging.level,
      prettyPrint: config.env === 'development',
      serializers: {
        req: (req) => ({
          method: req.method,
          url: req.url,
          hostname: req.hostname,
          remoteAddress: req.ip,
          remotePort: req.socket?.remotePort,
        }),
        res: (res) => ({
          statusCode: res.statusCode,
          responseTime: res.responseTime,
        }),
      },
    },
    trustProxy: config.server.trustProxy,
    bodyLimit: config.server.bodyLimit,
    keepAliveTimeout: config.server.keepAliveTimeout,
    maxParamLength: config.server.maxParamLength,
    // Enable HTTP/2 for production
    http2: config.server.http2,
    // Production-grade request ID generation
    genReqId: () => {
      return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
  });

  // Setup infrastructure layers
  await setupInfrastructure(app, config);
  
  // Setup security middleware
  await setupSecurity(app, config);
  
  // Setup monitoring and observability
  await setupMonitoring(app, config);
  
  // Register global error handler
  app.setErrorHandler(async (error, request, reply) => {
    const errorId = request.id;
    const statusCode = error.statusCode || 500;
    
    // Log error with context
    request.log.error({
      errorId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        statusCode,
      },
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
        params: request.params,
        query: request.query,
      },
    }, 'Request error occurred');
    
    // Return structured error response
    await reply.status(statusCode).send({
      error: {
        id: errorId,
        code: error.code || 'INTERNAL_ERROR',
        message: statusCode >= 500 ? 'Internal server error' : error.message,
        statusCode,
        timestamp: new Date().toISOString(),
      },
    });
  });
  
  // Setup graceful shutdown handlers
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, starting graceful shutdown`);
      
      try {
        // Close server gracefully
        await app.close();
        app.log.info('Server closed gracefully');
        process.exit(0);
      } catch (error) {
        app.log.error('Error during graceful shutdown', error);
        process.exit(1);
      }
    });
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    app.log.fatal('Uncaught exception', error);
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    app.log.fatal('Unhandled promise rejection', { reason, promise });
    process.exit(1);
  });
  
  // Register all business modules
  await registerModules(app, config);
  
  // Health check endpoint
  app.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            environment: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: config.app.version,
      environment: config.env,
    };
  });
  
  // Ready check endpoint (for Kubernetes)
  app.get('/ready', async (request, reply) => {
    // Add database connectivity checks here
    return { status: 'ready' };
  });
  
  return app;
};

/**
 * Start the application server
 */
const startServer = async () => {
  try {
    const app = await createApp();
    const config = await loadConfig();
    
    // Start listening
    const address = await app.listen({
      port: config.server.port,
      host: config.server.host,
    });
    
    app.log.info(`🚀 E-Commerce server ready at ${address}`);
    app.log.info(`📊 Environment: ${config.env}`);
    app.log.info(`🔧 Process ID: ${process.pid}`);
    app.log.info(`💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = {
  createApp,
  startServer,
};
