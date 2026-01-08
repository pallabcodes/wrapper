import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeadLetterEntity } from './entities/dead-letter.entity';
import { IDeadLetterQueue, DeadLetterEvent } from '../../domain/ports/dead-letter-queue.port';

/**
 * Postgres Implementation of Dead Letter Queue.
 * Stores failed messages in a database table.
 */
@Injectable()
export class PostgresDeadLetterQueue implements IDeadLetterQueue {
  constructor(
    @InjectRepository(DeadLetterEntity)
    private readonly deadLetterRepository: Repository<DeadLetterEntity>,
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
    const deadLetterEvent = new DeadLetterEntity();
    deadLetterEvent.originalEventId = failedEvent.originalEventId;
    deadLetterEvent.eventType = failedEvent.eventType;
    deadLetterEvent.aggregateId = failedEvent.aggregateId;
    deadLetterEvent.eventData = failedEvent.eventData;
    deadLetterEvent.failureReason = failedEvent.failureReason;
    deadLetterEvent.retryCount = failedEvent.retryCount;
    deadLetterEvent.lastError = failedEvent.lastError;
    deadLetterEvent.status = 'failed';

    console.error('💀 DEAD LETTER QUEUE (Postgres): Message failed permanently:', {
      type: failedEvent.eventType,
      error: failedEvent.failureReason
    });

    await this.deadLetterRepository.save(deadLetterEvent);
  }

  async getFailedEvents(limit: number = 100): Promise<DeadLetterEvent[]> {
    console.log(`🔍 DLQ: Retrieving failed events from Postgres (limit: ${limit})`);
    // Placeholder implementation
    return [];
  }

  async retryEvent(eventId: string): Promise<void> {
    console.log(`🔄 DLQ: Manual retry requested for event ${eventId} in Postgres`);
    // Placeholder implementation
  }
}
