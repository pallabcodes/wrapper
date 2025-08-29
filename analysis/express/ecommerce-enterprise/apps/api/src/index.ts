/**
 * Ecommerce Enterprise API - Main Entry Point
 * 
 * This file implements the main API server using functional programming patterns,
 * composition over inheritance, and enterprise-grade architecture with proper API versioning.
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { apiRoutes } from './routes'
import { generateMultiVersionOpenAPISpec } from './swagger/versionedSwagger'
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

// Functional Swagger setup - Multi-version support
const swaggerSpec = generateMultiVersionOpenAPISpec()

// Swagger UI setup with versioned documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Ecommerce Enterprise API Documentation - Multi-Version',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha'
  }
}))

// Serve Swagger JSON
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Health check endpoint with functional response
const createHealthResponse = () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  version: process.env['npm_package_version'] || '1.0.0',
  environment: process.env['NODE_ENV'] || 'development',
  apiVersions: ['v1', 'v2', 'v3'],
  latestVersion: 'v3'
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
          endpoints: '/api/v1/*'
        },
        {
          version: 'v2',
          status: 'active',
          introducedAt: '2024-06-01',
          features: ['Bulk operations', 'Webhooks', 'Enhanced validation'],
          endpoints: '/api/v2/*'
        },
        {
          version: 'v3',
          status: 'active',
          introducedAt: '2024-12-01',
          features: ['GraphQL API', 'Real-time events', 'Advanced analytics'],
          endpoints: '/api/v3/*'
        }
      ],
      defaultVersion: 'v1',
      latestVersion: 'v3',
      deprecationPolicy: {
        deprecatedVersions: [],
        sunsetVersions: []
      }
    }
  })
})

// Register versioned API routes
registerVersionedRoutes(app)

// Legacy API routes for backward compatibility
app.use('/api/v1', apiRoutes)

// API routes (catch-all) - not documented in Swagger
app.use('/api', (_req, res) => {
  res.json({
    message: 'Ecommerce Enterprise API',
    versions: ['v1', 'v2', 'v3'],
    documentation: '/api-docs',
    health: '/health',
    versionInfo: '/api/versions'
  })
})

// Functional error handling middleware
const errorHandler = (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({ error: 'Internal server error' })
}

app.use(errorHandler)

export default app