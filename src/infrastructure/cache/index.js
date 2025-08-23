/**
 * Redis Cache Implementation
 * High-performance caching with connection pooling and failover
 */

const Redis = require('ioredis');
const { createSymbolRegistry } = require('../../fastify/core/symbolRegistry');

// Create symbols for internal state
const symbols = createSymbolRegistry('cache');
const CLIENT_SYMBOL = symbols.create('client');
const METRICS_SYMBOL = symbols.create('metrics');

/**
 * Enhanced Redis cache client with performance optimizations
 */
class CacheClient {
  constructor(client) {
    this[CLIENT_SYMBOL] = client;
    this[METRICS_SYMBOL] = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }
  
  /**
   * Get a value from cache with metrics tracking
   */
  async get(key) {
    try {
      const value = await this[CLIENT_SYMBOL].get(key);
      
      if (value !== null) {
        this[METRICS_SYMBOL].hits++;
        return JSON.parse(value);
      } else {
        this[METRICS_SYMBOL].misses++;
        return null;
      }
    } catch (error) {
      this[METRICS_SYMBOL].errors++;
      throw error;
    }
  }
  
  /**
   * Set a value in cache with optional TTL
   */
  async set(key, value, ttl = 3600) {
    try {
      this[METRICS_SYMBOL].sets++;
      
      const serialized = JSON.stringify(value);
      
      if (ttl > 0) {
        return await this[CLIENT_SYMBOL].setex(key, ttl, serialized);
      } else {
        return await this[CLIENT_SYMBOL].set(key, serialized);
      }
    } catch (error) {
      this[METRICS_SYMBOL].errors++;
      throw error;
    }
  }
  
  /**
   * Delete a key from cache
   */
  async del(key) {
    try {
      this[METRICS_SYMBOL].deletes++;
      return await this[CLIENT_SYMBOL].del(key);
    } catch (error) {
      this[METRICS_SYMBOL].errors++;
      throw error;
    }
  }
  
  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      return await this[CLIENT_SYMBOL].exists(key);
    } catch (error) {
      this[METRICS_SYMBOL].errors++;
      throw error;
    }
  }
  
  /**
   * Set multiple keys atomically
   */
  async mset(keyValuePairs, ttl = 3600) {
    try {
      const pipeline = this[CLIENT_SYMBOL].pipeline();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const serialized = JSON.stringify(value);
        if (ttl > 0) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      });
      
      this[METRICS_SYMBOL].sets += Object.keys(keyValuePairs).length;
      return await pipeline.exec();
    } catch (error) {
      this[METRICS_SYMBOL].errors++;
      throw error;
    }
  }
  
  /**
   * Get multiple keys
   */
  async mget(keys) {
    try {
      const values = await this[CLIENT_SYMBOL].mget(keys);
      
      return values.map((value, index) => {
        if (value !== null) {
          this[METRICS_SYMBOL].hits++;
          return JSON.parse(value);
        } else {
          this[METRICS_SYMBOL].misses++;
          return null;
        }
      });
    } catch (error) {
      this[METRICS_SYMBOL].errors++;
      throw error;
    }
  }
  
  /**
   * Increment a counter
   */
  async incr(key, ttl = 3600) {
    try {
      const pipeline = this[CLIENT_SYMBOL].pipeline();
      pipeline.incr(key);
      if (ttl > 0) {
        pipeline.expire(key, ttl);
      }
      
      const results = await pipeline.exec();
      return results[0][1]; // Return the incremented value
    } catch (error) {
      this[METRICS_SYMBOL].errors++;
      throw error;
    }
  }
  
  /**
   * Add item to a set
   */
  async sadd(key, ...members) {
    try {
      return await this[CLIENT_SYMBOL].sadd(key, ...members);
    } catch (error) {
      this[METRICS_SYMBOL].errors++;
      throw error;
    }
  }
  
  /**
   * Get all members of a set
   */
  async smembers(key) {
    try {
      const members = await this[CLIENT_SYMBOL].smembers(key);
      return members.map(member => {
        try {
          return JSON.parse(member);
        } catch {
          return member;
        }
      });
    } catch (error) {
      this[METRICS_SYMBOL].errors++;
      throw error;
    }
  }
  
  /**
   * Cache with automatic refresh
   */
  async cacheWithRefresh(key, fetchFunction, ttl = 3600, refreshThreshold = 0.8) {
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      if (cached) {
        // Check if we need to refresh in background
        const keyTtl = await this[CLIENT_SYMBOL].ttl(key);
        if (keyTtl > 0 && keyTtl < (ttl * refreshThreshold)) {
          // Refresh in background
          setImmediate(async () => {
            try {
              const fresh = await fetchFunction();
              await this.set(key, fresh, ttl);
            } catch (error) {
              // Log error but don't throw
              console.error('Background cache refresh failed:', error);
            }
          });
        }
        return cached;
      }
      
      // Cache miss - fetch fresh data
      const fresh = await fetchFunction();
      await this.set(key, fresh, ttl);
      return fresh;
    } catch (error) {
      this[METRICS_SYMBOL].errors++;
      throw error;
    }
  }
  
  /**
   * Get cache metrics
   */
  getMetrics() {
    const metrics = this[METRICS_SYMBOL];
    const total = metrics.hits + metrics.misses;
    
    return {
      hits: metrics.hits,
      misses: metrics.misses,
      hitRate: total > 0 ? (metrics.hits / total) * 100 : 0,
      sets: metrics.sets,
      deletes: metrics.deletes,
      errors: metrics.errors,
    };
  }
  
  /**
   * Disconnect from Redis
   */
  async disconnect() {
    await this[CLIENT_SYMBOL].disconnect();
  }
}

