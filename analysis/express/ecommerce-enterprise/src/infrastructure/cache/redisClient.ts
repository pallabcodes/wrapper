import Redis from 'ioredis';
import { logger } from '@/core/utils/logger';
import { recordRedisOperation } from '@/core/middleware/metrics';

// Redis configuration
const createRedisConfig = () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  keyPrefix: 'ecommerce:'
});

// Create Redis instances
const createRedisInstances = () => {
  const config = createRedisConfig();
  
  const client = new Redis(config);
  const subscriber = new Redis({
    ...config,
    lazyConnect: true
  });

  return { client, subscriber };
};

// Setup event handlers
const setupEventHandlers = (client: Redis, subscriber: Redis) => {
  client.on('connect', () => {
    logger.info('Redis client connected');
  });

  client.on('error', (error) => {
    logger.error('Redis client error:', error);
  });

  client.on('close', () => {
    logger.warn('Redis client connection closed');
  });

  subscriber.on('connect', () => {
    logger.info('Redis subscriber connected');
  });

  subscriber.on('error', (error) => {
    logger.error('Redis subscriber error:', error);
  });
};

// Initialize Redis instances
const { client, subscriber } = createRedisInstances();
setupEventHandlers(client, subscriber);

// Pure function to measure operation duration
const measureOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await operation();
    const duration = (Date.now() - start) / 1000;
    recordRedisOperation(operationName, duration);
    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    recordRedisOperation(operationName, duration);
    throw error;
  }
};

// Redis operations
export const get = async (key: string): Promise<string | null> => {
  try {
    return await measureOperation(
      () => client.get(key),
      'get'
    );
  } catch (error) {
    logger.error('Redis get error:', { key, error });
    throw error;
  }
};

export const set = async (key: string, value: string, ttl?: number): Promise<void> => {
  try {
    await measureOperation(
      async () => {
        if (ttl) {
          return await client.setex(key, ttl, value);
        } else {
          return await client.set(key, value);
        }
      },
      'set'
    );
  } catch (error) {
    logger.error('Redis set error:', { key, error });
    throw error;
  }
};

export const del = async (key: string): Promise<void> => {
  try {
    await measureOperation(
      () => client.del(key),
      'del'
    );
  } catch (error) {
    logger.error('Redis del error:', { key, error });
    throw error;
  }
};

export const exists = async (key: string): Promise<boolean> => {
  try {
    const result = await measureOperation(
      () => client.exists(key),
      'exists'
    );
    return result === 1;
  } catch (error) {
    logger.error('Redis exists error:', { key, error });
    throw error;
  }
};

export const expire = async (key: string, seconds: number): Promise<void> => {
  try {
    await measureOperation(
      () => client.expire(key, seconds),
      'expire'
    );
  } catch (error) {
    logger.error('Redis expire error:', { key, seconds, error });
    throw error;
  }
};

export const ping = async (): Promise<string> => {
  return await client.ping();
};

export const getClient = (): Redis => client;
export const getSubscriber = (): Redis => subscriber;

export const disconnect = async (): Promise<void> => {
  await client.disconnect();
  await subscriber.disconnect();
};

// Initialize Redis
export const initializeRedis = async (): Promise<void> => {
  try {
    await ping();
    logger.info('Redis initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    throw error;
  }
};

// Export for backward compatibility
export const redisClient = {
  get,
  set,
  del,
  exists,
  expire,
  ping,
  getClient,
  getSubscriber,
  disconnect
};
