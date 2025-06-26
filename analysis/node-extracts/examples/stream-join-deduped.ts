import { Readable, Transform, PassThrough } from 'stream';

// 1. Combine Patterns: Stream Join + Deduplication
// This example combines stream-to-stream join with deduplication using an in-memory Set.

// Event type
interface EventData {
  type: 'A' | 'B';
  ts: number;
  value: number;
}

// Simulate two event streams
function eventStreamA() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 7) return this.push(null);
      setTimeout(() => this.push({ type: 'A', ts: Date.now(), value: i++ }), 80);
    }
  });
}
function eventStreamB() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 7) return this.push(null);
      setTimeout(() => this.push({ type: 'B', ts: Date.now(), value: i++ }), 120);
    }
  });
}

// Join logic (same as before)
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

// Deduplication transform for joined pairs
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

// Merge utility
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

// Pipeline
const merged = mergeStreams([eventStreamA(), eventStreamB()]);
const joined = merged.pipe(windowJoinWithLate(200, 100)).pipe(dedupePairs());

(async () => {
  console.log('Stream join with deduplication pipeline started');
  for await (const pair of joined) {
    console.log(`[deduped-join] A:${pair.a.value} <-> B:${pair.b.value}`);
  }
  console.log('Pipeline complete!');
})();