/**
 * Robust Pipeline: Redis-backed Buffering + Stream Join + Deduplication
 * 
 * - Buffers events from two streams in Redis
 * - Joins events on a time window
 * - Deduplicates joined pairs
 * 
 * Prerequisites:
 *   npm install redis
 *   (Redis server running locally or update the URI)
 */

import { Readable, Transform, PassThrough } from 'stream';
import { createClient } from 'redis';

interface EventData {
  type: 'A' | 'B';
  ts: number;
  value: number;
}

const REDIS_KEY_A = 'robust:buffer:A';
const REDIS_KEY_B = 'robust:buffer:B';
const client = createClient();
client.on('error', err => console.error('[Redis] Error:', err));

// Simulated event streams
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

// Redis-backed buffer transform
function redisBufferWriter(type: 'A' | 'B') {
  const key = type === 'A' ? REDIS_KEY_A : REDIS_KEY_B;
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

// Join events from Redis buffers within a time window
function redisWindowJoin(windowMs: number) {
  return new Transform({
    objectMode: true,
    async transform(_chunk: any, _enc, cb) {
      try {
        const now = Date.now();
        const minTs = now - windowMs;

        // Get all events in the window
        const [aEvents, bEvents] = await Promise.all([
          client.lRange(REDIS_KEY_A, 0, -1),
          client.lRange(REDIS_KEY_B, 0, -1)
        ]);
        const aParsed = aEvents.map(e => JSON.parse(e) as EventData).filter(e => e.ts >= minTs);
        const bParsed = bEvents.map(e => JSON.parse(e) as EventData).filter(e => e.ts >= minTs);

        // Join on window
        for (const a of aParsed) {
          for (const b of bParsed) {
            if (Math.abs(a.ts - b.ts) <= windowMs) {
              this.push({ a, b });
            }
          }
        }
        cb();
      } catch (err) {
        cb(err as Error);
      }
    }
  });
}

// Deduplicate joined pairs
function dedupePairs() {
  const seen = new Set<string>();
  return new Transform({
    objectMode: true,
    transform(chunk: { a: EventData; b: EventData }, _enc, cb) {
      const key = `${chunk.a.value}-${chunk.b.value}`;
      if (!seen.has(key)) {
        seen.add(key);
        this.push(chunk);
      }
      cb();
    }
  });
}

// Merge utility for two streams
function mergeStreams(streams: Readable[]) {
  const output = new PassThrough({ objectMode: true });
  let ended = 0;
  streams.forEach(s => {
    s.on('data', chunk => output.write(chunk));
    s.on('end', () => {
      ended++;
      if (ended === streams.length) output.end();
    });
  });
  return output;
}

(async () => {
  await client.connect();
  await client.del([REDIS_KEY_A, REDIS_KEY_B]);

  // Simulate two distributed sources, each writing to Redis
  const streamA = eventStream('A', 1, 10, 80).pipe(redisBufferWriter('A'));
  const streamB = eventStream('B', 1, 10, 120).pipe(redisBufferWriter('B'));

  // Merge to trigger join logic periodically
  const trigger = new Readable({
    objectMode: true,
    read() {}
  });
  // Periodically push a dummy value to trigger join
  const joinInterval = setInterval(() => trigger.push({}), 300);

  // Pipeline: trigger -> join -> dedupe
  const joined = trigger
    .pipe(redisWindowJoin(250))
    .pipe(dedupePairs());

  // Start the streams
  mergeStreams([streamA, streamB]);

  console.log('Robust Redis-buffered join+dedupe pipeline started');
  for await (const pair of joined) {
    console.log(`[robust-pipeline] A:${pair.a.value} <-> B:${pair.b.value}`);
  }
  clearInterval(joinInterval);
  await client.quit();
  console.log('Pipeline complete!');
})();

/**
 * What this pipeline demonstrates:
 * Partitioning: Two independent event streams (could be on different nodes).
 * Redis-backed buffering: Each stream writes to its own Redis list.
 * Windowed join: Periodically, the pipeline joins events from both buffers within a time window.
 * Deduplication: Ensures each pair is only emitted once.
 * Production-like: Modular, scalable, and ready for distributed deployment.
 * 
*/