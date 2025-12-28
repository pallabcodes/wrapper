import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaEventBus } from './kafka/kafka-event-bus';
import { KafkaProducerService } from './kafka/kafka-producer.service';
import { KafkaConsumerService } from './kafka/kafka-consumer.service';
import { EventPublisher } from './event-bus';

@Global()
@Module({
  providers: [
    {
      provide: 'EVENT_BUS',
      useClass: KafkaEventBus,
    },
    {
      provide: EventPublisher,
      useFactory: (eventBus: KafkaEventBus) => new EventPublisher(eventBus),
      inject: ['EVENT_BUS'],
    },
    KafkaProducerService,
    KafkaConsumerService,
    KafkaEventBus,
  ],
  exports: [
    EventPublisher,
    KafkaEventBus,
    'EVENT_BUS',
  ],
})
export class EventsModule {}
