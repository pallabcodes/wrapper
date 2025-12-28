import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'KAFKA_SERVICE',
                transport: Transport.KAFKA,
                options: {
                    client: {
                        brokers: ['localhost:9092'],
                    },
                    consumer: {
                        groupId: 'ingestor-producer-group',
                    },
                },
            },
        ]),
    ],
    controllers: [EventsController],
    providers: [EventsService],
})
export class EventsModule { }