/**
 * Setup Redis cache with advanced configuration
 */
const setupCache = async (config) => {
  const redisConfig = {
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.db,
    keyPrefix: config.keyPrefix,
    
    // Connection settings
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryDelayOnFailover: config.retryDelayOnFailover,
    maxRetriesPerRequest: config.maxRetriesPerRequest,
    
    // Performance optimizations
    enableAutoPipelining: true,
    maxConnections: 20,
    lazyConnect: true,
    
    // Retry strategy
    retryStrategy: (times) => {
      if (times > 3) return null; // Stop retrying after 3 attempts
      return Math.min(times * 50, 2000); // Exponential backoff
    },
    
    // Reconnect strategy
    reconnectOnError: (error) => {
      const targetError = 'READONLY';
      return error.message.includes(targetError);
    },
  };
  
  const client = new Redis(redisConfig);
  
  // Test the connection
  try {
    await client.ping();
  } catch (error) {
    throw new Error(`Redis connection failed: ${error.message}`);
  }
  
  // Handle Redis events
  client.on('error', (error) => {
    console.error('Redis error:', error);
  });
  
  client.on('connect', () => {
    console.log('Redis connected');
  });
  
  client.on('reconnecting', () => {
    console.log('Redis reconnecting...');
  });
  
  return new CacheClient(client);
};

/**
 * Cache utilities
 */
const CacheUtils = {
  /**
   * Generate cache key with namespace
   */
  key(...parts) {
    return parts.filter(Boolean).join(':');
  },
  
  /**
   * Cache decorator for functions
   */
  memoize(fn, keyGenerator, ttl = 3600) {
    return async function(...args) {
      const key = keyGenerator(...args);
      
      // Try to get from cache
      const cached = await this.cache.get(key);
      if (cached !== null) {
        return cached;
      }
      
      // Execute function and cache result
      const result = await fn.apply(this, args);
      await this.cache.set(key, result, ttl);
      return result;
    };
  },
  
  /**
   * Invalidate cache pattern
   */
  async invalidatePattern(cache, pattern) {
    const client = cache[CLIENT_SYMBOL];
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return keys.length;
  },
};

module.exports = {
  setupCache,
  CacheUtils,
};
