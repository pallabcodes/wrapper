import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService implements OnModuleInit {
    constructor(
        @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    ) { }

    async onModuleInit() {
        this.kafkaClient.subscribeToResponseOf('raw-events');
        await this.kafkaClient.connect();
    }

    async handleEvent(event: CreateEventDto) {
        // 1. Validate (Implicit via DTO/Pipes)
        // 2. Publish to Kafka
        this.kafkaClient.emit('raw-events', {
            key: event.source_id,
            value: event,
        });
        console.log('Event published to Kafka:', event.source_id);
    }
}
