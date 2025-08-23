/**
 * Fastify Symbol Registry Extraction - Memory & Performance Optimized
 * 
 * Extracted from Fastify's internal symbol management with custom optimizations.
 * This creates a high-performance symbol registry that can be used universally
 * across any Node.js application requiring private property management.
 * 
 * Features:
 * - Memory-efficient symbol caching
 * - Namespace isolation
 * - Symbol lifecycle management
 * - Performance monitoring
 * - Zero-copy symbol lookups where possible
 */

/**
 * High-Performance Symbol Registry
 * Based on Fastify's internal symbol management but with Google-grade optimizations
 */
class OptimizedSymbolRegistry {
  constructor(options = {}) {
    this.symbols = new Map();
    this.namespaces = new Map();
    this.metadata = new Map();
    this.options = {
      enableCache: options.enableCache !== false,
      enableMetrics: options.enableMetrics !== false,
      maxCacheSize: options.maxCacheSize || 1000,
      enableGC: options.enableGC !== false,
      ...options
    };
    
    this.metrics = {
      created: 0,
      accessed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      gcRuns: 0
    };

    // LRU cache for frequently accessed symbols
    this.cache = this.options.enableCache ? new Map() : null;
    this.accessOrder = this.options.enableCache ? [] : null;

    // Extracted symbols from Fastify source
    this._initializeFastifySymbols();

    // Automatic garbage collection
    if (this.options.enableGC) {
      this._setupGarbageCollection();
    }
  }

  /**
   * Create or retrieve symbol with namespace support
   * Optimized for zero-copy operations where possible
   */
  create(key, namespace = 'default', options = {}) {
    const fullKey = namespace === 'default' ? key : `${namespace}.${key}`;
    
    // Fast path: Check cache first
    if (this.cache && this.cache.has(fullKey)) {
      this._updateAccessOrder(fullKey);
      this.metrics.cacheHits++;
      this.metrics.accessed++;
      return this.cache.get(fullKey);
    }

    // Check if symbol already exists
    if (this.symbols.has(fullKey)) {
      const symbol = this.symbols.get(fullKey);
      this._addToCache(fullKey, symbol);
      this.metrics.cacheMisses++;
      this.metrics.accessed++;
      return symbol;
    }

    // Create new symbol
    const description = options.description || fullKey;
    const symbol = Symbol(description);
    
    // Store symbol and metadata
    this.symbols.set(fullKey, symbol);
    this.metadata.set(symbol, {
      key: fullKey,
      namespace,
      description,
      createdAt: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      ...options
    });

    // Update namespace tracking
    if (!this.namespaces.has(namespace)) {
      this.namespaces.set(namespace, new Set());
    }
    this.namespaces.get(namespace).add(fullKey);

    // Add to cache
    this._addToCache(fullKey, symbol);
    
    this.metrics.created++;
    this.metrics.accessed++;
    
    return symbol;
  }

  /**
   * Retrieve symbol with performance tracking
   */
  get(key, namespace = 'default') {
    const fullKey = namespace === 'default' ? key : `${namespace}.${key}`;
    
    // Fast cache lookup
    if (this.cache && this.cache.has(fullKey)) {
      this._updateAccessOrder(fullKey);
      this.metrics.cacheHits++;
      this.metrics.accessed++;
      return this.cache.get(fullKey);
    }

    const symbol = this.symbols.get(fullKey);
    if (symbol) {
      const meta = this.metadata.get(symbol);
      if (meta) {
        meta.accessCount++;
        meta.lastAccessed = Date.now();
      }
      
      this._addToCache(fullKey, symbol);
      this.metrics.cacheMisses++;
      this.metrics.accessed++;
    }
    
    return symbol;
  }

  /**
   * Check if symbol exists without accessing it
   */
  has(key, namespace = 'default') {
    const fullKey = namespace === 'default' ? key : `${namespace}.${key}`;
    return this.symbols.has(fullKey);
  }

  /**
   * Delete symbol and cleanup metadata
   */
  delete(key, namespace = 'default') {
    const fullKey = namespace === 'default' ? key : `${namespace}.${key}`;
    const symbol = this.symbols.get(fullKey);
    
    if (symbol) {
      this.symbols.delete(fullKey);
      this.metadata.delete(symbol);
      
      // Remove from namespace
      const nsSet = this.namespaces.get(namespace);
      if (nsSet) {
        nsSet.delete(fullKey);
        if (nsSet.size === 0) {
          this.namespaces.delete(namespace);
        }
      }

      // Remove from cache
      if (this.cache) {
        this.cache.delete(fullKey);
        const index = this.accessOrder.indexOf(fullKey);
        if (index > -1) {
          this.accessOrder.splice(index, 1);
        }
      }

      return true;
    }
    
    return false;
  }

  /**
   * Get all symbols in a namespace
   */
  getNamespace(namespace) {
    const keys = this.namespaces.get(namespace);
    if (!keys) return [];
    
    return Array.from(keys).map(key => ({
      key,
      symbol: this.symbols.get(key),
      metadata: this.metadata.get(this.symbols.get(key))
    }));
  }

  /**
   * Create symbol proxy for enhanced object property management
   */
  createProxy(target, namespace = 'default') {
    const registry = this;
    
    return new Proxy(target, {
      get(obj, prop) {
        if (typeof prop === 'string' && prop.startsWith('_')) {
          const symbol = registry.get(prop.slice(1), namespace);
          return symbol ? obj[symbol] : obj[prop];
        }
        return obj[prop];
      },
      
      set(obj, prop, value) {
        if (typeof prop === 'string' && prop.startsWith('_')) {
          const symbol = registry.create(prop.slice(1), namespace);
          obj[symbol] = value;
          return true;
        }
        obj[prop] = value;
        return true;
      },
      
      has(obj, prop) {
        if (typeof prop === 'string' && prop.startsWith('_')) {
          const symbol = registry.get(prop.slice(1), namespace);
          return symbol ? symbol in obj : prop in obj;
        }
        return prop in obj;
      }
    });
  }

