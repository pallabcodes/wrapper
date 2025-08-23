/**
 * Infrastructure Layer Setup
 * Database, Cache, Queue, Storage initialization
 */

const { setupDatabase } = require('./database');
const { setupCache } = require('./cache');
const { setupQueue } = require('./queue');
const { setupStorage } = require('./storage');

/**
 * Initialize all infrastructure services
 * @param {Object} app - Fastify instance
 * @param {Object} config - Application configuration
 */
const setupInfrastructure = async (app, config) => {
  app.log.info('Setting up infrastructure services...');
  
  try {
    // Setup database connection
    const database = await setupDatabase(config.database);
    app.decorate('db', database);
    app.log.info('✅ Database connected');
    
    // Setup Redis cache
    const cache = await setupCache(config.redis);
    app.decorate('cache', cache);
    app.log.info('✅ Cache connected');
    
    // Setup job queue
    const queue = await setupQueue(config.queue);
    app.decorate('queue', queue);
    app.log.info('✅ Queue initialized');
    
    // Setup file storage
    const storage = await setupStorage(config.storage);
    app.decorate('storage', storage);
    app.log.info('✅ Storage configured');
    
    // Add graceful shutdown hooks
    app.addHook('onClose', async () => {
      app.log.info('Closing infrastructure connections...');
      
      if (database && typeof database.destroy === 'function') {
        await database.destroy();
        app.log.info('Database connection closed');
      }
      
      if (cache && typeof cache.disconnect === 'function') {
        await cache.disconnect();
        app.log.info('Cache connection closed');
      }
      
      if (queue && typeof queue.close === 'function') {
        await queue.close();
        app.log.info('Queue connection closed');
      }
    });
    
    app.log.info('🚀 All infrastructure services ready');
    
  } catch (error) {
    app.log.error('Failed to setup infrastructure:', error);
    throw error;
  }
};

module.exports = {
  setupInfrastructure,
};
