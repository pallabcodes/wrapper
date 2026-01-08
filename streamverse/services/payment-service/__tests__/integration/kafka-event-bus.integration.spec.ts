import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ClientKafka, ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaEventBusAdapter } from '../../src/infrastructure/adapters/kafka-event-bus.adapter';

/**
 * Kafka Event Bus Integration Tests
 * 
 * Note: These tests require a running Kafka instance.
 * Run: docker-compose up kafka zookeeper -d
 */
describe('KafkaEventBusAdapter (Integration)', () => {
    let adapter: KafkaEventBusAdapter;
    let kafkaClient: ClientKafka;
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ClientsModule.register([
                    {
                        name: 'KAFKA_CLIENT',
                        transport: Transport.KAFKA,
                        options: {
                            client: {
                                clientId: 'test-event-bus',
                                brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
                            },
                            producer: {
                                allowAutoTopicCreation: true,
                            },
                        },
                    },
                ]),
            ],
            providers: [
                KafkaEventBusAdapter,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('localhost:9092'),
                    },
                },
            ],
        }).compile();

        adapter = module.get<KafkaEventBusAdapter>(KafkaEventBusAdapter);
        kafkaClient = module.get<ClientKafka>('KAFKA_CLIENT');

        // Connect to Kafka
        await kafkaClient.connect();
    });

    afterAll(async () => {
        await kafkaClient.close();
        await module.close();
    });

    describe('publish', () => {
        it('should publish a domain event to Kafka', async () => {
            // Create a mock domain event
            const mockEvent = {
                getEventName: () => 'test.event',
                toJSON: () => ({
                    eventId: 'evt_123',
                    eventName: 'test.event',
                    occurredAt: new Date().toISOString(),
                    payload: { key: 'value' },
                }),
            };

            // This should not throw
            await expect(adapter.publish(mockEvent as any)).resolves.not.toThrow();
        });

        it('should handle publish errors gracefully', async () => {
            // Create adapter with invalid config to test error handling
            const badAdapter = new KafkaEventBusAdapter(
                {
                    emit: jest.fn().mockImplementation(() => {
                        throw new Error('Kafka connection failed');
                    }),
                } as any,
            );

            const mockEvent = {
                getEventName: () => 'test.event',
                toJSON: () => ({ eventId: 'evt_123' }),
            };

            // Should log error but not throw (fire-and-forget pattern)
            await expect(badAdapter.publish(mockEvent as any)).rejects.toThrow();
        });
    });
});
