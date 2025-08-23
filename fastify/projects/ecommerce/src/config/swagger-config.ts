/**
 * Swagger Configuration
 * 
 * OpenAPI documentation setup for enterprise ecommerce platform
 */

import type { FastifyInstance } from 'fastify'

// ============================================================================
// SWAGGER CONFIGURATION
// ============================================================================

export const setupSwagger = async (fastify: FastifyInstance): Promise<void> => {
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
}
