import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Message } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('KafkaProducerService');
  private kafka: Kafka;
  private producer: Producer;

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get('KAFKA_BROKER', 'localhost:9092').split(',');
    const clientId = this.configService.get('SERVICE_NAME', 'flashmart-service');

    this.kafka = new Kafka({
      clientId,
      brokers,
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting Kafka producer:', error);
    }
  }

  async emit(topic: string, message: any, key?: string): Promise<void> {
    try {
      const kafkaMessage: Message = {
        key: key || message.id || Date.now().toString(),
        value: JSON.stringify(message),
        headers: {
          'content-type': 'application/json',
          'timestamp': Date.now().toString(),
          'service': this.configService.get('SERVICE_NAME', 'unknown'),
        },
      };

      await this.producer.send({
        topic,
        messages: [kafkaMessage],
      });

      this.logger.debug(`Message sent to topic ${topic}`, {
        key: kafkaMessage.key,
        messageId: message.id,
      });
    } catch (error) {
      this.logger.error(`Failed to send message to topic ${topic}:`, error);
      throw error;
    }
  }

  async emitBatch(topic: string, messages: any[]): Promise<void> {
    try {
      const kafkaMessages: Message[] = messages.map(message => ({
        key: message.id || Date.now().toString(),
        value: JSON.stringify(message),
        headers: {
          'content-type': 'application/json',
          'timestamp': Date.now().toString(),
          'service': this.configService.get('SERVICE_NAME', 'unknown'),
        },
      }));

      await this.producer.send({
        topic,
        messages: kafkaMessages,
      });

      this.logger.debug(`Batch of ${messages.length} messages sent to topic ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to send batch to topic ${topic}:`, error);
      throw error;
    }
  }

  // Transactional send (for critical events)
  async emitTransactional(topic: string, message: any, key?: string): Promise<void> {
    const transaction = await this.producer.transaction();

    try {
      const kafkaMessage: Message = {
        key: key || message.id || Date.now().toString(),
        value: JSON.stringify(message),
        headers: {
          'content-type': 'application/json',
          'timestamp': Date.now().toString(),
          'service': this.configService.get('SERVICE_NAME', 'unknown'),
          'transactional': 'true',
        },
      };

      await transaction.send({
        topic,
        messages: [kafkaMessage],
      });

      await transaction.commit();
      this.logger.debug(`Transactional message sent to topic ${topic}`, {
        key: kafkaMessage.key,
        messageId: message.id,
      });
    } catch (error) {
      await transaction.abort();
      this.logger.error(`Failed transactional send to topic ${topic}:`, error);
      throw error;
    }
  }
}
