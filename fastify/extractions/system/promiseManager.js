/**
 * Advanced Promise and Thenable Management System
 * Extracted and Enhanced from Fastify Core for Universal Use
 * 
 * Features:
 * - High-performance promise utilities
 * - Memory-efficient promise pooling
 * - Advanced error handling and recovery
 * - Diagnostics channel integration
 * - Custom thenable wrapping strategies
 */

'use strict'

const { kTestInternals } = require('./symbolRegistry')

/**
 * Enhanced Promise.withResolvers polyfill with additional utilities
 */
function withResolvers() {
  let res, rej
  const promise = new Promise((resolve, reject) => {
    res = resolve
    rej = reject
  })
  return { promise, resolve: res, reject: rej }
}

/**
 * Promise Pool for Memory Optimization
 * Reuses promise objects to reduce GC pressure
 */
class PromisePool {
  constructor(maxSize = 100) {
    this.maxSize = maxSize
    this.pool = []
    this.hits = 0
    this.misses = 0
  }

  acquire() {
    if (this.pool.length > 0) {
      this.hits++
      return this.pool.pop()
    }
    this.misses++
    return withResolvers()
  }

  release(promiseWrapper) {
    if (this.pool.length < this.maxSize) {
      // Reset the promise wrapper for reuse
      promiseWrapper.promise = null
      promiseWrapper.resolve = null
      promiseWrapper.reject = null
      this.pool.push(promiseWrapper)
    }
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses),
      poolSize: this.pool.length
    }
  }

  clear() {
    this.pool.length = 0
    this.hits = 0
    this.misses = 0
  }
}

/**
 * Advanced Thenable Wrapper with Diagnostics and Performance Tracking
 */
function createThenableWrapper(diagnosticsChannel) {
  return function wrapThenable(thenable, context, store) {
    if (store) store.async = true

    const startTime = process.hrtime.bigint()
    
    thenable.then(
      function onResolve(payload) {
        const endTime = process.hrtime.bigint()
        const duration = Number(endTime - startTime) / 1e6 // Convert to milliseconds

        if (store) {
          store.duration = duration
          diagnosticsChannel?.asyncStart?.publish(store)
        }

        try {
          if (context.onSuccess) {
            context.onSuccess(payload, duration)
          }
        } finally {
          if (store) {
            diagnosticsChannel?.asyncEnd?.publish(store)
          }
        }
      },
      function onReject(error) {
        const endTime = process.hrtime.bigint()
        const duration = Number(endTime - startTime) / 1e6

        if (store) {
          store.error = error
          store.duration = duration
          diagnosticsChannel?.error?.publish(store)
          diagnosticsChannel?.asyncStart?.publish(store)
        }

        try {
          if (context.onError) {
            context.onError(error, duration)
          }
        } finally {
          if (store) {
            diagnosticsChannel?.asyncEnd?.publish(store)
          }
        }
      }
    )
  }
}

/**
 * Promise Timeout Handler with Custom Strategies
 */
