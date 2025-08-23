/**
 * Database Connection and Query Management
 * High-performance PostgreSQL with connection pooling
 */

const { Pool } = require('pg');
const { createSymbolRegistry } = require('../../fastify/core/symbolRegistry');

// Create symbols for internal state
const symbols = createSymbolRegistry('database');
const POOL_SYMBOL = symbols.create('pool');
const METRICS_SYMBOL = symbols.create('metrics');

/**
 * Enhanced database client with performance optimizations
 */
class DatabaseClient {
  constructor(pool) {
    this[POOL_SYMBOL] = pool;
    this[METRICS_SYMBOL] = {
      queries: 0,
      errors: 0,
      totalTime: 0,
      activeConnections: 0,
    };
  }
  
  /**
   * Execute a query with performance tracking
   */
  async query(text, params = []) {
    const start = Date.now();
    const metrics = this[METRICS_SYMBOL];
    
    try {
      metrics.queries++;
      metrics.activeConnections++;
      
      const result = await this[POOL_SYMBOL].query(text, params);
      
      const duration = Date.now() - start;
      metrics.totalTime += duration;
      
      return result;
    } catch (error) {
      metrics.errors++;
      throw error;
    } finally {
      metrics.activeConnections--;
    }
  }
  
  /**
   * Execute a transaction with rollback support
   */
  async transaction(callback) {
    const client = await this[POOL_SYMBOL].connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get database metrics
   */
  getMetrics() {
    const metrics = this[METRICS_SYMBOL];
    const pool = this[POOL_SYMBOL];
    
    return {
      queries: metrics.queries,
      errors: metrics.errors,
      averageQueryTime: metrics.queries > 0 ? metrics.totalTime / metrics.queries : 0,
      activeConnections: metrics.activeConnections,
      poolStats: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
    };
  }
  
  /**
   * Close the database connection pool
   */
  async destroy() {
    await this[POOL_SYMBOL].end();
  }
}

/**
 * Setup database connection with advanced configuration
 */
const setupDatabase = async (config) => {
  const poolConfig = {
    host: config.host,
    port: config.port,
    database: config.name,
    user: config.username,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    
    // Connection pool settings
    min: config.poolMin,
    max: config.poolMax,
    
    // Connection timeout settings
    connectionTimeoutMillis: config.connectionTimeout,
    idleTimeoutMillis: 30000,
    
    // Query timeout
    query_timeout: 20000,
    
    // Connection validation
    allowExitOnIdle: true,
  };
  
  const pool = new Pool(poolConfig);
  
  // Test the connection
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
  
  // Handle pool errors
  pool.on('error', (error) => {
    console.error('Unexpected database pool error:', error);
  });
  
  return new DatabaseClient(pool);
};

/**
 * Common database utilities
 */
const DatabaseUtils = {
  /**
   * Build a WHERE clause from an object
   */
  buildWhereClause(conditions, startIndex = 1) {
    const keys = Object.keys(conditions);
    if (keys.length === 0) return { clause: '', values: [] };
    
    const clause = keys
      .map((key, index) => `${key} = $${startIndex + index}`)
      .join(' AND ');
    
    const values = keys.map(key => conditions[key]);
    
    return { clause: `WHERE ${clause}`, values };
  },
  
  /**
   * Build an INSERT query
   */
  buildInsertQuery(tableName, data) {
    const keys = Object.keys(data);
    const columns = keys.join(', ');
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    const values = keys.map(key => data[key]);
    
    const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
    
    return { query, values };
  },
  
  /**
   * Build an UPDATE query
   */
  buildUpdateQuery(tableName, data, conditions) {
    const dataKeys = Object.keys(data);
    const setClause = dataKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    
    const whereClause = DatabaseUtils.buildWhereClause(conditions, dataKeys.length + 1);
    const values = [...dataKeys.map(key => data[key]), ...whereClause.values];
    
    const query = `UPDATE ${tableName} SET ${setClause} ${whereClause.clause} RETURNING *`;
    
    return { query, values };
  },
  
  /**
   * Paginate results
   */
  paginate(query, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return `${query} LIMIT ${limit} OFFSET ${offset}`;
  },
};

module.exports = {
  setupDatabase,
  DatabaseUtils,
};
