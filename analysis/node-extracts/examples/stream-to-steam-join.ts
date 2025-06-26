/**
 * Advanced Pattern: Stream-to-Stream Join with Late Data and Watermarking
 *
 * This example demonstrates:
 *  - Joining two streams on a time window
 *  - Buffering late data and emitting when watermark passes
 */

import { Readable, Transform, PassThrough } from 'stream';

// Define the event type
interface EventData {
  type: 'A' | 'B';
  ts: number;
  value: number;
}

function eventStreamA() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 5) return this.push(null);
      setTimeout(() => this.push({ type: 'A', ts: Date.now(), value: i++ }), 80);
    }
  });
}

function eventStreamB() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 5) return this.push(null);
      setTimeout(() => this.push({ type: 'B', ts: Date.now(), value: i++ }), 120);
    }
  });
}

function windowJoinWithLate(windowMs: number, watermarkMs: number) {
  const bufferA: EventData[] = [];
  const bufferB: EventData[] = [];
  let timer: NodeJS.Timeout | null = null;

  function emitPairs(self: Transform, watermark: number) {
    bufferA.forEach(a => {
      bufferB.forEach(b => {
        if (a.ts <= watermark && b.ts <= watermark) {
          self.push({ a, b });
        }
      });
    });
    // Remove old events
    while (bufferA.length && bufferA[0].ts <= watermark) bufferA.shift();
    while (bufferB.length && bufferB[0].ts <= watermark) bufferB.shift();
  }

  return new Transform({
    objectMode: true,
    transform(chunk: EventData, encoding, callback) {
      if (chunk.type === 'A') bufferA.push(chunk);
      if (chunk.type === 'B') bufferB.push(chunk);

      if (!timer) {
        timer = setInterval(() => {
          const watermark = Date.now() - watermarkMs;
          emitPairs(this, watermark);
        }, windowMs);
      }
      callback();
    },
    flush(callback) {
      if (timer) clearInterval(timer);
      emitPairs(this, Date.now());
      callback();
    }
  });
}

function mergeStreams(streams) {
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

const merged = mergeStreams([eventStreamA(), eventStreamB()]);
const joined = merged.pipe(windowJoinWithLate(200, 100));

(async () => {
  console.log('Stream join with late data and watermark pipeline started');
  for await (const pair of joined) {
    console.log(`[window-join-late] A:${pair.a.value} <-> B:${pair.b.value}`);
  }
  console.log('Pipeline complete!');
})();