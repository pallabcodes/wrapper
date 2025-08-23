/**
 * Main Application Entry Point
 * 
 * Fastify server setup with authentication module
 * Demonstrates enterprise-grade application structure
 */

import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import { authRoutes } from './modules/auth/authRoutes.js'
import { productRoutes } from './modules/product/productRoutes.js'

// ============================================================================
// SERVER CONFIGURATION
// ============================================================================

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    serializers: {
      req(request): Record<string, unknown> {
        return {
          method: request.method,
          url: request.url,
          headers: request.headers,
          hostname: request.hostname,
          remoteAddress: request.ip,
          remotePort: request.socket?.remotePort
        }
      },
      res(response): Record<string, unknown> {
        return {
          statusCode: response.statusCode,
          headers: response.getHeaders?.() ?? {}
        }
      }
    }
  },
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'requestId',
  genReqId: () => crypto.randomUUID(),
  trustProxy: true,
  disableRequestLogging: false
})

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// CORS middleware
await fastify.register(import('@fastify/cors'), {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://api.yourdomain.com']
    : true,
  credentials: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
})

// Helmet for security headers
await fastify.register(import('@fastify/helmet'), {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
})

// Rate limiting
await fastify.register(import('@fastify/rate-limit'), {
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  timeWindow: '1 minute',
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true
  }
})

// Swagger documentation
await fastify.register(import('@fastify/swagger'), {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Enterprise Ecommerce API',
      description: 'Production-ready ecommerce platform API for Silicon Valley scale',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'api-support@company.com',
        url: 'https://github.com/company/ecommerce-platform'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.yourdomain.com' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    tags: [
      { name: 'System', description: 'System health and monitoring endpoints' },
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Users', description: 'User management and profiles' },
      { name: 'Products', description: 'Product catalog and inventory' },
      { name: 'Orders', description: 'Order processing and management' },
      { name: 'Payments', description: 'Payment processing and billing' },
      { name: 'Chat', description: 'Real-time messaging and support' },
      { name: 'Notifications', description: 'Email and push notifications' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Invalid input data' },
                details: { type: 'object' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string', format: 'uuid' }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string', format: 'uuid' },
                version: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
})

await fastify.register(import('@fastify/swagger-ui'), {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  theme: {
    title: 'Enterprise Ecommerce API Documentation'
  }
})

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

fastify.get('/health', {
  schema: {
    description: 'Health check endpoint',
    tags: ['System'],
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'number' },
          environment: { type: 'string' },
          version: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  }
})

// ============================================================================
// API ROUTES REGISTRATION
// ============================================================================

// Register API routes under /api/v1 prefix
await fastify.register(async function (fastify) {
  // Authentication routes
  await fastify.register(authRoutes, { prefix: '/auth' })
  
  // Product routes
  await fastify.register(productRoutes, { prefix: '/products' })
  
  // Future modules can be registered here:
  // await fastify.register(userRoutes, { prefix: '/users' })
  // await fastify.register(orderRoutes, { prefix: '/orders' })
  // await fastify.register(paymentRoutes, { prefix: '/payments' })
}, { prefix: '/api/v1' })

// ============================================================================
// ERROR HANDLING
// ============================================================================

fastify.setErrorHandler(async (error, request, reply) => {
  const requestId = request.id

  // Log error with context
  request.log.error({
    error: {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode || 500
    },
    requestId,
    url: request.url,
    method: request.method
  }, 'Request error occurred')

  // Development vs Production error responses
  if (process.env.NODE_ENV === 'production') {
    // Production: sanitized error response
    const statusCode = error.statusCode || 500
    const message = statusCode < 500 ? error.message : 'Internal Server Error'
    
    return reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message,
        requestId
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId
      }
    })
  } else {
    // Development: detailed error response
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message,
        stack: error.stack,
        requestId
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId
      }
    })
  }
})

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`)
  
  try {
    await fastify.close()
    console.log('Server closed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Error during shutdown:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// ============================================================================
// SERVER STARTUP
// ============================================================================

const start = async (): Promise<void> => {
  try {
    const host = process.env.HOST || '0.0.0.0'
    const port = parseInt(process.env.PORT || '3000', 10)
    
    const address = await fastify.listen({ 
      port, 
      host,
      backlog: 511 // Increase backlog for high-traffic scenarios
    })
    
    console.log(`🚀 Server listening at ${address}`)
    console.log(`📚 API Documentation: ${address}/documentation`)
    console.log(`❤️  Health Check: ${address}/health`)
    console.log(`🔐 Auth Endpoints: ${address}/api/v1/auth/*`)
    
  } catch (error) {
    fastify.log.error(error)
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
start()

// ============================================================================
// EXPORTS FOR TESTING
// ============================================================================

export { fastify }
export default fastify
