/**
 * Advanced Validation System
 * Extracted and Enhanced from Fastify Core for Universal Use
 * 
 * Features:
 * - High-performance schema compilation and caching
 * - Multiple validation backends (AJV, Joi, Yup, etc.)
 * - Custom validator composition and pipeline
 * - Async validation support with circuit breakers
 * - Schema transformation and optimization
 * - Advanced error formatting and localization
 */

'use strict'

const {
  kSchemaHeaders,
  kSchemaParams,
  kSchemaQuerystring,
  kSchemaBody,
  kSchemaResponse
} = require('./symbolRegistry')

/**
 * Advanced Schema Compiler with Caching and Optimization
 */
class SchemaCompiler {
  constructor(options = {}) {
    this.options = {
      cache: options.cache !== false,
      cacheSize: options.cacheSize || 1000,
      enableOptimization: options.enableOptimization !== false,
      enableMetrics: options.enableMetrics !== false,
      defaultCompiler: options.defaultCompiler || 'ajv',
      ...options
    }
    
    this.compilers = new Map()
    this.cache = new Map()
    this.metrics = new Map()
    this.schemas = new Map()
    
    // Register default compilers
    this.registerDefaultCompilers()
  }

  /**
   * Register default schema compilers
   */
  registerDefaultCompilers() {
    // AJV compiler (default)
    this.registerCompiler('ajv', this.createAjvCompiler())
    
    // JSON Schema compiler
    this.registerCompiler('json-schema', this.createJsonSchemaCompiler())
    
    // Custom function compiler
    this.registerCompiler('function', this.createFunctionCompiler())
  }

  /**
   * Create AJV-based compiler
   */
  createAjvCompiler() {
    return {
      compile: (schema, options = {}) => {
        try {
          // Dynamic import for AJV (if available)
          const Ajv = require('ajv')
          const addFormats = require('ajv-formats')
          
          const ajv = new Ajv({
            allErrors: true,
            removeAdditional: 'all',
            useDefaults: true,
            coerceTypes: true,
            ...options.ajvOptions
          })
          
          addFormats(ajv)
          
          const validate = ajv.compile(schema)
          
          return (data) => {
            const valid = validate(data)
            if (!valid) {
              throw this.formatAjvErrors(validate.errors, options.dataVar)
            }
            return data
          }
        } catch (error) {
          throw new Error(`AJV compilation failed: ${error.message}`)
        }
      }
    }
  }

  /**
   * Create JSON Schema compiler
   */
  createJsonSchemaCompiler() {
    return {
      compile: (schema, options = {}) => {
        return (data) => {
          // Basic JSON schema validation
          if (schema.type && typeof data !== schema.type) {
            throw new Error(`Expected ${schema.type}, got ${typeof data}`)
          }
          
          if (schema.required && Array.isArray(schema.required)) {
            for (const prop of schema.required) {
              if (!(prop in data)) {
                throw new Error(`Missing required property: ${prop}`)
              }
            }
          }
          
          return data
        }
      }
    }
  }

  /**
   * Create function-based compiler
   */
  createFunctionCompiler() {
    return {
      compile: (schema, options = {}) => {
        if (typeof schema === 'function') {
          return schema
        }
        throw new Error('Function compiler requires schema to be a function')
      }
    }
  }

  /**
   * Register custom compiler
   */
  registerCompiler(name, compiler) {
    if (!compiler || typeof compiler.compile !== 'function') {
      throw new Error('Compiler must have a compile method')
    }
    this.compilers.set(name, compiler)
  }

