/**
 * Advanced Error Handling and Serialization System
 * Extracted and Enhanced from Fastify Core for Universal Use
 * 
 * Features:
 * - Hierarchical error handling with fallback strategies
 * - Advanced error serialization and formatting
 * - Error tracking and analytics
 * - Circuit breaker integration for error recovery
 * - Custom error types and error factories
 * - Performance-optimized error handling
 */

'use strict'

const statusCodes = require('node:http').STATUS_CODES
const {
  kReplyHeaders,
  kReplyNextErrorHandler,
  kReplyIsRunningOnErrorHook,
  kReplyHasStatusCode,
  kRouteContext,
  kDisableRequestLogging
} = require('./symbolRegistry')

/**
 * Enhanced Error Class with Additional Metadata
 */
class FastifyError extends Error {
  constructor(message, code, statusCode = 500, context = {}) {
    super(message)
    
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.context = context
    this.timestamp = Date.now()
    this.id = this.generateErrorId()
    
    // Performance tracking
    this.stack = this.captureStackTrace()
    this.fingerprint = this.generateFingerprint()
    
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate error fingerprint for deduplication
   */
  generateFingerprint() {
    const data = `${this.constructor.name}:${this.code}:${this.message}`
    return this.hash(data)
  }

  /**
   * Simple hash function
   */
  hash(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
  }

  /**
   * Capture stack trace with optimization
   */
  captureStackTrace() {
    const stack = new Error().stack
    if (stack) {
      const lines = stack.split('\n')
      return lines.slice(2, 10).join('\n') // Limit stack depth
    }
    return ''
  }

  /**
   * Serialize error for logging/transmission
   */
  serialize(includeStack = false) {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp,
      fingerprint: this.fingerprint,
      ...(includeStack && { stack: this.stack })
    }
  }

  /**
   * Create child error with same fingerprint
   */
  createChild(message, additionalContext = {}) {
    const child = new this.constructor(message, this.code, this.statusCode, {
      ...this.context,
      ...additionalContext,
      parent: this.id
    })
    child.fingerprint = this.fingerprint
    return child
  }
}

/**
 * Error Factory for Creating Standardized Errors
 */
class ErrorFactory {
  constructor() {
    this.errorTypes = new Map()
    this.defaultStatusCodes = new Map()
    this.errorTemplates = new Map()
    
    this.registerDefaultErrors()
  }

  /**
   * Register default error types
   */
  registerDefaultErrors() {
    this.register('VALIDATION_ERROR', 400, 'Validation failed: {details}')
    this.register('AUTHENTICATION_ERROR', 401, 'Authentication required')
    this.register('AUTHORIZATION_ERROR', 403, 'Access denied')
    this.register('NOT_FOUND_ERROR', 404, 'Resource not found')
    this.register('TIMEOUT_ERROR', 408, 'Request timeout')
    this.register('RATE_LIMIT_ERROR', 429, 'Rate limit exceeded')
    this.register('INTERNAL_ERROR', 500, 'Internal server error')
    this.register('SERVICE_UNAVAILABLE', 503, 'Service temporarily unavailable')
  }

  /**
   * Register custom error type
   */
  register(code, statusCode, template) {
    this.errorTypes.set(code, {
      statusCode,
      template: typeof template === 'string' ? template : template.message,
      options: typeof template === 'object' ? template : {}
    })
  }

  /**
   * Create error from registered type
   */
  create(code, data = {}, context = {}) {
    const errorType = this.errorTypes.get(code)
    if (!errorType) {
      throw new Error(`Unknown error type: ${code}`)
    }
    
    const message = this.interpolateTemplate(errorType.template, data)
    return new FastifyError(message, code, errorType.statusCode, context)
  }

  /**
   * Interpolate error message template
   */
  interpolateTemplate(template, data) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match
    })
  }

  /**
   * Create validation error with details
   */
  validation(details, context = {}) {
    return this.create('VALIDATION_ERROR', { details }, context)
  }

  /**
   * Create timeout error
   */
  timeout(operation, duration, context = {}) {
    return this.create('TIMEOUT_ERROR', { operation, duration }, context)
  }

  /**
   * Create rate limit error
   */
  rateLimit(limit, window, context = {}) {
    return this.create('RATE_LIMIT_ERROR', { limit, window }, context)
  }
}

