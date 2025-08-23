/**
 * Advanced E-Commerce Platform - Main Entry Point
 * Google/Shopify-level e-commerce system with research-grade implementations
 * Features: CQRS, Event Sourcing, CRDT, Native C++ Addons, Vector Search, DDD
 */

const { ECommerceAPIServer } = require('./src/features/api');
const cluster = require('cluster');
const os = require('os');

/**
 * Production-Ready Cluster Manager
 * Implements multi-process architecture for maximum performance
 */
class ProductionClusterManager {
  constructor() {
    this.numCPUs = os.cpus().length;
    this.workers = new Map();
    this.isShuttingDown = false;
  }

  /**
   * Start cluster with worker processes
   */
  async startCluster() {
    if (cluster.isPrimary) {
      console.log('🏭 Starting Advanced E-Commerce Platform');
      console.log(`🖥️  Master process ${process.pid} is running`);
      console.log(`🔄 Spawning ${this.numCPUs} worker processes...`);

      // Fork workers
      for (let i = 0; i < this.numCPUs; i++) {
        this.forkWorker();
      }

      // Handle worker exit
      cluster.on('exit', (worker, code, signal) => {
        console.log(`💀 Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
        
        if (!this.isShuttingDown) {
          console.log('🔄 Starting a new worker...');
          this.forkWorker();
        }
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();

      console.log('✅ Cluster started successfully');
      console.log('📊 Performance Features Enabled:');
      console.log('  🚀 Multi-process clustering');
      console.log('  🧠 Lock-free memory management');
      console.log('  🔍 HNSW vector search with SIMD');
      console.log('  🔄 CRDT distributed consistency');
      console.log('  📡 Event sourcing with CQRS');
      console.log('  🏗️  Domain-driven design patterns');

    } else {
      // Worker process
      await this.startWorker();
    }
  }

  /**
   * Fork a new worker process
   */
  forkWorker() {
    const worker = cluster.fork();
    this.workers.set(worker.id, worker);

    worker.on('message', (message) => {
      if (message.type === 'ready') {
        console.log(`✅ Worker ${worker.process.pid} is ready`);
      }
    });

    worker.on('error', (error) => {
      console.error(`❌ Worker ${worker.process.pid} error:`, error);
    });

    return worker;
  }

  /**
   * Start individual worker process
   */
  async startWorker() {
    try {
      const server = new ECommerceAPIServer({
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0',
        logger: {
          level: process.env.LOG_LEVEL || 'info',
          prettyPrint: process.env.NODE_ENV !== 'production'
        }
      });

      await server.initialize();
      await server.start();

      // Notify master that worker is ready
      if (process.send) {
        process.send({ type: 'ready', pid: process.pid });
      }

      // Worker-specific shutdown handling
      process.on('SIGTERM', async () => {
        console.log(`🛑 Worker ${process.pid} received SIGTERM, shutting down gracefully...`);
        await server.stop();
        process.exit(0);
      });

      process.on('SIGINT', async () => {
        console.log(`🛑 Worker ${process.pid} received SIGINT, shutting down gracefully...`);
        await server.stop();
        process.exit(0);
      });

    } catch (error) {
      console.error(`❌ Failed to start worker ${process.pid}:`, error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown for master process
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`🛑 Master received ${signal}, initiating graceful shutdown...`);
      this.isShuttingDown = true;

      // Disconnect all workers
      for (const worker of this.workers.values()) {
        if (worker.isDead() === false) {
          console.log(`📤 Disconnecting worker ${worker.process.pid}...`);
          worker.disconnect();
        }
      }

      // Wait for workers to exit
      const shutdownPromises = Array.from(this.workers.values()).map(worker => {
        return new Promise((resolve) => {
          if (worker.isDead()) {
            resolve();
          } else {
            worker.on('exit', resolve);
            // Force kill after 10 seconds
            setTimeout(() => {
              if (!worker.isDead()) {
                console.log(`💀 Force killing worker ${worker.process.pid}`);
                worker.kill('SIGKILL');
              }
              resolve();
            }, 10000);
          }
        });
      });

      await Promise.all(shutdownPromises);
      console.log('✅ All workers shut down successfully');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

/**
 * Development mode - single process
 */
async function startDevelopmentMode() {
  console.log('🛠️  Starting in development mode (single process)');
  
  const server = new ECommerceAPIServer({
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    logger: {
      level: 'debug',
      prettyPrint: true
    }
  });

  await server.initialize();
  await server.start();

  // Development shutdown handling
  process.on('SIGTERM', async () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  console.log('🎯 Development server ready!');
  console.log('🔧 Development features:');
  console.log('  📝 Pretty logging enabled');
  console.log('  🔍 Debug mode active');
  console.log('  🔄 Hot reload support');
}

/**
 * Main application bootstrap
 */
async function bootstrap() {
  try {
    // Environment validation
    const requiredEnvVars = [];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`❌ Required environment variable ${envVar} is not set`);
        process.exit(1);
      }
    }

    // Print startup banner
    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║    🏪 ADVANCED E-COMMERCE PLATFORM v1.0.0                           ║
║                                                                      ║
║    🎯 Google/Shopify-Level Engineering                               ║
║    🧠 Research Paper Implementations                                 ║
║    ⚡ Native C++ Performance Optimizations                          ║
║                                                                      ║
║    📚 Architecture Features:                                         ║
║    • CQRS with Event Sourcing                                       ║
║    • Conflict-free Replicated Data Types (CRDT)                     ║
║    • HNSW Vector Search with SIMD                                   ║
║    • Lock-free Concurrent Data Structures                           ║
║    • Domain-Driven Design (DDD)                                     ║
║    • Saga Pattern for Complex Workflows                             ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
    `);

    // Start based on environment
    if (process.env.NODE_ENV === 'production') {
      const clusterManager = new ProductionClusterManager();
      await clusterManager.startCluster();
    } else {
      await startDevelopmentMode();
    }

  } catch (error) {
    console.error('💥 Failed to start application:', error);
    process.exit(1);
  }
}

/**
 * Handle uncaught exceptions and rejections
 */
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  bootstrap();
}

module.exports = {
  ProductionClusterManager,
  bootstrap,
  startDevelopmentMode
};
