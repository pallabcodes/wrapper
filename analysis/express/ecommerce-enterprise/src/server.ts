import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cluster from 'cluster';
import os from 'os';

import { validateEnv } from '@/core/config/env';
import { logger } from '@/core/utils/logger';
import { errorHandler } from '@/core/errors/errorHandler';
import { rateLimiter } from '@/core/middleware/rateLimiter';
import { requestLogger } from '@/core/middleware/requestLogger';
import { healthCheck } from '@/core/middleware/healthCheck';
import { setupSwagger } from '@/core/middleware/swagger';
import { setupMetrics } from '@/core/middleware/metrics';
import { setupSocketIO } from '@/infrastructure/socket/socketServer';
import { initializeRedis } from '@/infrastructure/cache/redisClient';
import { initializeQueue } from '@/infrastructure/queue/queueManager';
import { initializeDatabase } from '@/infrastructure/database/connection';

// Import route modules
import authRoutes from '@/features/auth/routes/authRoutes';
import userRoutes from '@/features/users/routes/userRoutes';
import productRoutes from '@/features/products/routes/productRoutes';
import orderRoutes from '@/features/orders/routes/orderRoutes';
import paymentRoutes from '@/features/payments/routes/paymentRoutes';
import inventoryRoutes from '@/features/inventory/routes/inventoryRoutes';
import chatRoutes from '@/features/chat/routes/chatRoutes';
import notificationRoutes from '@/features/notifications/routes/notificationRoutes';

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  logger.info(`Master ${process.pid} is running`);

  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  // Worker process
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  // Initialize environment
  validateEnv();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Compression
  app.use(compression());

  // Request logging
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
  app.use(requestLogger);

  // Rate limiting
  app.use(rateLimiter);

  // Health check endpoint
  app.get('/health', healthCheck);

  // Metrics endpoint
  app.use('/metrics', setupMetrics());

  // API Documentation
  if (process.env.ENABLE_SWAGGER === 'true') {
    setupSwagger(app);
  }

  // API Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/products', productRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/inventory', inventoryRoutes);
  app.use('/api/v1/chat', chatRoutes);
  app.use('/api/v1/notifications', notificationRoutes);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Initialize infrastructure
  const initializeApp = async () => {
    try {
      // Initialize database connection
      await initializeDatabase();
      logger.info('Database connected successfully');

      // Initialize Redis
      await initializeRedis();
      logger.info('Redis connected successfully');

      // Initialize queue system
      await initializeQueue();
      logger.info('Queue system initialized');

      // Setup Socket.IO
      setupSocketIO(io);
      logger.info('Socket.IO server setup complete');

      const port = process.env.PORT || 3000;
      server.listen(port, () => {
        logger.info(`Worker ${process.pid} started on port ${port}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
        logger.info(`API Documentation: http://localhost:${port}/api-docs`);
        logger.info(`Health Check: http://localhost:${port}/health`);
        logger.info(`Metrics: http://localhost:${port}/metrics`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        logger.info('SIGTERM received, shutting down gracefully');
        server.close(() => {
          logger.info('Process terminated');
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        logger.info('SIGINT received, shutting down gracefully');
        server.close(() => {
          logger.info('Process terminated');
          process.exit(0);
        });
      });

    } catch (error) {
      logger.error('Failed to initialize application:', error);
      process.exit(1);
    }
  };

  initializeApp();
}