  /**
   * Initialize Fastify's internal symbols for compatibility
   */
  _initializeFastifySymbols() {
    const fastifySymbols = [
      'kAvvioBoot', 'kChildren', 'kServerBindings', 'kBodyLimit',
      'kSupportedHTTPMethods', 'kRoutePrefix', 'kLogLevel', 'kLogSerializers',
      'kHooks', 'kContentTypeParser', 'kState', 'kOptions',
      'kDisableRequestLogging', 'kPluginNameChain', 'kRouteContext',
      'kGenReqId', 'kSchemaController', 'kSchemaHeaders', 'kSchemaParams',
      'kSchemaQuerystring', 'kSchemaBody', 'kSchemaResponse',
      'kSchemaErrorFormatter', 'kSchemaVisited', 'kRequest',
      'kRequestPayloadStream', 'kRequestAcceptVersion', 'kRequestCacheValidateFns',
      'kRequestOriginalUrl', 'kFourOhFour', 'kCanSetNotFoundHandler',
      'kFourOhFourLevelInstance', 'kFourOhFourContext', 'kDefaultJsonParse',
      'kReply', 'kReplySerializer', 'kReplyIsError', 'kReplyHeaders',
      'kReplyTrailers', 'kReplyHasStatusCode', 'kReplyHijacked',
      'kReplyStartTime', 'kReplyNextErrorHandler'
    ];

    for (const symbolName of fastifySymbols) {
      this.create(symbolName, 'fastify', {
        description: `fastify.${symbolName}`,
        fastifyInternal: true
      });
    }
  }

  /**
   * LRU cache management
   */
  _addToCache(key, symbol) {
    if (!this.cache) return;
    
    // Remove if at capacity
    if (this.cache.size >= this.options.maxCacheSize) {
      const oldest = this.accessOrder.shift();
      this.cache.delete(oldest);
    }
    
    this.cache.set(key, symbol);
    this._updateAccessOrder(key);
  }

  _updateAccessOrder(key) {
    if (!this.accessOrder) return;
    
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Automatic garbage collection for unused symbols
   */
  _setupGarbageCollection() {
    const gcInterval = this.options.gcInterval || 300000; // 5 minutes
    
    setInterval(() => {
      this._runGarbageCollection();
    }, gcInterval);
  }

  _runGarbageCollection() {
    const now = Date.now();
    const maxAge = this.options.maxSymbolAge || 3600000; // 1 hour
    const minAccessCount = this.options.minAccessCount || 1;
    
    let collected = 0;
    
    for (const [symbol, meta] of this.metadata.entries()) {
      const age = now - meta.lastAccessed;
      
      if (age > maxAge && meta.accessCount < minAccessCount && !meta.fastifyInternal) {
        const fullKey = meta.key;
        this.delete(meta.key.split('.').pop(), meta.namespace);
        collected++;
      }
    }
    
    this.metrics.gcRuns++;
    
    if (collected > 0 && this.options.enableMetrics) {
      console.debug(`Symbol GC: Collected ${collected} unused symbols`);
    }
  }

  /**
   * Get registry statistics
   */
  getMetrics() {
    return {
      ...this.metrics,
      totalSymbols: this.symbols.size,
      totalNamespaces: this.namespaces.size,
      cacheSize: this.cache ? this.cache.size : 0,
      cacheHitRate: this.metrics.accessed > 0 ? 
        (this.metrics.cacheHits / this.metrics.accessed) * 100 : 0,
      memoryUsage: this._estimateMemoryUsage()
    };
  }

  _estimateMemoryUsage() {
    // Rough estimation of memory usage
    const symbolCount = this.symbols.size;
    const metadataSize = this.metadata.size * 200; // rough bytes per metadata entry
    const cacheSize = this.cache ? this.cache.size * 100 : 0;
    
    return {
      symbols: symbolCount * 50, // rough bytes per symbol
      metadata: metadataSize,
      cache: cacheSize,
      total: symbolCount * 50 + metadataSize + cacheSize
    };
  }

  /**
   * Export symbols for external usage
   */
  exportSymbols(namespace = null) {
    if (namespace) {
      return this.getNamespace(namespace).reduce((acc, { key, symbol }) => {
        const shortKey = key.includes('.') ? key.split('.').pop() : key;
        acc[shortKey] = symbol;
        return acc;
      }, {});
    }
    
    const result = {};
    for (const [key, symbol] of this.symbols.entries()) {
      const shortKey = key.includes('.') ? key.split('.').pop() : key;
      result[shortKey] = symbol;
    }
    return result;
  }
}

// Global registry instance
const globalRegistry = new OptimizedSymbolRegistry();

/**
 * Factory functions for different use cases
 */
function createSymbolRegistry(options = {}) {
  return new OptimizedSymbolRegistry(options);
}

function createFastifySymbols() {
  return globalRegistry.exportSymbols('fastify');
}

function createNamespacedSymbols(namespace, options = {}) {
  const registry = new OptimizedSymbolRegistry(options);
  return {
    create: (key, opts) => registry.create(key, namespace, opts),
    get: (key) => registry.get(key, namespace),
    has: (key) => registry.has(key, namespace),
    delete: (key) => registry.delete(key, namespace),
    export: () => registry.exportSymbols(namespace)
  };
}

module.exports = {
  OptimizedSymbolRegistry,
  createSymbolRegistry,
  createFastifySymbols,
  createNamespacedSymbols,
  globalRegistry
};
