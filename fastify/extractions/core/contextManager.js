/**
 * Advanced Context Management System
 * Extracted and Enhanced from Fastify Core for Universal Use
 * 
 * Features:
 * - High-performance context object pooling
 * - Memory-efficient context inheritance
 * - Custom context factories and builders
 * - Context lifecycle management
 * - Async context propagation
 */

'use strict'

const {
  kFourOhFourContext,
  kReplySerializerDefault,
  kSchemaErrorFormatter,
  kErrorHandler,
  kChildLoggerFactory,
  kOptions,
  kReply,
  kRequest,
  kBodyLimit,
  kLogLevel,
  kContentTypeParser,
  kRouteByFastify,
  kRequestCacheValidateFns,
  kReplyCacheSerializeFns
} = require('./symbolRegistry')

/**
 * Context Pool for Memory Optimization
 */
class ContextPool {
  constructor(maxSize = 100, factory = null) {
    this.maxSize = maxSize
    this.pool = []
    this.factory = factory || (() => ({}))
    this.hits = 0
    this.misses = 0
    this.created = 0
  }

  acquire(initData = {}) {
    let context
    
    if (this.pool.length > 0) {
      context = this.pool.pop()
      this.hits++
      // Reset context for reuse
      this.resetContext(context)
    } else {
      context = this.factory()
      this.misses++
      this.created++
    }
    
    // Initialize with provided data
    return this.initializeContext(context, initData)
  }

  release(context) {
    if (this.pool.length < this.maxSize && context) {
      this.pool.push(context)
    }
  }

  resetContext(context) {
    // Clear all enumerable properties
    for (const key in context) {
      if (Object.prototype.hasOwnProperty.call(context, key)) {
        delete context[key]
      }
    }
    
    // Clear symbol properties that are resetable
    const symbols = Object.getOwnPropertySymbols(context)
    symbols.forEach(symbol => {
      // Keep essential symbols, clear others
      if (!this.isEssentialSymbol(symbol)) {
        delete context[symbol]
      }
    })
  }

  isEssentialSymbol(symbol) {
    // Define which symbols should be preserved across context reuses
    const essential = [
      kReply,
      kRequest,
      kContentTypeParser,
      kErrorHandler
    ]
    return essential.includes(symbol)
  }

  initializeContext(context, initData) {
    Object.assign(context, initData)
    return context
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      created: this.created,
      hitRate: this.hits / (this.hits + this.misses) || 0,
      poolSize: this.pool.length,
      maxSize: this.maxSize
    }
  }

  clear() {
    this.pool.length = 0
    this.hits = 0
    this.misses = 0
    this.created = 0
  }
}

/**
 * Enhanced Context Class with Advanced Features
 */
class Context {
  constructor(config = {}) {
    // Core properties
    this.schema = config.schema
    this.handler = config.handler
    this.config = config.config || {}
    this.server = config.server
    
    // Request/Response classes
    this.Reply = config.server?.[kReply] || null
    this.Request = config.server?.[kRequest] || null
    this.contentTypeParser = config.server?.[kContentTypeParser] || null
    
    // Hook storage
    this.onRequest = null
    this.onSend = null
    this.onError = null
    this.onTimeout = null
    this.preHandler = null
    this.onResponse = null
    this.preSerialization = null
    this.onRequestAbort = null
    
    // Configuration
    this.errorHandler = config.errorHandler || config.server?.[kErrorHandler]
    this.requestIdLogLabel = config.requestIdLogLabel || config.server?.[kOptions]?.requestIdLogLabel
    this.childLoggerFactory = config.childLoggerFactory || config.server?.[kChildLoggerFactory]
    this.logLevel = config.logLevel || config.server?.[kLogLevel]
    this.logSerializers = config.logSerializers
    this.bodyLimit = config.bodyLimit || config.server?.[kBodyLimit]
    
    // Middleware and parsing
    this._middie = null
    this._parserOptions = {
      limit: this.bodyLimit
    }
    
    // Route configuration
    this.exposeHeadRoute = config.exposeHeadRoute
    this.prefixTrailingSlash = config.prefixTrailingSlash
    this.attachValidation = config.attachValidation
    
    // Schema and validation
    this.schemaErrorFormatter = config.schemaErrorFormatter ||
      config.server?.[kSchemaErrorFormatter] ||
      this.defaultSchemaErrorFormatter
      
    this.validatorCompiler = config.validatorCompiler || null
    this.serializerCompiler = config.serializerCompiler || null
    
    // Caching
    this[kRequestCacheValidateFns] = null
    this[kReplyCacheSerializeFns] = null
    this[kFourOhFourContext] = null
    this[kReplySerializerDefault] = config.replySerializer
    this[kRouteByFastify] = config.isFastify || false
    
    // Metadata and tracking
    this.metadata = new Map()
    this.createdAt = Date.now()
    this.accessCount = 0
    this.lastAccessed = null
  }

  /**
   * Default schema error formatter
   */
  defaultSchemaErrorFormatter(errors, dataVar) {
    let text = ''
    const separator = ', '

    for (let i = 0; i !== errors.length; ++i) {
      const e = errors[i]
      text += dataVar + (e.instancePath || '') + ' ' + e.message + separator
    }
    return new Error(text.slice(0, -separator.length))
  }

  /**
   * Clone context with optional overrides
   */
  clone(overrides = {}) {
    const cloned = new Context({
      ...this.toConfig(),
      ...overrides
    })
    
    // Copy metadata
    this.metadata.forEach((value, key) => {
      cloned.metadata.set(key, value)
    })
    
    return cloned
  }

