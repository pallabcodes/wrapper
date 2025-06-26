import { Readable, Transform } from 'stream';
import { createClient } from 'redis';

interface EventData {
  ts: number;
  value: number;
}

const REDIS_KEY = 'buffered:window:events';
const client = createClient();
client.on('error', err => console.error('[Redis] Error:', err));

function eventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 30) return this.push(null);
      setTimeout(() => this.push({ ts: Date.now(), value: i++ }), 30);
    }
  });
}

function redisBufferedWindow(windowMs: number, maxBuffer: number) {
  let timer: NodeJS.Timeout | null = null;

  async function flush(self: Transform) {
    const len = await client.lLen(REDIS_KEY);
    if (len > 0) {
      const batch = await client.lRange(REDIS_KEY, 0, maxBuffer - 1);
      await client.lTrim(REDIS_KEY, batch.length, -1);
      const parsed = batch.map(str => JSON.parse(str) as EventData);
      self.push(parsed);
    }
  }

  return new Transform({
    objectMode: true,
    async transform(chunk: EventData, _enc, cb) {
      await client.rPush(REDIS_KEY, JSON.stringify(chunk));

      const len = await client.lLen(REDIS_KEY);
      if (len >= maxBuffer) {
        await flush(this);
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        return cb();
      }

      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        await flush(this);
        timer = null;
      }, windowMs);

      cb();
    },
    async flush(cb) {
      await flush(this);
      if (timer) clearTimeout(timer);
      cb();
    }
  });
}

// Usage
(async () => {
  await client.connect();
  await client.del(REDIS_KEY);

  const src = eventStream();
  const windowed = src.pipe(redisBufferedWindow(500, 10));

  console.log('Redis-backed buffered window pipeline started');
  for await (const batch of windowed) {
    const values = (batch as EventData[]).map(e => e.value);
    console.log(`[redis-buffered-window] Batch: ${values.join(', ')}`);
  }
  await client.quit();
  console.log('Pipeline complete!');
})();