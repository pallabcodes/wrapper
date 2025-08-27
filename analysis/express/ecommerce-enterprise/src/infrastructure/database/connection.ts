import { PrismaClient } from '@prisma/client';
import { logger } from '@/core/utils/logger';

let prismaClient: PrismaClient | null = null;

export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!prismaClient) {
      prismaClient = new PrismaClient({
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'info',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });

      // Setup event listeners for monitoring
      prismaClient.$on('query', (e) => {
        logger.debug('Database query', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        });
      });

      prismaClient.$on('error', (e) => {
        logger.error('Database error', {
          target: e.target,
          timestamp: e.timestamp,
        });
      });

      prismaClient.$on('info', (e) => {
        logger.info('Database info', {
          message: e.message,
          target: e.target,
        });
      });

      prismaClient.$on('warn', (e) => {
        logger.warn('Database warning', {
          message: e.message,
          target: e.target,
        });
      });

      // Test connection
      await prismaClient.$connect();
      logger.info('Database connection established');
    }
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

export const getPrismaClient = (): PrismaClient => {
  if (!prismaClient) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return prismaClient;
};

export const closeDatabase = async (): Promise<void> => {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
    logger.info('Database connection closed');
  }
};
