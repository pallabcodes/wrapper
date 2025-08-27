import Queue from 'bull';
import { logger } from '@/core/utils/logger';
import { recordQueueJob } from '@/core/middleware/metrics';

// Queue configuration
const createQueueConfig = () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Create queue instances
const createQueues = () => {
  const config = createQueueConfig();
  
  return {
    email: new Queue('email', config),
    order: new Queue('order', config),
    payment: new Queue('payment', config),
    notification: new Queue('notification', config),
    inventory: new Queue('inventory', config),
    analytics: new Queue('analytics', config)
  };
};

// Setup queue event handlers
const setupQueueEvents = (queue: Queue.Queue, queueName: string): void => {
  queue.on('completed', (job) => {
    const duration = (Date.now() - job.timestamp) / 1000;
    recordQueueJob(queueName, 'completed', duration);
    logger.info(`Job ${job.id} completed in queue ${queueName}`, {
      jobId: job.id,
      queueName,
      duration: `${duration}s`,
    });
  });

  queue.on('failed', (job, err) => {
    const duration = (Date.now() - job.timestamp) / 1000;
    recordQueueJob(queueName, 'failed', duration);
    logger.error(`Job ${job.id} failed in queue ${queueName}`, {
      jobId: job.id,
      queueName,
      error: err.message,
      duration: `${duration}s`,
    });
  });

  queue.on('stalled', (job) => {
    logger.warn(`Job ${job.id} stalled in queue ${queueName}`, {
      jobId: job.id,
      queueName,
    });
  });

  queue.on('error', (error) => {
    logger.error(`Queue ${queueName} error:`, error);
  });
};

// Initialize queues
const queues = createQueues();

// Setup all queue events
Object.entries(queues).forEach(([name, queue]) => {
  setupQueueEvents(queue, name);
});

// Queue helper functions
export const addEmailJob = async (data: any, options?: Queue.JobOptions): Promise<Queue.Job> => {
  return await queues.email.add(data, options);
};

export const addOrderJob = async (data: any, options?: Queue.JobOptions): Promise<Queue.Job> => {
  return await queues.order.add(data, options);
};

export const addPaymentJob = async (data: any, options?: Queue.JobOptions): Promise<Queue.Job> => {
  return await queues.payment.add(data, options);
};

export const addNotificationJob = async (data: any, options?: Queue.JobOptions): Promise<Queue.Job> => {
  return await queues.notification.add(data, options);
};

export const addInventoryJob = async (data: any, options?: Queue.JobOptions): Promise<Queue.Job> => {
  return await queues.inventory.add(data, options);
};

export const addAnalyticsJob = async (data: any, options?: Queue.JobOptions): Promise<Queue.Job> => {
  return await queues.analytics.add(data, options);
};

// Queue management functions
export const initializeQueue = async (): Promise<void> => {
  try {
    // Test Redis connection by pinging one of the queues
    await queues.email.isReady();
    logger.info('Queue system initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize queue system:', error);
    throw error;
  }
};

export const closeQueues = async (): Promise<void> => {
  try {
    await Promise.all(Object.values(queues).map(queue => queue.close()));
    logger.info('All queues closed');
  } catch (error) {
    logger.error('Error closing queues:', error);
  }
};

// Export queue instances for direct access
export const emailQueue = queues.email;
export const orderQueue = queues.order;
export const paymentQueue = queues.payment;
export const notificationQueue = queues.notification;
export const inventoryQueue = queues.inventory;
export const analyticsQueue = queues.analytics;