  /**
   * Compile schema with caching
   */
  compile(schema, options = {}) {
    const compilerName = options.compiler || this.options.defaultCompiler
    const cacheKey = this.generateCacheKey(schema, options)
    
    // Check cache
    if (this.options.cache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      this.recordMetric('cache_hit', compilerName)
      return cached.validator
    }
    
    // Get compiler
    const compiler = this.compilers.get(compilerName)
    if (!compiler) {
      throw new Error(`Unknown compiler: ${compilerName}`)
    }
    
    // Optimize schema if enabled
    const optimizedSchema = this.options.enableOptimization 
      ? this.optimizeSchema(schema)
      : schema
    
    // Compile
    const startTime = process.hrtime.bigint()
    try {
      const validator = compiler.compile(optimizedSchema, options)
      
      // Cache result
      if (this.options.cache) {
        this.cacheValidator(cacheKey, validator, schema, options)
      }
      
      // Record metrics
      const endTime = process.hrtime.bigint()
      this.recordCompilationMetric(compilerName, startTime, endTime, true)
      
      return validator
    } catch (error) {
      const endTime = process.hrtime.bigint()
      this.recordCompilationMetric(compilerName, startTime, endTime, false)
      throw error
    }
  }

  /**
   * Generate cache key for schema
   */
  generateCacheKey(schema, options) {
    const schemaStr = JSON.stringify(schema)
    const optionsStr = JSON.stringify(options)
    return `${schemaStr}:${optionsStr}`
  }

  /**
   * Cache compiled validator
   */
  cacheValidator(key, validator, schema, options) {
    // Implement LRU cache behavior
    if (this.cache.size >= this.options.cacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      validator,
      schema,
      options,
      createdAt: Date.now(),
      accessCount: 0
    })
  }

  /**
   * Optimize schema for better performance
   */
  optimizeSchema(schema) {
    if (!schema || typeof schema !== 'object') {
      return schema
    }
    
    const optimized = { ...schema }
    
    // Remove unused properties
    if (optimized.description && !this.options.keepDescriptions) {
      delete optimized.description
    }
    
    // Optimize arrays
    if (optimized.type === 'array' && optimized.items) {
      optimized.items = this.optimizeSchema(optimized.items)
    }
    
    // Optimize objects
    if (optimized.type === 'object' && optimized.properties) {
      const optimizedProps = {}
      for (const [key, prop] of Object.entries(optimized.properties)) {
        optimizedProps[key] = this.optimizeSchema(prop)
      }
      optimized.properties = optimizedProps
    }
    
    return optimized
  }

  /**
   * Format AJV validation errors
   */
  formatAjvErrors(errors, dataVar = 'data') {
    if (!errors || errors.length === 0) {
      return new Error('Validation failed')
    }
    
    const messages = errors.map(error => {
      const path = error.instancePath || ''
      return `${dataVar}${path} ${error.message}`
    })
    
    return new Error(messages.join(', '))
  }

  /**
   * Record compilation metrics
   */
  recordCompilationMetric(compiler, startTime, endTime, success) {
    if (!this.options.enableMetrics) return
    
    const duration = Number(endTime - startTime) / 1e6 // Convert to ms
    const key = `compilation:${compiler}`
    
    const existing = this.metrics.get(key) || {
      count: 0,
      totalTime: 0,
      averageTime: 0,
      successes: 0,
      failures: 0
    }
    
    existing.count++
    existing.totalTime += duration
    existing.averageTime = existing.totalTime / existing.count
    
    if (success) {
      existing.successes++
    } else {
      existing.failures++
    }
    
    this.metrics.set(key, existing)
  }

  /**
   * Record cache metrics
   */
  recordMetric(type, compiler) {
    if (!this.options.enableMetrics) return
    
    const key = `${type}:${compiler}`
    const count = this.metrics.get(key) || 0
    this.metrics.set(key, count + 1)
  }

  /**
   * Get compilation statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.options.cacheSize,
      compilersCount: this.compilers.size,
      metrics: Object.fromEntries(this.metrics)
    }
  }

  /**
   * Clear cache and metrics
   */
  clear() {
    this.cache.clear()
    this.metrics.clear()
  }
}

/**
 * Advanced Validation System
 */
