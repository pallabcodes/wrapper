/**
 * Port: Event Publisher
 * 
 * Interface for publishing domain events
 * Implementation will be in Infrastructure layer (Redis adapter)
 */
export const EVENT_PUBLISHER_PORT = Symbol('EVENT_PUBLISHER_PORT');

export interface EventPublisherPort {
  publish(event: string, data: unknown): Promise<void>;
}