  /**
   * Convert context to configuration object
   */
  toConfig() {
    return {
      schema: this.schema,
      handler: this.handler,
      config: this.config,
      server: this.server,
      errorHandler: this.errorHandler,
      requestIdLogLabel: this.requestIdLogLabel,
      childLoggerFactory: this.childLoggerFactory,
      logLevel: this.logLevel,
      logSerializers: this.logSerializers,
      bodyLimit: this.bodyLimit,
      exposeHeadRoute: this.exposeHeadRoute,
      prefixTrailingSlash: this.prefixTrailingSlash,
      attachValidation: this.attachValidation,
      schemaErrorFormatter: this.schemaErrorFormatter,
      validatorCompiler: this.validatorCompiler,
      serializerCompiler: this.serializerCompiler,
      replySerializer: this[kReplySerializerDefault],
      isFastify: this[kRouteByFastify]
    }
  }

  /**
   * Set metadata
   */
  setMetadata(key, value) {
    this.metadata.set(key, value)
    this.lastAccessed = Date.now()
  }

  /**
   * Get metadata
   */
  getMetadata(key) {
    this.accessCount++
    this.lastAccessed = Date.now()
    return this.metadata.get(key)
  }

  /**
   * Check if context has metadata
   */
  hasMetadata(key) {
    return this.metadata.has(key)
  }

  /**
   * Get context statistics
   */
  getStats() {
    return {
      createdAt: this.createdAt,
      age: Date.now() - this.createdAt,
      accessCount: this.accessCount,
      lastAccessed: this.lastAccessed,
      metadataSize: this.metadata.size,
      hasSchema: !!this.schema,
      hasHandler: !!this.handler
    }
  }
}

/**
 * Context Factory for Creating Optimized Contexts
 */
class ContextFactory {
  constructor(defaults = {}) {
    this.defaults = defaults
    this.pool = new ContextPool(100, () => new Context(this.defaults))
    this.templates = new Map()
    this.middleware = []
  }

  /**
   * Register a context template
   */
  registerTemplate(name, template) {
    this.templates.set(name, template)
  }

  /**
   * Create context from template
   */
  createFromTemplate(templateName, overrides = {}) {
    const template = this.templates.get(templateName)
    if (!template) {
      throw new Error(`Context template '${templateName}' not found`)
    }
    
    const config = {
      ...this.defaults,
      ...template,
      ...overrides
    }
    
    return this.create(config)
  }

  /**
   * Create new context
   */
  create(config = {}) {
    const finalConfig = {
      ...this.defaults,
      ...config
    }
    
    let context = this.pool.acquire(finalConfig)
    
    // Apply middleware
    for (const middleware of this.middleware) {
      context = middleware(context) || context
    }
    
    return context
  }

  /**
   * Release context back to pool
   */
  release(context) {
    this.pool.release(context)
  }

  /**
   * Add middleware that runs on every context creation
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function')
    }
    this.middleware.push(middleware)
  }

  /**
   * Set default configuration
   */
  setDefaults(defaults) {
    Object.assign(this.defaults, defaults)
  }

  /**
   * Get factory statistics
   */
  getStats() {
    return {
      poolStats: this.pool.getStats(),
      templatesCount: this.templates.size,
      middlewareCount: this.middleware.length,
      defaults: Object.keys(this.defaults).length
    }
  }

  /**
   * Clear all templates and reset pool
   */
  clear() {
    this.templates.clear()
    this.pool.clear()
    this.middleware.length = 0
  }
}

/**
 * Context Inheritance Manager
 */
class ContextInheritanceManager {
  constructor() {
    this.inheritanceChain = new Map()
    this.propertyMappings = new Map()
  }

  /**
   * Define inheritance relationship
   */
  defineInheritance(childName, parentName, mappings = {}) {
    this.inheritanceChain.set(childName, parentName)
    if (Object.keys(mappings).length > 0) {
      this.propertyMappings.set(childName, mappings)
    }
  }

  /**
   * Create context with inheritance
   */
  createWithInheritance(name, baseContext, overrides = {}) {
    const chain = this.getInheritanceChain(name)
    let context = baseContext
    
    for (const ancestor of chain.reverse()) {
      const mappings = this.propertyMappings.get(ancestor) || {}
      context = this.applyInheritance(context, mappings, overrides)
    }
    
    return context
  }

  /**
   * Get full inheritance chain
   */
  getInheritanceChain(name) {
    const chain = []
    let current = name
    
    while (current && this.inheritanceChain.has(current)) {
      chain.push(current)
      current = this.inheritanceChain.get(current)
    }
    
    return chain
  }

  /**
   * Apply inheritance mappings
   */
  applyInheritance(context, mappings, overrides) {
    const inherited = { ...context }
    
    // Apply property mappings
    for (const [source, target] of Object.entries(mappings)) {
      if (context[source] !== undefined) {
        inherited[target] = context[source]
      }
    }
    
    // Apply overrides
    Object.assign(inherited, overrides)
    
    return inherited
  }
}

/**
 * Async Context Manager for Request Tracking
 */
class AsyncContextManager {
  constructor() {
    this.contexts = new Map()
    this.activeContext = null
  }

  /**
   * Run function with context
   */
  run(context, fn) {
    const previousContext = this.activeContext
    this.activeContext = context
    
    try {
      return fn()
    } finally {
      this.activeContext = previousContext
    }
  }

  /**
   * Get current active context
   */
  getContext() {
    return this.activeContext
  }

  /**
   * Set context for current execution
   */
  setContext(context) {
    this.activeContext = context
  }

  /**
   * Clear current context
   */
  clearContext() {
    this.activeContext = null
  }
}

module.exports = {
  Context,
  ContextPool,
  ContextFactory,
  ContextInheritanceManager,
  AsyncContextManager
}
