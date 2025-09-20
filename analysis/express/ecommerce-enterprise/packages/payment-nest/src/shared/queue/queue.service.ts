import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('payment-processing') private paymentQueue: Queue,
    @InjectQueue('webhook-processing') private webhookQueue: Queue,
    @InjectQueue('analytics-processing') private analyticsQueue: Queue,
  ) {}

  async addPaymentJob(data: any, options?: any): Promise<void> {
    await this.paymentQueue.add('process-payment', data, {
      priority: 1,
      ...options,
    });
  }

  async addWebhookJob(data: any, options?: any): Promise<void> {
    await this.webhookQueue.add('process-webhook', data, {
      priority: 2,
      ...options,
    });
  }

  async addAnalyticsJob(data: any, options?: any): Promise<void> {
    await this.analyticsQueue.add('process-analytics', data, {
      priority: 3,
      ...options,
    });
  }

  async getQueueStats(): Promise<any> {
    const [paymentStats, webhookStats, analyticsStats] = await Promise.all([
      this.paymentQueue.getJobCounts(),
      this.webhookQueue.getJobCounts(),
      this.analyticsQueue.getJobCounts(),
    ]);

    return {
      payment: paymentStats,
      webhook: webhookStats,
      analytics: analyticsStats,
    };
  }

  async pauseQueue(queueName: string): Promise<void> {
    switch (queueName) {
      case 'payment-processing':
        await this.paymentQueue.pause();
        break;
      case 'webhook-processing':
        await this.webhookQueue.pause();
        break;
      case 'analytics-processing':
        await this.analyticsQueue.pause();
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }
  }

  async resumeQueue(queueName: string): Promise<void> {
    switch (queueName) {
      case 'payment-processing':
        await this.paymentQueue.resume();
        break;
      case 'webhook-processing':
        await this.webhookQueue.resume();
        break;
      case 'analytics-processing':
        await this.analyticsQueue.resume();
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }
  }

  async clearQueue(queueName: string): Promise<void> {
    switch (queueName) {
      case 'payment-processing':
        await this.paymentQueue.empty();
        break;
      case 'webhook-processing':
        await this.webhookQueue.empty();
        break;
      case 'analytics-processing':
        await this.analyticsQueue.empty();
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }
  }
}
