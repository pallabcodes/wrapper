/**
 * Advanced Pattern: Real-time Deduplication with Redis
 *
 * This example demonstrates:
 *  - Using Redis as an external cache to filter duplicates in real time
 *  - Useful for distributed deduplication across multiple processes
 *
 * Prerequisites:
 *   npm install redis
 *   (Redis server running locally or update the URI)
 */

import { from } from '../internal/streams/from';
import { Transform, TransformCallback } from 'stream';
import { createClient } from 'redis';

const client = createClient(); // Default: localhost:6379

client.on('error', err => console.error('[Redis] Error:', err));

// Deduplication transform using Redis
function redisDedupe(keyPrefix = 'dedupe:') {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback: TransformCallback) {
      const key = keyPrefix + chunk;
      client.exists(key)
        .then((exists: number) => {
          if (exists) {
            // Duplicate, skip
            return callback();
          }
          // Use options object for EX in redis v4+
          client.set(key, '1', { EX: 60 })
            .then(() => {
              this.push(chunk);
              callback();
            })
            .catch((err2: Error) => callback(err2));
        })
        .catch((err: Error) => callback(err));
    }
  });
}

// Example async generator: numbers with duplicates
async function* numbers() {
  const arr = [1, 2, 2, 3, 4, 4, 5, 1, 6, 7, 7, 8, 9, 10];
  for (const n of arr) {
    await new Promise(r => setTimeout(r, 30));
    yield n;
  }
}

(async () => {
  await client.connect();
  const pipeline = from(numbers()).pipe(redisDedupe());
  console.log('Redis deduplication pipeline started');
  for await (const value of pipeline) {
    console.log(`[unique-redis] ${value}`);
  }
  await client.quit();
  console.log('Pipeline complete!');
})();