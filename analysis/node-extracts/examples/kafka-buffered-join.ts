/**
 * Kafka-backed Buffering and Stream Join Example
 * 
 * Prerequisites:
 *   npm install kafkajs
 *   (Kafka broker running locally or update the brokers array)
 */

import { Kafka, logLevel } from 'kafkajs';

interface EventData {
  type: 'A' | 'B';
  ts: number;
  value: number;
  key: string;
}

const kafka = new Kafka({
  clientId: 'stream-join-example',
  brokers: ['localhost:9092'],
  logLevel: logLevel.ERROR,
});

const producer = kafka.producer();
const consumerA = kafka.consumer({ groupId: 'join-group-a' });
const consumerB = kafka.consumer({ groupId: 'join-group-b' });

const TOPIC_A = 'stream-a';
const TOPIC_B = 'stream-b';

async function produceEvents(type: 'A' | 'B', topic: string, count: number, delay: number) {
  for (let i = 1; i <= count; i++) {
    const event: EventData = {
      type,
      ts: Date.now(),
      value: i,
      key: `key${i % 3}`, // 3 keys for sharding
    };
    await producer.send({
      topic,
      messages: [{ key: event.key, value: JSON.stringify(event) }],
    });
    await new Promise(r => setTimeout(r, delay));
  }
}

async function joiner(windowMs: number) {
  // In-memory buffer for demonstration (use Redis or RocksDB for scale)
  const bufferA: Record<string, EventData[]> = {};
  const bufferB: Record<string, EventData[]> = {};

  await consumerA.connect();
  await consumerB.connect();
  await consumerA.subscribe({ topic: TOPIC_A, fromBeginning: true });
  await consumerB.subscribe({ topic: TOPIC_B, fromBeginning: true });

  consumerA.run({
    eachMessage: async ({ message }) => {
      if (!message.value || !message.key) return;
      const event = JSON.parse(message.value.toString()) as EventData;
      bufferA[event.key] = (bufferA[event.key] || []).concat(event);
    },
  });

  consumerB.run({
    eachMessage: async ({ message }) => {
      if (!message.value || !message.key) return;
      const event = JSON.parse(message.value.toString()) as EventData;
      bufferB[event.key] = (bufferB[event.key] || []).concat(event);
    },
  });

  // Periodically join
  setInterval(() => {
    const now = Date.now();
    for (const key of Object.keys(bufferA)) {
      const aEvents = bufferA[key] || [];
      const bEvents = bufferB[key] || [];
      for (const a of aEvents) {
        for (const b of bEvents) {
          if (Math.abs(a.ts - b.ts) <= windowMs) {
            console.log(`[kafka-join] key=${key} A:${a.value} <-> B:${b.value}`);
          }
        }
      }
      // Evict old events
      bufferA[key] = aEvents.filter(e => now - e.ts < windowMs);
      bufferB[key] = bEvents.filter(e => now - e.ts < windowMs);
    }
  }, 500);
}

(async () => {
  await producer.connect();
  // Start producing in background
  produceEvents('A', TOPIC_A, 10, 100);
  produceEvents('B', TOPIC_B, 10, 150);

  // Start joiner
  await joiner(500);
})();