/**
 * Error Handler with Hierarchical Processing
 */
class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      enableMetrics: options.enableMetrics !== false,
      enableFallback: options.enableFallback !== false,
      maxStackDepth: options.maxStackDepth || 10,
      sanitizeErrors: options.sanitizeErrors !== false,
      ...options
    }
    
    this.handlers = []
    this.fallbackHandler = this.defaultFallbackHandler
    this.metrics = new Map()
    this.errorFactory = new ErrorFactory()
    
    // Error tracking
    this.errorCounts = new Map()
    this.recentErrors = []
    this.maxRecentErrors = 1000
  }

  /**
   * Add error handler to the chain
   */
  addHandler(handler, options = {}) {
    if (typeof handler !== 'function') {
      throw new Error('Error handler must be a function')
    }
    
    this.handlers.push({
      fn: handler,
      priority: options.priority || 0,
      async: options.async || false,
      timeout: options.timeout || 5000,
      canFallback: options.canFallback !== false
    })
    
    // Sort by priority (higher first)
    this.handlers.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Handle error through the chain
   */
  async handle(error, request, reply) {
    const startTime = process.hrtime.bigint()
    
    // Track error
    this.trackError(error)
    
    // Ensure error is proper Error instance
    const processedError = this.processError(error)
    
    let handled = false
    let lastError = processedError
    
    // Try each handler in priority order
    for (const handler of this.handlers) {
      try {
        const result = await this.executeHandler(handler, processedError, request, reply)
        
        if (result !== undefined) {
          handled = true
          break
        }
      } catch (handlerError) {
        lastError = handlerError
        
        if (!handler.canFallback) {
          break
        }
      }
    }
    
    // Use fallback if no handler succeeded
    if (!handled && this.options.enableFallback) {
      await this.fallbackHandler(lastError, request, reply)
    }
    
    // Record metrics
    if (this.options.enableMetrics) {
      const endTime = process.hrtime.bigint()
      this.recordMetrics(processedError, startTime, endTime, handled)
    }
  }

  /**
   * Execute individual error handler with timeout
   */
  async executeHandler(handler, error, request, reply) {
    if (handler.async) {
      return Promise.race([
        handler.fn(error, request, reply),
        this.createTimeoutPromise(handler.timeout)
      ])
    } else {
      return handler.fn(error, request, reply)
    }
  }

  /**
   * Create timeout promise
   */
  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Error handler timeout after ${timeout}ms`))
      }, timeout)
    })
  }

  /**
   * Process and normalize error
   */
  processError(error) {
    if (error instanceof FastifyError) {
      return error
    }
    
    if (error instanceof Error) {
      return new FastifyError(
        error.message,
        error.code || 'UNKNOWN_ERROR',
        error.statusCode || 500,
        { originalError: error.name }
      )
    }
    
    // Handle non-Error objects
    return new FastifyError(
      typeof error === 'string' ? error : 'Unknown error occurred',
      'UNKNOWN_ERROR',
      500,
      { originalValue: error }
    )
  }

  /**
   * Track error for analytics
   */
  trackError(error) {
    const key = error.fingerprint || error.code || 'unknown'
    const count = this.errorCounts.get(key) || 0
    this.errorCounts.set(key, count + 1)
    
    // Add to recent errors (with size limit)
    this.recentErrors.push({
      error: error.serialize ? error.serialize() : { message: error.message },
      timestamp: Date.now()
    })
    
    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors = this.recentErrors.slice(-this.maxRecentErrors)
    }
  }

  /**
   * Default fallback handler
   */
  async defaultFallbackHandler(error, request, reply) {
    const statusCode = error.statusCode || 500
    const message = this.options.sanitizeErrors && statusCode >= 500
      ? 'Internal Server Error'
      : error.message
    
    if (reply && typeof reply.code === 'function') {
      reply.code(statusCode).send({
        error: statusCodes[statusCode] || 'Unknown Error',
        message,
        statusCode,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Record error handling metrics
   */
  recordMetrics(error, startTime, endTime, handled) {
    const duration = Number(endTime - startTime) / 1e6
    const code = error.code || 'UNKNOWN'
    
    const key = `handling:${code}`
    const existing = this.metrics.get(key) || {
      count: 0,
      totalTime: 0,
      averageTime: 0,
      handled: 0,
      unhandled: 0
    }
    
    existing.count++
    existing.totalTime += duration
    existing.averageTime = existing.totalTime / existing.count
    
    if (handled) {
      existing.handled++
    } else {
      existing.unhandled++
    }
    
    this.metrics.set(key, existing)
  }

  /**
   * Get error statistics
   */
  getStats() {
    const errorsByCode = Object.fromEntries(this.errorCounts)
    const handlingMetrics = Object.fromEntries(this.metrics)
    
    return {
      errorCounts: errorsByCode,
      handlingMetrics,
      recentErrorsCount: this.recentErrors.length,
      handlersCount: this.handlers.length,
      topErrors: this.getTopErrors(5)
    }
  }

  /**
   * Get most frequent errors
   */
  getTopErrors(limit = 10) {
    return Array.from(this.errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([code, count]) => ({ code, count }))
  }

  /**
   * Set custom fallback handler
   */
  setFallbackHandler(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Fallback handler must be a function')
    }
    this.fallbackHandler = handler
  }

  /**
   * Clear error tracking data
   */
  clearTracking() {
    this.errorCounts.clear()
    this.recentErrors.length = 0
    this.metrics.clear()
  }
}

/**
 * Error Serialization System
 */
class ErrorSerializer {
  constructor(options = {}) {
    this.options = {
      includeStack: options.includeStack || false,
      sanitizeProduction: options.sanitizeProduction !== false,
      maxStackLines: options.maxStackLines || 20,
      ...options
    }
    
    this.serializers = new Map()
    this.registerDefaultSerializers()
  }

  /**
   * Register default error serializers
   */
  registerDefaultSerializers() {
    this.serializers.set('default', this.defaultSerializer.bind(this))
    this.serializers.set('detailed', this.detailedSerializer.bind(this))
    this.serializers.set('minimal', this.minimalSerializer.bind(this))
    this.serializers.set('production', this.productionSerializer.bind(this))
  }

  /**
   * Serialize error with specified format
   */
  serialize(error, format = 'default') {
    const serializer = this.serializers.get(format)
    if (!serializer) {
      throw new Error(`Unknown serialization format: ${format}`)
    }
    
    return serializer(error)
  }

  /**
   * Default error serializer
   */
  defaultSerializer(error) {
    return {
      error: error.name || 'Error',
      message: error.message,
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Detailed error serializer
   */
  detailedSerializer(error) {
    const base = this.defaultSerializer(error)
    
    return {
      ...base,
      code: error.code,
      id: error.id,
      context: error.context,
      fingerprint: error.fingerprint,
      ...(this.options.includeStack && { 
        stack: this.sanitizeStack(error.stack) 
      })
    }
  }

  /**
   * Minimal error serializer
   */
  minimalSerializer(error) {
    return {
      error: true,
      message: error.message,
      code: error.statusCode || 500
    }
  }

  /**
   * Production-safe error serializer
   */
  productionSerializer(error) {
    const statusCode = error.statusCode || 500
    
    if (statusCode >= 500 && this.options.sanitizeProduction) {
      return {
        error: 'Internal Server Error',
        message: 'An error occurred processing your request',
        statusCode: 500,
        timestamp: new Date().toISOString()
      }
    }
    
    return this.defaultSerializer(error)
  }

  /**
   * Sanitize stack trace
   */
  sanitizeStack(stack) {
    if (!stack) return null
    
    const lines = stack.split('\n')
    return lines
      .slice(0, this.options.maxStackLines)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
  }

  /**
   * Register custom serializer
   */
  registerSerializer(name, serializer) {
    if (typeof serializer !== 'function') {
      throw new Error('Serializer must be a function')
    }
    this.serializers.set(name, serializer)
  }
}

/**
 * Factory function for creating error handling systems
 */
function createErrorSystem(options = {}) {
  const handler = new ErrorHandler(options.handler)
  const serializer = new ErrorSerializer(options.serializer)
  const factory = new ErrorFactory()
  
  return {
    handler,
    serializer,
    factory,
    FastifyError,
    
    // Convenience methods
    handle: (error, request, reply) => handler.handle(error, request, reply),
    serialize: (error, format) => serializer.serialize(error, format),
    create: (code, data, context) => factory.create(code, data, context)
  }
}

module.exports = {
  FastifyError,
  ErrorFactory,
  ErrorHandler,
  ErrorSerializer,
  createErrorSystem
}
