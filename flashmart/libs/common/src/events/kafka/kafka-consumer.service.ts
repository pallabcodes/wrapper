import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('KafkaConsumerService');
  private kafka: Kafka;
  private consumer: Consumer;
  private subscriptions = new Map<string, (message: EachMessagePayload) => Promise<void>>();

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get('KAFKA_BROKER', 'localhost:9092').split(',');
    const clientId = this.configService.get('SERVICE_NAME', 'flashmart-service');
    const groupId = `${clientId}-group`;

    this.kafka = new Kafka({
      clientId,
      brokers,
    });

    this.consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      rebalanceTimeout: 60000,
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      this.logger.log('Kafka consumer connected');

      // Subscribe to all topics with flashmart prefix
      await this.consumer.subscribe({
        topics: ['flashmart.*'],
        fromBeginning: false, // Only new messages
      });

      // Start consuming
      await this.consumer.run({
        eachMessage: async (payload) => {
          const { topic, message } = payload;

          try {
            // Find handler for this topic
            const handler = this.subscriptions.get(topic);
            if (handler) {
              await handler(payload);
            } else {
              this.logger.warn(`No handler found for topic: ${topic}`);
            }
          } catch (error) {
            this.logger.error(`Error processing message from topic ${topic}:`, error);
            // In production, implement dead letter queue logic here
          }
        },
      });
    } catch (error) {
      this.logger.error('Failed to connect Kafka consumer:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.consumer.disconnect();
      this.logger.log('Kafka consumer disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting Kafka consumer:', error);
    }
  }

  subscribe(topic: string, handler: (message: EachMessagePayload) => Promise<void>): void {
    this.subscriptions.set(topic, handler);
    this.logger.log(`Subscribed to topic: ${topic}`);
  }

  unsubscribe(topic: string): void {
    this.subscriptions.delete(topic);
    this.logger.log(`Unsubscribed from topic: ${topic}`);
  }

  // Seek to specific offset (for replay/debugging)
  async seek(topic: string, partition: number, offset: string): Promise<void> {
    await this.consumer.seek({
      topic,
      partition,
      offset,
    });
    this.logger.log(`Seeked to offset ${offset} for topic ${topic}, partition ${partition}`);
  }

  // Get consumer group offsets
  async getOffsets(topic: string): Promise<any> {
    return await this.consumer.committed([
      { topic, partitions: [0] } // Assuming single partition
    ]);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const heartbeat = await this.consumer.describeGroup();
      return heartbeat.state === 'Stable';
    } catch (error) {
      this.logger.error('Consumer health check failed:', error);
      return false;
    }
  }

  // Pause/Resume consumption (for maintenance)
  async pause(topics: string[]): Promise<void> {
    await this.consumer.pause(topics.map(topic => ({ topic })));
    this.logger.log(`Paused consumption for topics: ${topics.join(', ')}`);
  }

  async resume(topics: string[]): Promise<void> {
    await this.consumer.resume(topics.map(topic => ({ topic })));
    this.logger.log(`Resumed consumption for topics: ${topics.join(', ')}`);
  }
}
