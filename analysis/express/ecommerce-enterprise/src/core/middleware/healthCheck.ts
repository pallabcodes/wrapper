import { Request, Response } from 'express';
import { redisClient } from '@/infrastructure/cache/redisClient';
import { getPrismaClient } from '@/infrastructure/database/client';
import { logger } from '@/core/utils/logger';

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: 'unknown',
      redis: 'unknown',
      memory: 'unknown'
    },
    responseTime: 0
  };

  try {
    // Check database connection
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'unhealthy';
    logger.error('Database health check failed', { error });
  }

  try {
    // Check Redis connection
    await redisClient.ping();
    health.checks.redis = 'healthy';
  } catch (error) {
    health.checks.redis = 'unhealthy';
    health.status = 'unhealthy';
    logger.error('Redis health check failed', { error });
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  };

  // Memory threshold: 1GB
  const memoryThreshold = 1024;
  if (memUsageMB.heapUsed > memoryThreshold) {
    health.checks.memory = 'warning';
    logger.warn('High memory usage detected', { memUsageMB });
  } else {
    health.checks.memory = 'healthy';
  }

  health.responseTime = Date.now() - startTime;

  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json(health);
};
