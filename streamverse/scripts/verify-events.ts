
import { Kafka } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

async function main() {
    const kafka = new Kafka({
        clientId: 'verify-events-script',
        brokers: ['localhost:9092'],
    });

    const producer = kafka.producer();

    await producer.connect();
    console.log('🚀 Connected to Kafka');

    const paymentEvent = {
        eventId: uuidv4(),
        eventName: 'payment.completed',
        occurredAt: new Date().toISOString(),
        payload: {
            userId: 'user-123',
            amount: 1000,
            currency: 'USD',
            externalId: 'pi_fake_123'
        }
    };

    const userEvent = {
        eventId: uuidv4(),
        eventName: 'user.registered',
        occurredAt: new Date().toISOString(),
        payload: {
            email: 'test@example.com',
            username: 'testuser'
        }
    };

    console.log('📤 Sending payment.completed event...');
    await producer.send({
        topic: 'payment.completed',
        messages: [{ value: JSON.stringify(paymentEvent) }],
    });

    console.log('📤 Sending user.registered event...');
    await producer.send({
        topic: 'user.registered',
        messages: [{ value: JSON.stringify(userEvent) }],
    });

    console.log('✅ Events sent! Check notification-service logs.');
    await producer.disconnect();
}

main().catch(console.error);
