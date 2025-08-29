/**
 * Ecommerce Enterprise API - Main Entry Point
 * 
 * This file implements the main API server using functional programming patterns,
 * composition over inheritance, and enterprise-grade architecture.
 */

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { apiRoutes } from './routes'
import { logger } from '@ecommerce-enterprise/core'

const app = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
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
  memory: {
    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
  }
})

app.get('/health', (_req, res) => {
  res.json(createHealthResponse())
})

// API routes
app.use('/api/v1', apiRoutes)

// API routes (catch-all)
app.use('/api', (_req, res) => {
  res.json({
    message: 'Ecommerce Enterprise API',
    documentation: 'API documentation coming soon',
    health: '/health'
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