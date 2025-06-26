/**
 * Kafka-backed Buffered Window Example
 * Requires: npm install kafkajs
 * And a running Kafka broker at localhost:9092
 */
import { Kafka } from 'kafkajs';

const kafka = new Kafka({ clientId: 'buffered-window', brokers: ['localhost:9092'] });
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'buffered-window-group' });

async function produceEvents() {
  await producer.connect();
  for (let i = 1; i <= 20; i++) {
    await producer.send({
      topic: 'buffered-window',
      messages: [{ value: JSON.stringify({ ts: Date.now(), value: i }) }],
    });
    await new Promise(r => setTimeout(r, 50));
  }
  await producer.disconnect();
}

async function consumeAndBuffer(windowMs: number, maxBuffer: number) {
  await consumer.connect();
  await consumer.subscribe({ topic: 'buffered-window', fromBeginning: true });
  let buffer: any[] = [];
  let timer: NodeJS.Timeout | null = null;

  function flush() {
    if (buffer.length) {
      console.log('[kafka-buffered-window] Batch:', buffer.map(e => e.value).join(', '));
      buffer = [];
    }
  }

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (message.value) {
        buffer.push(JSON.parse(message.value.toString()));
        if (buffer.length >= maxBuffer) {
          flush();
          if (timer) clearTimeout(timer);
        } else {
          if (timer) clearTimeout(timer);
          timer = setTimeout(flush, windowMs);
        }
      }
    }
  });
}

(async () => {
  produceEvents();
  consumeAndBuffer(500, 5);
})();