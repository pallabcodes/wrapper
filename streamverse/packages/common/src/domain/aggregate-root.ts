
import { DomainEvent } from './domain-event';

/**
 * Base class for all aggregate roots.
 * 
 * Aggregates are clusters of domain objects that can be treated as a single unit.
 * The aggregate root is the only member of the aggregate that outside objects
 * are allowed to hold references to.
 */
export abstract class AggregateRoot<T = any> {
    private _domainEvents: DomainEvent[] = [];
    protected _version: number = 0;

    constructor(protected readonly _id: string) { }

    /**
     * Get the unique identifier of this aggregate
     */
    getId(): string {
        return this._id;
    }

    /**
     * Get the version for optimistic locking
     */
    getVersion(): number {
        return this._version;
    }

    /**
     * Increment version (called after successful persistence)
     */
    incrementVersion(): void {
        this._version++;
    }

    /**
     * Add a domain event to be published
     * @param event The domain event to add
     */
    protected addDomainEvent(event: DomainEvent): void {
        this._domainEvents.push(event);
    }

    /**
     * Get all domain events that have been raised
     */
    getDomainEvents(): ReadonlyArray<DomainEvent> {
        return [...this._domainEvents];
    }

    /**
     * Clear all domain events (call after publishing)
     */
    clearDomainEvents(): void {
        this._domainEvents = [];
    }

    /**
     * Check if this aggregate has uncommitted events
     */
    hasDomainEvents(): boolean {
        return this._domainEvents.length > 0;
    }

    /**
     * Abstract method for equality comparison
     */
    abstract equals(other: AggregateRoot<T>): boolean;
}
