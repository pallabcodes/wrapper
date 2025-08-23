/**
 * Main Export Module for Advanced Fastify Core Components
 * Phase 1 Complete - All Extractable Components Organized
 * 
 * This module provides universally repurposable components extracted
 * from Fastify core with enhancements for Silicon Valley-grade engineering.
 * 
 * Architecture Philosophy:
 * - Every component is designed for extension and customization
 * - Memory-efficient with performance monitoring built-in
 * - Functional programming approach (no OOP)
 * - Microservice-ready modular design
 * - C++ addon integration support
 */

'use strict'

// Core System Components
const symbolRegistry = require('./core/symbolRegistry')
const promiseManager = require('./core/promiseManager')
const hookSystem = require('./core/hookSystem')
const contextManager = require('./core/contextManager')
const contentTypeParser = require('./core/contentTypeParser')
const validationSystem = require('./core/validationSystem')
const errorSystem = require('./core/errorSystem')
const pluginSystem = require('./core/pluginSystem')
const serverManager = require('./core/serverManager')
const typeSystem = require('./core/typeSystem')

// Re-export existing utilities (enhanced versions)
const bufferUtils = require('./bufferUtils')
const decoratorUtils = require('./decoratorUtils')
const fileValidator = require('./fileValidator')
const httpLifecycleUtils = require('./httpLifecycleUtils')
const promiseUtils = require('./promiseUtils')
const replyUtils = require('./replyUtils')
const requestContext = require('./requestContext')
const requestUtils = require('./requestUtils')
const symbols = require('./symbols')
const validationUtils = require('./validationUtils')

/**
 * Factory function to create a complete Fastify-like system
 * with all extracted components integrated
 */
function createAdvancedFramework(options = {}) {
  const {
    symbolRegistry: symbolOpts = {},
    promiseManager: promiseOpts = {},
    hookSystem: hookOpts = {},
    contextManager: contextOpts = {},
    contentTypeParser: ctpOpts = {},
    validationSystem: validationOpts = {},
    errorSystem: errorOpts = {},
    pluginSystem: pluginOpts = {},
    serverManager: serverOpts = {},
    typeSystem: typeOpts = {}
  } = options

  // Create symbol registry for isolated namespacing
  const symbols = symbolRegistry.createSymbolRegistry('advanced-framework')
  
  // Create core systems
  const promises = promiseManager
  const hooks = hookSystem.createHookSystem(hookOpts)
  const contexts = new contextManager.ContextFactory()
  const contentParser = contentTypeParser.createContentTypeParser(ctpOpts)
  const validation = validationSystem.createValidationSystem(validationOpts)
  const errors = errorSystem.createErrorSystem(errorOpts)
  const plugins = pluginSystem.createPluginSystem(pluginOpts)
  const servers = serverManager.createServerManager(serverOpts)
  const types = typeSystem.createTypeProvider(typeOpts)
  
  return {
    // Core systems
    symbols,
    promises,
    hooks,
    contexts,
    contentParser,
    validation,
    errors,
    plugins,
    servers,
    types,
    
    // Utility functions
    utils: {
      buffer: bufferUtils,
      decorator: decoratorUtils,
      file: fileValidator,
      lifecycle: httpLifecycleUtils,
      promise: promiseUtils,
      reply: replyUtils,
      request: requestUtils,
      validation: validationUtils
    },
    
    // Factory methods for common patterns
    createContext: (config) => contexts.create(config),
    createHook: (name, fn, meta) => hooks.addHook(name, fn, meta),
    createPlugin: (fn, meta) => plugins.register(fn, { meta }),
    createServer: (opts, handler) => servers.createServer(opts, handler),
    createValidator: (schema) => validation.compile(schema),
    createError: (code, data, context) => errors.create(code, data, context),
    
    // Performance and monitoring
    getStats: () => ({
      hooks: hooks.getMetrics(),
      contexts: contexts.getStats(),
      validation: validation.getStats(),
      errors: errors.handler.getStats(),
      plugins: plugins.getStats(),
      servers: servers.getStats()
    }),
    
    // Advanced features
    createCircuitBreaker: (options) => new promises.PromiseCircuitBreaker(options),
    createCache: (options) => new promises.PromiseCache(options),
    createBatchProcessor: (options) => new promises.PromiseBatchProcessor(options),
    
    // Plugin composition
    compose: (...plugins) => {
      return async (instance) => {
        for (const plugin of plugins) {
          await plugin(instance)
        }
      }
    },
    
    // Microservice extraction helper
    extractModule: (name, dependencies = []) => {
      const module = {
        name,
        dependencies,
        hooks: hooks.container.getHooks(name),
        contexts: contexts.getAllDecorations(),
        errors: errors.factory.errorTypes.get(name),
        
        // Create standalone instance
        createStandalone: () => createAdvancedFramework({
          // Inherit only necessary components
          hookSystem: { enableMetrics: true },
          errorSystem: { enableMetrics: true }
        })
      }
      
      return module
    }
  }
}

