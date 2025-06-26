import { Readable, Transform, PassThrough } from 'stream';

// 2. Distributed Pattern: Distributed Stream Join (Simulated)
// This example simulates distributed stream processing by splitting streams and joining them, as a starting point for distributed logic.

interface EventData {
  type: 'A' | 'B';
  ts: number;
  value: number;
}

// Simulate partitioned event streams (could be on different nodes)
function partitionedEventStream(type: 'A' | 'B', start: number, end: number, delay: number) {
  let i = start;
  return new Readable({
    objectMode: true,
    read() {
      if (i > end) return this.push(null);
      setTimeout(() => this.push({ type, ts: Date.now(), value: i++ }), delay);
    }
  });
}

// Simple join logic (could be replaced with a distributed join coordinator)
function joinStreams() {
  const bufferA: EventData[] = [];
  const bufferB: EventData[] = [];
  return new Transform({
    objectMode: true,
    transform(chunk: EventData, _enc, cb) {
      if (chunk.type === 'A') {
        bufferA.push(chunk);
        bufferB.forEach(b => this.push({ a: chunk, b }));
      } else {
        bufferB.push(chunk);
        bufferA.forEach(a => this.push({ a, b: chunk }));
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

// Simulate distributed sources
const streamA1 = partitionedEventStream('A', 1, 3, 100);
const streamA2 = partitionedEventStream('A', 4, 6, 120);
const streamB1 = partitionedEventStream('B', 1, 3, 110);
const streamB2 = partitionedEventStream('B', 4, 6, 130);

const merged = mergeStreams([streamA1, streamA2, streamB1, streamB2]);
const joined = merged.pipe(joinStreams());

(async () => {
  console.log('Distributed stream join simulation started');
  for await (const pair of joined) {
    console.log(`[distributed-join] A:${pair.a.value} <-> B:${pair.b.value}`);
  }
  console.log('Pipeline complete!');
})();