class PromiseTimeoutManager {
  constructor(defaultTimeout = 30000) {
    this.defaultTimeout = defaultTimeout
    this.activeTimeouts = new Map()
    this.strategies = new Map()
    
    // Default timeout strategies
    this.strategies.set('reject', (promise, timeout) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Promise timeout after ${timeout}ms`)), timeout)
        })
      ])
    })
    
    this.strategies.set('resolve', (promise, timeout, fallbackValue) => {
      return Promise.race([
        promise,
        new Promise(resolve => {
          setTimeout(() => resolve(fallbackValue), timeout)
        })
      ])
    })
  }

  addStrategy(name, strategyFn) {
    this.strategies.set(name, strategyFn)
  }

  withTimeout(promise, timeout = this.defaultTimeout, strategy = 'reject', fallbackValue) {
    const strategyFn = this.strategies.get(strategy)
    if (!strategyFn) {
      throw new Error(`Unknown timeout strategy: ${strategy}`)
    }
    
    return strategyFn(promise, timeout, fallbackValue)
  }
}

/**
 * Promise Batch Processor with Concurrency Control
 */
class PromiseBatchProcessor {
  constructor(concurrency = 10) {
    this.concurrency = concurrency
    this.queue = []
    this.running = 0
    this.results = []
  }

  add(promiseFactory, priority = 0) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        promiseFactory,
        priority,
        resolve,
        reject,
        index: this.queue.length
      })
      this.queue.sort((a, b) => b.priority - a.priority)
      this.process()
    })
  }

  async process() {
    while (this.queue.length > 0 && this.running < this.concurrency) {
      this.running++
      const task = this.queue.shift()
      
      try {
        const result = await task.promiseFactory()
        this.results[task.index] = result
        task.resolve(result)
      } catch (error) {
        task.reject(error)
      } finally {
        this.running--
        this.process()
      }
    }
  }

  async processAll(promiseFactories, concurrency = this.concurrency) {
    this.concurrency = concurrency
    const promises = promiseFactories.map(factory => this.add(factory))
    return Promise.allSettled(promises)
  }
}

/**
 * Circuit Breaker for Promise-based Operations
 */
class PromiseCircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5
    this.recoveryTimeout = options.recoveryTimeout || 60000
    this.monitoringPeriod = options.monitoringPeriod || 10000
    
    this.state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    this.failures = 0
    this.lastFailure = null
    this.successes = 0
  }

  async execute(promiseFactory) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure < this.recoveryTimeout) {
        throw new Error('Circuit breaker is OPEN')
      }
      this.state = 'HALF_OPEN'
    }

    try {
      const result = await promiseFactory()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  onSuccess() {
    this.failures = 0
    this.successes++
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED'
    }
  }

  onFailure() {
    this.failures++
    this.lastFailure = Date.now()
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN'
    }
  }

  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure
    }
  }
}

/**
 * Universal Promise Cache with TTL and LRU eviction
 */
class PromiseCache {
  constructor(maxSize = 1000, defaultTTL = 300000) { // 5 minutes default TTL
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
    this.cache = new Map()
    this.accessOrder = new Map()
    this.timeouts = new Map()
  }

  async get(key, promiseFactory, ttl = this.defaultTTL) {
    // Check if promise is already cached and not expired
    if (this.cache.has(key)) {
      this.updateAccessOrder(key)
      return this.cache.get(key)
    }

    // Create and cache the promise
    const promise = promiseFactory()
    this.set(key, promise, ttl)
    
    try {
      const result = await promise
      // Replace promise with resolved value
      this.set(key, result, ttl)
      return result
    } catch (error) {
      // Remove failed promise from cache
      this.delete(key)
      throw error
    }
  }

  set(key, value, ttl = this.defaultTTL) {
    // Evict LRU if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const lruKey = this.accessOrder.keys().next().value
      this.delete(lruKey)
    }

    this.cache.set(key, value)
    this.updateAccessOrder(key)
    
    // Set TTL timeout
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key))
    }
    
    const timeout = setTimeout(() => this.delete(key), ttl)
    this.timeouts.set(key, timeout)
  }

  delete(key) {
    this.cache.delete(key)
    this.accessOrder.delete(key)
    
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key))
      this.timeouts.delete(key)
    }
  }

  updateAccessOrder(key) {
    this.accessOrder.delete(key)
    this.accessOrder.set(key, Date.now())
  }

  clear() {
    this.cache.clear()
    this.accessOrder.clear()
    this.timeouts.forEach(timeout => clearTimeout(timeout))
    this.timeouts.clear()
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.accessOrder.size / (this.accessOrder.size + 1) // Approximate
    }
  }
}

// Main module exports
module.exports = {
  // Core utilities
  withResolvers: typeof Promise.withResolvers === 'function'
    ? Promise.withResolvers.bind(Promise)
    : withResolvers,
  
  // Advanced classes
  PromisePool,
  PromiseTimeoutManager,
  PromiseBatchProcessor,
  PromiseCircuitBreaker,
  PromiseCache,
  
  // Factory functions
  createThenableWrapper,
  
  // Test internals
  [kTestInternals]: {
    withResolvers
  }
}