/**
 * High-performance functional utilities for advanced use cases
 */
const AdvancedUtils = {
  /**
   * Memory-efficient object pooling
   */
  createObjectPool: (factory, maxSize = 100) => {
    const pool = []
    let hits = 0
    let misses = 0
    
    return {
      acquire: () => {
        if (pool.length > 0) {
          hits++
          return pool.pop()
        }
        misses++
        return factory()
      },
      
      release: (obj) => {
        if (pool.length < maxSize) {
          // Reset object for reuse
          if (obj && typeof obj.reset === 'function') {
            obj.reset()
          }
          pool.push(obj)
        }
      },
      
      getStats: () => ({ hits, misses, poolSize: pool.length, hitRate: hits / (hits + misses) })
    }
  },

  /**
   * High-performance event emitter
   */
  createEventEmitter: () => {
    const events = new Map()
    
    return {
      on: (event, listener) => {
        if (!events.has(event)) {
          events.set(event, [])
        }
        events.get(event).push(listener)
      },
      
      emit: (event, ...args) => {
        const listeners = events.get(event)
        if (listeners) {
          for (const listener of listeners) {
            try {
              listener(...args)
            } catch (error) {
              // Silent error handling for performance
            }
          }
        }
      },
      
      off: (event, listener) => {
        const listeners = events.get(event)
        if (listeners) {
          const index = listeners.indexOf(listener)
          if (index !== -1) {
            listeners.splice(index, 1)
          }
        }
      },
      
      clear: () => events.clear()
    }
  },

  /**
   * Lock-free data structures for high concurrency
   */
  createLockFreeQueue: () => {
    const queue = []
    let head = 0
    
    return {
      enqueue: (item) => {
        queue.push(item)
      },
      
      dequeue: () => {
        if (head < queue.length) {
          const item = queue[head]
          head++
          
          // Reset when queue is empty for memory efficiency
          if (head === queue.length) {
            queue.length = 0
            head = 0
          }
          
          return item
        }
        return null
      },
      
      size: () => queue.length - head,
      clear: () => {
        queue.length = 0
        head = 0
      }
    }
  },

  /**
   * Performance monitoring utilities
   */
  createPerformanceMonitor: () => {
    const metrics = new Map()
    
    return {
      time: (label) => {
        const start = process.hrtime.bigint()
        return {
          end: () => {
            const end = process.hrtime.bigint()
            const duration = Number(end - start) / 1e6 // Convert to milliseconds
            
            const existing = metrics.get(label) || { count: 0, total: 0, avg: 0, min: Infinity, max: 0 }
            existing.count++
            existing.total += duration
            existing.avg = existing.total / existing.count
            existing.min = Math.min(existing.min, duration)
            existing.max = Math.max(existing.max, duration)
            
            metrics.set(label, existing)
            return duration
          }
        }
      },
      
      getMetrics: () => Object.fromEntries(metrics),
      clear: () => metrics.clear()
    }
  }
}

module.exports = {
  // Core components
  symbolRegistry,
  promiseManager,
  hookSystem,
  contextManager,
  contentTypeParser,
  validationSystem,
  errorSystem,
  pluginSystem,
  serverManager,
  typeSystem,
  
  // Enhanced utilities
  bufferUtils,
  decoratorUtils,
  fileValidator,
  httpLifecycleUtils,
  promiseUtils,
  replyUtils,
  requestContext,
  requestUtils,
  symbols,
  validationUtils,
  
  // Factory functions
  createAdvancedFramework,
  AdvancedUtils,
  
  // Quick access to commonly used classes
  FastifyError: errorSystem.FastifyError,
  ContextFactory: contextManager.ContextFactory,
  PromisePool: promiseManager.PromisePool,
  HookContainer: hookSystem.HookContainer,
  PluginRegistry: pluginSystem.PluginRegistry,
  ServerFactory: serverManager.ServerFactory,
  TypeProvider: typeSystem.TypeProvider,
  
  // Version info
  version: '1.0.0-phase1',
  phase: 'PHASE_1_COMPLETE'
}
