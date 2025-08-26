/**
 * Fastify Plugins Setup
 * 
 * Centralized plugin registration for the ecommerce platform.
 * Includes cors, helmet, rate limiting, compression, and custom plugins.
 */

export const setupPlugins = async (app: import('fastify').FastifyInstance): Promise<void> => {
  // Security headers
  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })

  // CORS configuration
  await app.register(import('@fastify/cors'), {
            origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
      const hostname = new URL(origin || 'http://localhost').hostname
      if (hostname === 'localhost' || hostname === '127.0.0.1' || !origin) {
        cb(null, true)
        return
      }
      cb(new Error("Not allowed"), false)
    },
    credentials: true,
  })

  // Rate limiting
  await app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  })
}
