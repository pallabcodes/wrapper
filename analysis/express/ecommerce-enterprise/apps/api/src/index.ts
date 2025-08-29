/**
 * Ecommerce Enterprise API - Main Entry Point
 * 
 * This file implements the main API server using functional programming patterns,
 * composition over inheritance, and enterprise-grade architecture with proper API versioning.
 */

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { apiRoutes } from './routes'
import { generateVersionedOpenAPISpec } from './swagger/versionedSwagger'
import { registerVersionedRoutes } from './versioning/versionedRoutes'
import { logger } from '@ecommerce-enterprise/core'

const app = express()

// Security middleware with CSP configured for Swagger UI
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      scriptSrc: ["'self'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:3000'],
  credentials: true
}))

// Compression middleware
app.use(compression())

// Rate limiting with functional configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

  // Functional Swagger setup - Single endpoint with version switching
  const v1Spec = generateVersionedOpenAPISpec('v1')
  const v2Spec = generateVersionedOpenAPISpec('v2')
  const v3Spec = generateVersionedOpenAPISpec('v3')

  // Single Swagger UI endpoint with version switching
  app.use('/api-docs', swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
    const version = (req.query['v'] as string) || 'v1'
    
    let spec
    switch (version) {
      case 'v2':
        spec = v2Spec
        break
      case 'v3':
        spec = v3Spec
        break
      default:
        spec = v1Spec
    }

    return swaggerUi.setup(spec, {
      customSiteTitle: `Ecommerce Enterprise API - ${version.toUpperCase()}`,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        deepLinking: true
      }
    })(req, res, next)
  })

// Request ID middleware for tracking
const addRequestId = (req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  res.setHeader('x-request-id', req.headers['x-request-id'])
  next()
}

app.use(addRequestId)

// Health check endpoint with functional response
const createHealthResponse = () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  version: process.env['npm_package_version'] || '1.0.0',
  environment: process.env['NODE_ENV'] || 'development',
  apiVersions: ['v1', 'v2', 'v3'],
  latestVersion: 'v3',
  memory: {
    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
  }
})

app.get('/health', (_req, res) => {
  res.json(createHealthResponse())
})

// API versioning information endpoint
app.get('/api/versions', (_req, res) => {
  res.json({
    success: true,
    data: {
      versions: [
        {
          version: 'v1',
          status: 'active',
          introducedAt: '2024-01-01',
          features: ['Basic authentication', 'User management'],
          endpoints: '/api/v1/*',
          documentation: '/api-docs?v=v1'
        },
        {
          version: 'v2',
          status: 'active',
          introducedAt: '2024-06-01',
          features: ['Bulk operations', 'Webhooks', 'Enhanced validation'],
          endpoints: '/api/v2/*',
          documentation: '/api-docs?v=v2'
        },
        {
          version: 'v3',
          status: 'active',
          introducedAt: '2024-12-01',
          features: ['GraphQL API', 'Real-time events', 'Advanced analytics'],
          endpoints: '/api/v3/*',
          documentation: '/api-docs?v=v3'
        }
      ],
      defaultVersion: 'v1',
      latestVersion: 'v3',
      deprecationPolicy: {
        deprecatedVersions: [],
        sunsetVersions: []
      },
      documentation: '/api-docs'
    }
  })
})

// Register versioned API routes
registerVersionedRoutes(app)

// Legacy API routes for backward compatibility
app.use('/api/v1', apiRoutes)

// API routes (catch-all) - only for non-versioned routes
app.use('/api', (req, res, next) => {
  // Skip if it's a versioned route
  if (req.path.startsWith('/v1/') || req.path.startsWith('/v2/') || req.path.startsWith('/v3/')) {
    return next()
  }
  
  res.json({
    message: 'Ecommerce Enterprise API',
    versions: ['v1', 'v2', 'v3'],
    documentation: '/api-docs',
    health: '/health',
    versionInfo: '/api/versions'
  })
})

// Functional error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const requestId = req.headers['x-request-id']
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    requestId,
    url: req.url,
    method: req.method
  })
  
  res.status(500).json({ 
    error: 'Internal server error',
    requestId,
    timestamp: new Date().toISOString()
  })
}

app.use(errorHandler)

export default app