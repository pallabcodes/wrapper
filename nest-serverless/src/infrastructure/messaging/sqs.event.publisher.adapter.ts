/**
 * Adapter: SQS Event Publisher Implementation
 * 
 * Implements the Port (interface) defined in Domain layer
 * Handles event publishing using AWS SQS
 * 
 * This is the "Adapter" in Hexagonal Architecture
 * 
 * Note: For demo, using console.log. In production, use AWS SDK SQS client
 */
import { Injectable } from '@nestjs/common';
import { EventPublisherPort } from '@domain/ports/event.publisher.port';
import * as AWS from 'aws-sdk';

@Injectable()
export class SQSEventPublisherAdapter implements EventPublisherPort {
  private sqs: AWS.SQS;
  private queueUrl: string;

  constructor() {
    // Initialize SQS client
    // In production: this.sqs = new AWS.SQS({ region: process.env.AWS_REGION });
    // For demo, using mock
    this.queueUrl = process.env.USER_REGISTERED_QUEUE_URL || 'mock-queue-url';
  }

  async publish(event: string, data: unknown): Promise<void> {
    // In production:
    // await this.sqs.sendMessage({
    //   QueueUrl: this.queueUrl,
    //   MessageBody: JSON.stringify({ event, data }),
    // }).promise();

    // For demo, log the event
    console.log(`[SQS Event Publisher] Publishing event: ${event}`, JSON.stringify(data, null, 2));
  }

  async publishBatch(events: Array<{ event: string; data: unknown }>): Promise<void> {
    // In production:
    // await this.sqs.sendMessageBatch({
    //   QueueUrl: this.queueUrl,
    //   Entries: events.map((e, i) => ({
    //     Id: `event-${i}`,
    //     MessageBody: JSON.stringify({ event: e.event, data: e.data }),
    //   })),
    // }).promise();

    // For demo, log the events
    console.log(`[SQS Event Publisher] Publishing batch of ${events.length} events`);
    for (const { event, data } of events) {
      console.log(`  - Event: ${event}`, JSON.stringify(data, null, 2));
    }
  }
}

