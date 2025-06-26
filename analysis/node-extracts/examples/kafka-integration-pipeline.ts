import { Kafka } from 'kafkajs';
import { Readable } from 'stream';

const kafka = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'example-group' });

async function produceEvents() {
  let i = 1;
  while (i <= 10) {
    await producer.send({
      topic: 'events',
      messages: [{ value: JSON.stringify({ value: i++ }) }]
    });
  }
}

async function consumeEvents() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'events', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      console.log('[kafka-consume]', message.value?.toString());
    }
  });
}

(async () => {
  await producer.connect();
  await produceEvents();
  await consumeEvents();
})();