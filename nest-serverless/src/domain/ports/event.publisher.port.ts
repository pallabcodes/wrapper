/**
 * Port: Event Publisher Interface
 * 
 * Defines the contract for publishing domain events
 * Domain layer defines this interface (Port)
 * Infrastructure layer implements it (Adapter - SQS, SNS, EventBridge)
 * 
 * This is the "Port" in Hexagonal Architecture
 */
export const EVENT_PUBLISHER_PORT = Symbol('EVENT_PUBLISHER_PORT');

export interface EventPublisherPort {
  publish(event: string, data: unknown): Promise<void>;
  publishBatch(events: Array<{ event: string; data: unknown }>): Promise<void>;
}

