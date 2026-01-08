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

export const DEAD_LETTER_QUEUE = Symbol('IDeadLetterQueue');
