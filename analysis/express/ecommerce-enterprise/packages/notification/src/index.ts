/**
 * Notification Microservice - Main Entry Point
 * 
 * This is how internal teams at Google/Atlassian/Stripe/PayPal structure microservices.
 * Clean, functional, maintainable - no over-engineering.
 */

import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
import { healthRouter } from './routes/health'
import { notificationRouter } from './routes/notification'
import { templateRouter } from './routes/template'
import { preferencesRouter } from './routes/preferences'
import { analyticsRouter } from './routes/analytics'
import { config } from './config/config'

const app = express()
const PORT = config.port || 3002

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
  origin: config.security.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Compression middleware
app.use(compression())

// Logging middleware
app.use(morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } }))
app.use(requestLogger)

// Health check endpoint
app.use('/health', healthRouter)

// API routes
app.use('/api/v1/notifications', notificationRouter)
app.use('/api/v1/templates', templateRouter)
app.use('/api/v1/preferences', preferencesRouter)
app.use('/api/v1/analytics', analyticsRouter)

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'Notification Microservice',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      notifications: '/api/v1/notifications',
      templates: '/api/v1/templates',
      preferences: '/api/v1/preferences',
      analytics: '/api/v1/analytics'
    }
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware
app.use(errorHandler)

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

// Start server
app.listen(PORT, () => {
  logger.info(`Notification microservice started on port ${PORT}`, {
    port: PORT,
    environment: config.environment,
    version: '1.0.0'
  })
})

export default app
