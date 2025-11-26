/**
 * Base class for all domain events
 * Domain events represent something that happened in the domain
 */
export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly eventVersion: number = 1;

  constructor(aggregateId: string) {
    this.eventId = crypto.randomUUID();
    this.eventType = this.constructor.name;
    this.aggregateId = aggregateId;
    this.occurredOn = new Date();
  }
}