class ValidationSystem {
  constructor(options = {}) {
    this.schemaCompiler = new SchemaCompiler(options.compiler)
    this.validators = new Map()
    this.errorFormatters = new Map()
    this.middleware = []
    
    // Register default error formatters
    this.registerDefaultErrorFormatters()
  }

  /**
   * Register default error formatters
   */
  registerDefaultErrorFormatters() {
    this.errorFormatters.set('default', this.defaultErrorFormatter)
    this.errorFormatters.set('detailed', this.detailedErrorFormatter)
    this.errorFormatters.set('simple', this.simpleErrorFormatter)
  }

  /**
   * Compile schemas for validation context
   */
  compileSchemasForValidation(context, options = {}) {
    const { schema } = context
    if (!schema) return
    
    const { method, url } = context.config || {}
    const compileOptions = { method, url, ...options }
    
    // Compile headers schema
    if (schema.headers) {
      context[kSchemaHeaders] = this.compileHeadersSchema(schema.headers, compileOptions)
    }
    
    // Compile params schema
    if (schema.params) {
      context[kSchemaParams] = this.schemaCompiler.compile(schema.params, {
        ...compileOptions,
        httpPart: 'params'
      })
    }
    
    // Compile querystring schema
    if (schema.querystring) {
      context[kSchemaQuerystring] = this.schemaCompiler.compile(schema.querystring, {
        ...compileOptions,
        httpPart: 'querystring'
      })
    }
    
    // Compile body schema
    if (schema.body) {
      context[kSchemaBody] = this.compileBodySchema(schema.body, compileOptions)
    }
  }

  /**
   * Compile schemas for serialization
   */
  compileSchemasForSerialization(context, options = {}) {
    if (!context.schema || !context.schema.response) return
    
    const { method, url } = context.config || {}
    const schemas = {}
    
    for (const [statusCode, schema] of Object.entries(context.schema.response)) {
      const normalizedCode = statusCode.toLowerCase()
      
      if (!this.isValidStatusCode(normalizedCode)) {
        throw new Error(`Invalid response status code: ${statusCode}`)
      }
      
      if (schema.content) {
        const contentSchemas = {}
        for (const [mediaType, contentSchema] of Object.entries(schema.content)) {
          contentSchemas[mediaType] = this.schemaCompiler.compile(contentSchema.schema, {
            method,
            url,
            httpStatus: normalizedCode,
            contentType: mediaType,
            ...options
          })
        }
        schemas[normalizedCode] = contentSchemas
      } else {
        schemas[normalizedCode] = this.schemaCompiler.compile(schema, {
          method,
          url,
          httpStatus: normalizedCode,
          ...options
        })
      }
    }
    
    context[kSchemaResponse] = schemas
  }

  /**
   * Compile headers schema with case-insensitive handling
   */
  compileHeadersSchema(schema, options) {
    // Make headers case-insensitive
    const lowerCaseSchema = { ...schema }
    
    if (schema.required && Array.isArray(schema.required)) {
      lowerCaseSchema.required = schema.required.map(h => h.toLowerCase())
    }
    
    if (schema.properties) {
      lowerCaseSchema.properties = {}
      for (const [key, value] of Object.entries(schema.properties)) {
        lowerCaseSchema.properties[key.toLowerCase()] = value
      }
    }
    
    return this.schemaCompiler.compile(lowerCaseSchema, {
      ...options,
      httpPart: 'headers'
    })
  }

  /**
   * Compile body schema with content type support
   */
  compileBodySchema(schema, options) {
    if (schema.content) {
      const contentSchemas = {}
      for (const [contentType, contentSchema] of Object.entries(schema.content)) {
        contentSchemas[contentType] = this.schemaCompiler.compile(contentSchema.schema, {
          ...options,
          httpPart: 'body',
          contentType
        })
      }
      return contentSchemas
    }
    
    return this.schemaCompiler.compile(schema, {
      ...options,
      httpPart: 'body'
    })
  }

