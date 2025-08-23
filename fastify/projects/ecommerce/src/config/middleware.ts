/**
 * Middleware Configuration
 * 
 * Fastify middleware setup for enterprise ecommerce platform
 */

import type { FastifyInstance } from 'fastify'

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

export const setupMiddleware = async (fastify: FastifyInstance): Promise<void> => {
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
}
