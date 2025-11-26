import { DomainEvent } from './events/domain-event';

/**
 * Aggregate Root base class
 * Manages domain events and provides transaction boundaries
 */
export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  /**
   * Get the aggregate's unique identifier
   */
  abstract get id(): string;

  /**
   * Get all uncommitted domain events
   */
  get domainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  /**
   * Add a domain event to be published when aggregate is saved
   */
  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  /**
   * Clear all domain events after they've been published
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Check if aggregate has uncommitted events
   */
  hasUncommittedEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  /**
   * Mark aggregate as committed (clear events)
   */
  markAsCommitted(): void {
    this.clearDomainEvents();
  }
}