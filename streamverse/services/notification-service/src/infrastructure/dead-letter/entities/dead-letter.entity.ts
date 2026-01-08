import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Infrastructure Entity: Dead Letter Queue (Database Table)
 *
 * Stores messages that failed processing after all retries.
 * Allows for analysis and manual replay of failed (poison pill) messages.
 */
@Entity('dead_letter_queue')
export class DeadLetterEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('varchar', { name: 'original_event_id', nullable: true })
    originalEventId!: string;

    @Column('varchar', { name: 'event_type' })
    eventType!: string;

    @Column('varchar', { name: 'aggregate_id', nullable: true })
    aggregateId?: string;

    @Column('jsonb', { name: 'event_data' })
    eventData!: Record<string, unknown>;

    @Column('text', { name: 'failure_reason' })
    failureReason!: string;

    @Column('integer', { name: 'retry_count', default: 0 })
    retryCount!: number;

    @Column('text', { name: 'last_error', nullable: true })
    lastError?: string;

    @Column('varchar', { default: 'failed' })
    status!: 'failed' | 'processing' | 'resolved' | 'retried';

    @CreateDateColumn({ name: 'failed_at' })
    failedAt!: Date;
}
