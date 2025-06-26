/**
 * Real-World Stream Integration: Kafka
 * 
 * This example demonstrates:
 *  - Producing messages to Kafka from a stream
 *  - Consuming messages from Kafka as a stream
 * 
 * Prerequisites:
 *   npm install kafkajs
 *   (Kafka broker running locally or update the broker list)
 */

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'stream-demo',
  brokers: ['localhost:9092']
});

const topic = 'stream-demo-topic';

// Producer: stream numbers to Kafka
async function produce() {
  const producer = kafka.producer();
  await producer.connect();
  for (let i = 1; i <= 10; i++) {
    await producer.send({
      topic,
      messages: [{ value: `message-${i}` }]
    });
    console.log(`[Kafka Producer] Sent: message-${i}`);
    await new Promise(r => setTimeout(r, 100));
  }
  await producer.disconnect();
}

// Consumer: stream messages from Kafka
async function consume() {
  const consumer = kafka.consumer({ groupId: 'stream-demo-group' });
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      console.log(`[Kafka Consumer] Received: ${message.value.toString()}`);
    }
  });
}

// Run both producer and consumer
(async () => {
  produce();
  consume();
})();