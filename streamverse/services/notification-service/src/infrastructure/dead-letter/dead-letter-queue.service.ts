import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * Dead Letter Queue Entity for failed message processing
 * TODO: Create proper entity when implementing full DLQ
 */
interface DeadLetterEntity {
  id: string;
  originalEventId: string;
  eventType: string;
  aggregateId: string;
  eventData: Record<string, unknown>;
  failureReason: string;
  retryCount: number;
  failedAt: Date;
  lastError: string;
  status: 'failed' | 'retry_exhausted';
}

export interface DeadLetterEvent {
  originalEventId: string;
  eventType: string;
  aggregateId: string;
  eventData: Record<string, unknown>;
  failureReason: string;
  retryCount: number;
  lastError: string;
  failedAt?: Date;
  status?: 'failed' | 'retry_exhausted';
}

export interface IDeadLetterQueue {
  /**
   * Publish failed event to dead letter queue
   */
  publish(failedEvent: {
    originalEventId: string;
    eventType: string;
    aggregateId: string;
    eventData: Record<string, unknown>;
    failureReason: string;
    retryCount: number;
    lastError: string;
  }): Promise<void>;

  /**
   * Get failed events for analysis/monitoring
   */
  getFailedEvents(limit?: number): Promise<DeadLetterEvent[]>;

  /**
   * Retry failed event (manual intervention)
   */
  retryEvent(eventId: string): Promise<void>;
}

/**
 * Dead Letter Queue Service - Handle failed message processing
 * Stores messages that failed after all retry attempts for analysis
 * TODO: Implement full DLQ with monitoring and manual retry capabilities
 */
@Injectable()
export class DeadLetterQueueService implements IDeadLetterQueue {
  constructor(
    // TODO: Inject proper DLQ repository
    // @InjectRepository(DeadLetterEntity)
    // private readonly deadLetterRepository: Repository<DeadLetterEntity>,
  ) { }

  async publish(failedEvent: {
    originalEventId: string;
    eventType: string;
    aggregateId: string;
    eventData: Record<string, unknown>;
    failureReason: string;
    retryCount: number;
    lastError: string;
  }): Promise<void> {
    // TODO: Implement actual DLQ storage
    // For now, just log critical failures for monitoring

    const deadLetterEvent = {
      originalEventId: failedEvent.originalEventId,
      eventType: failedEvent.eventType,
      aggregateId: failedEvent.aggregateId,
      eventData: failedEvent.eventData,
      failureReason: failedEvent.failureReason,
      retryCount: failedEvent.retryCount,
      lastError: failedEvent.lastError,
      failedAt: new Date(),
      status: 'retry_exhausted' as const,
    };

    console.error('💀 DEAD LETTER QUEUE: Message failed permanently:', JSON.stringify(deadLetterEvent, null, 2));

    // TODO: Store in database for monitoring and analysis
    // await this.deadLetterRepository.save(deadLetterEvent);

    // TODO: Send alerts to monitoring system (PagerDuty, Slack, etc.)
    // await this.monitoringService.alert('message_processing_failed', {
    //   eventType: failedEvent.eventType,
    //   failureReason: failedEvent.failureReason,
    //   retryCount: failedEvent.retryCount
    // });
  }

  async getFailedEvents(limit: number = 100): Promise<DeadLetterEvent[]> {
    // TODO: Retrieve failed events for analysis
    console.log(`🔍 DLQ: Retrieving failed events (limit: ${limit})`);
    return []; // Placeholder
  }

  async retryEvent(eventId: string): Promise<void> {
    // TODO: Implement manual retry capability
    console.log(`🔄 DLQ: Manual retry requested for event ${eventId}`);

    // TODO: Retrieve event from DLQ and republish to original topic
    // const failedEvent = await this.deadLetterRepository.findOne({ where: { id: eventId } });
    // if (failedEvent) {
    //   await this.kafkaService.publish(failedEvent.eventType, failedEvent.eventData);
    //   await this.deadLetterRepository.update(eventId, { status: 'retried' });
    // }
  }
}