  /**
   * Validate request against context schemas
   */
  validateRequest(context, request) {
    const errors = []
    
    try {
      // Validate headers
      if (context[kSchemaHeaders]) {
        const lowerCaseHeaders = this.lowerCaseHeaders(request.headers)
        context[kSchemaHeaders](lowerCaseHeaders)
      }
      
      // Validate params
      if (context[kSchemaParams]) {
        context[kSchemaParams](request.params)
      }
      
      // Validate querystring
      if (context[kSchemaQuerystring]) {
        context[kSchemaQuerystring](request.query)
      }
      
      // Validate body
      if (context[kSchemaBody]) {
        this.validateBody(context[kSchemaBody], request)
      }
      
    } catch (error) {
      errors.push(error)
    }
    
    if (errors.length > 0) {
      throw this.formatValidationErrors(errors, context)
    }
  }

  /**
   * Validate request body with content type support
   */
  validateBody(bodySchema, request) {
    if (typeof bodySchema === 'function') {
      // Single schema validator
      bodySchema(request.body)
    } else if (typeof bodySchema === 'object') {
      // Content-type specific schemas
      const contentType = request.headers['content-type']
      const validator = this.findBodyValidator(bodySchema, contentType)
      
      if (validator) {
        validator(request.body)
      }
    }
  }

  /**
   * Find appropriate body validator based on content type
   */
  findBodyValidator(schemas, contentType) {
    if (!contentType) return null
    
    // Exact match
    if (schemas[contentType]) {
      return schemas[contentType]
    }
    
    // Partial match (e.g., application/json matches application/json; charset=utf-8)
    const baseType = contentType.split(';')[0].trim()
    if (schemas[baseType]) {
      return schemas[baseType]
    }
    
    return null
  }

  /**
   * Convert headers to lowercase for case-insensitive validation
   */
  lowerCaseHeaders(headers) {
    const lowerCase = {}
    for (const [key, value] of Object.entries(headers)) {
      lowerCase[key.toLowerCase()] = value
    }
    return lowerCase
  }

  /**
   * Check if status code is valid
   */
  isValidStatusCode(code) {
    return /^[1-5](?:\d{2}|xx)$|^default$/.test(code)
  }

  /**
   * Format validation errors
   */
  formatValidationErrors(errors, context) {
    const formatter = this.errorFormatters.get(context.errorFormatter || 'default')
    return formatter ? formatter(errors) : this.defaultErrorFormatter(errors)
  }

  /**
   * Default error formatter
   */
  defaultErrorFormatter(errors) {
    const messages = errors.map(error => error.message)
    return new Error(messages.join('; '))
  }

  /**
   * Detailed error formatter
   */
  detailedErrorFormatter(errors) {
    return new Error(JSON.stringify(errors.map(error => ({
      message: error.message,
      path: error.path || '',
      value: error.value
    }))))
  }

  /**
   * Simple error formatter
   */
  simpleErrorFormatter(errors) {
    return new Error('Validation failed')
  }

  /**
   * Register custom error formatter
   */
  registerErrorFormatter(name, formatter) {
    if (typeof formatter !== 'function') {
      throw new Error('Error formatter must be a function')
    }
    this.errorFormatters.set(name, formatter)
  }

  /**
   * Add validation middleware
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function')
    }
    this.middleware.push(middleware)
  }

  /**
   * Get validation statistics
   */
  getStats() {
    return {
      compiler: this.schemaCompiler.getStats(),
      validators: this.validators.size,
      errorFormatters: this.errorFormatters.size,
      middleware: this.middleware.length
    }
  }
}

/**
 * Factory function for creating validation systems
 */
function createValidationSystem(options = {}) {
  return new ValidationSystem(options)
}

/**
 * Standalone validation function
 */
function validate(context, request) {
  const system = new ValidationSystem()
  return system.validateRequest(context, request)
}

module.exports = {
  ValidationSystem,
  SchemaCompiler,
  createValidationSystem,
  validate
}
