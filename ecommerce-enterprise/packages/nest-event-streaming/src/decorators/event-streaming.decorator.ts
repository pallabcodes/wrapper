import { SetMetadata } from '@nestjs/common';

export const EVENT_STREAMING_METADATA = 'event_streaming_metadata';

export interface EventStreamingMetadata {
  topic: string;
  eventType: string;
  retry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  deadLetterQueue?: string;
}

export const EventHandler = (metadata: EventStreamingMetadata) =>
  SetMetadata(EVENT_STREAMING_METADATA, metadata);

export const EventPublisher = (topic: string, eventType: string) =>
  SetMetadata(EVENT_STREAMING_METADATA, { topic, eventType });

export const EventSubscriber = (topic: string, eventType: string, options?: Partial<EventStreamingMetadata>) =>
  SetMetadata(EVENT_STREAMING_METADATA, { topic, eventType, ...options });
