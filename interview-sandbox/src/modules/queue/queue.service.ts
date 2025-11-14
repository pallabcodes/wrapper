import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { EmailJobData } from './processors/email.processor';
import { PaymentJobData } from './processors/payment.processor';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue<EmailJobData>,
    @InjectQueue('payment') private paymentQueue: Queue<PaymentJobData>,
  ) {}

  async addEmailJob(data: EmailJobData) {
    return this.emailQueue.add('send-email', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async addOtpEmailJob(data: EmailJobData & { code: string }) {
    return this.emailQueue.add('send-otp', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async addPaymentJob(data: PaymentJobData) {
    return this.paymentQueue.add('process-payment', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  async addWebhookJob(data: PaymentJobData) {
    return this.paymentQueue.add('handle-webhook', data, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async getEmailQueueStatus() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  async getPaymentQueueStatus() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.paymentQueue.getWaitingCount(),
      this.paymentQueue.getActiveCount(),
      this.paymentQueue.getCompletedCount(),
      this.paymentQueue.getFailedCount(),
      this.paymentQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }
}

