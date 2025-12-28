import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
    constructor(
        @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    ) { }

    async onModuleInit() {
        await this.kafkaClient.connect();
    }

    async emit(topic: string, message: any) {
        return this.kafkaClient.emit(topic, {
            key: message.id || Date.now().toString(),
            value: JSON.stringify(message),
            headers: {
                timestamp: Date.now().toString(),
            },
        });
    }
}
