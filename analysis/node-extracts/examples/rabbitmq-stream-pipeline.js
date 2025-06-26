/**
 * Real-World Stream Integration: RabbitMQ
 * 
 * This example demonstrates:
 *  - Producing messages to RabbitMQ from a stream
 *  - Consuming messages from RabbitMQ as a stream
 * 
 * Prerequisites:
 *   npm install amqplib
 *   (RabbitMQ server running locally or update the URI)
 */

const amqp = require('amqplib');

const RABBIT_URI = 'amqp://localhost';
const QUEUE = 'stream-demo-queue';

// Producer: stream numbers to RabbitMQ
async function produce() {
  const conn = await amqp.connect(RABBIT_URI);
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE);

  for (let i = 1; i <= 10; i++) {
    const msg = `message-${i}`;
    ch.sendToQueue(QUEUE, Buffer.from(msg));
    console.log(`[RabbitMQ Producer] Sent: ${msg}`);
    await new Promise(r => setTimeout(r, 100));
  }
  await ch.close();
  await conn.close();
}

// Consumer: stream messages from RabbitMQ
async function consume() {
  const conn = await amqp.connect(RABBIT_URI);
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE);

  ch.consume(QUEUE, msg => {
    if (msg !== null) {
      console.log(`[RabbitMQ Consumer] Received: ${msg.content.toString()}`);
      ch.ack(msg);
    }
  });
}

// Run both producer and consumer
(async () => {
  produce();
  consume();
})();