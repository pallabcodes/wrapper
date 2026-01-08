
import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { IEventBus, DomainEvent } from '@streamverse/common';

@Injectable()
export class KafkaEventBusAdapter implements IEventBus, OnModuleInit, OnModuleDestroy {
    constructor(
        @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka
    ) { }

    async onModuleInit() {
        await this.kafkaClient.connect();
    }

    async onModuleDestroy() {
        await this.kafkaClient.close();
    }

    async publish(event: DomainEvent): Promise<void> {
        const pattern = event.getEventName();
        const payload = event.toJSON();

        // NestJS ClientKafka emits event (void response)
        this.kafkaClient.emit(pattern, payload);
    }

    async publishAll(events: ReadonlyArray<DomainEvent>): Promise<void> {
        await Promise.all(events.map(event => this.publish(event)));
    }
}
