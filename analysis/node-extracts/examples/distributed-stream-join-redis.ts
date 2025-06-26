/**
 * Distributed Stream Join with Redis Coordination
 * 
 * This example demonstrates how to use Redis as a distributed buffer and coordinator
 * for joining two event streams (A and B) across processes or nodes.
 * 
 * Prerequisites:
 *   npm install redis
 *   (Redis server running locally or update the URI)
 */

import { Readable, Transform } from 'stream';
import { createClient } from 'redis';

interface EventData {
  type: 'A' | 'B';
  ts: number;
  value: number;
}

const redisAKey = 'stream:join:A';
const redisBKey = 'stream:join:B';

const client = createClient();
client.on('error', err => console.error('[Redis] Error:', err));

function eventStream(type: 'A' | 'B', start: number, end: number, delay: number) {
  let i = start;
  return new Readable({
    objectMode: true,
    read() {
      if (i > end) return this.push(null);
      setTimeout(() => this.push({ type, ts: Date.now(), value: i++ }), delay);
    }
  });
}

// Write events to Redis as a distributed buffer
function redisBufferWriter(type: 'A' | 'B') {
  const key = type === 'A' ? redisAKey : redisBKey;
  return new Transform({
    objectMode: true,
    async transform(chunk: EventData, _enc, cb) {
      try {
        await client.rPush(key, JSON.stringify(chunk));
        cb();
      } catch (err) {
        cb(err as Error);
      }
    }
  });
}

// Read events from Redis and join with the other stream's buffer
function redisJoiner(myType: 'A' | 'B', windowMs: number) {
  const myKey = myType === 'A' ? redisAKey : redisBKey;
  const otherKey = myType === 'A' ? redisBKey : redisAKey;

  return new Transform({
    objectMode: true,
    async transform(chunk: EventData, _enc, cb) {
      try {
        // Write my event to Redis
        await client.rPush(myKey, JSON.stringify(chunk));

        // Read all events from the other stream's buffer
        const others = await client.lRange(otherKey, 0, -1);
        const myEvent = chunk;

        for (const otherStr of others) {
          const other = JSON.parse(otherStr) as EventData;
          // Join if within window
          if (Math.abs(myEvent.ts - other.ts) <= windowMs) {
            this.push({ a: myType === 'A' ? myEvent : other, b: myType === 'B' ? myEvent : other });
          }
        }
        cb();
      } catch (err) {
        cb(err as Error);
      }
    }
  });
}

(async () => {
  await client.connect();

  // Clear previous buffers
  await client.del([redisAKey, redisBKey]);

  // Simulate two distributed sources
  const streamA = eventStream('A', 1, 5, 100).pipe(redisJoiner('A', 200));
  const streamB = eventStream('B', 1, 5, 120).pipe(redisJoiner('B', 200));

  // Merge the joined outputs
  async function consume(label: string, stream: Readable) {
    for await (const pair of stream) {
      console.log(`[${label}] A:${pair.a.value} <-> B:${pair.b.value}`);
    }
  }

  await Promise.all([
    consume('A-join', streamA),
    consume('B-join', streamB)
  ]);

  await client.quit();
  console.log('Distributed Redis join pipeline complete!');
})();