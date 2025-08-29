/**
 * Ecommerce Enterprise API - Main Entry Point
 * 
 * This file implements the main API server using functional programming patterns,
 * composition over inheritance, and enterprise-grade architecture.
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { apiRoutes } from './routes'
import { generateOpenAPISpec } from './swagger/functionalSwagger'
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

// Functional Swagger setup - NO COMMENTS REQUIRED
const swaggerSpec = generateOpenAPISpec()

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Ecommerce Enterprise API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true
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
  environment: process.env['NODE_ENV'] || 'development'
})

app.get('/health', (_req, res) => {
  res.json(createHealthResponse())
})

// API routes
app.use('/api/v1', apiRoutes)

// API routes (catch-all) - not documented in Swagger
app.use('/api/v1', (_req, res) => {
  res.json({
    message: 'API v1 - Coming soon',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// Functional error handling middleware
const errorHandler = (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({ error: 'Internal server error' })
}

app.use(errorHandler)

// 404 handler with functional response
const notFoundHandler = (_req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Not found' })
}

app.use('*', notFoundHandler)

export default app