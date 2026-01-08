
/**
 * Base class for all domain events
 */
export abstract class DomainEvent {
    public readonly occurredAt: Date;
    public readonly eventId: string;

    constructor(
        public readonly aggregateId: string,
        public readonly aggregateType: string
    ) {
        this.occurredAt = new Date();
        this.eventId = this.generateEventId();
    }

    /**
     * Get the event name (used for routing/topic)
     */
    abstract getEventName(): string;

    /**
     * Get the event version (for schema evolution)
     */
    getEventVersion(): number {
        return 1;
    }

    /**
     * Serialize event to JSON
     */
    toJSON(): any {
        return {
            eventId: this.eventId,
            eventName: this.getEventName(),
            eventVersion: this.getEventVersion(),
            aggregateId: this.aggregateId,
            aggregateType: this.aggregateType,
            occurredAt: this.occurredAt.toISOString(),
            payload: this.getPayload(),
        };
    }

    /**
     * Get event-specific payload
     */
    protected abstract getPayload(): any;

    private generateEventId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
