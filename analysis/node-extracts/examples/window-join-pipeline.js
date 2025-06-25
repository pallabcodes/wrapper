/**
 * Advanced Pattern: Window Join (Time-Based)
 * 
 * This example demonstrates:
 *  - Joining two streams on a time window (e.g., event-time correlation)
 */

const { Readable, Transform, PassThrough } = require('stream');

// Simulate two event streams with timestamps
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

// Window join transform
function windowJoin(windowMs) {
  const bufferA = [];
  const bufferB = [];
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (chunk.type === 'A') bufferA.push(chunk);
      if (chunk.type === 'B') bufferB.push(chunk);

      // Remove old events
      const now = Date.now();
      while (bufferA.length && now - bufferA[0].ts > windowMs) bufferA.shift();
      while (bufferB.length && now - bufferB[0].ts > windowMs) bufferB.shift();

      // Join events in the window
      if (chunk.type === 'A') {
        bufferB.forEach(b => this.push({ a: chunk, b }));
      } else if (chunk.type === 'B') {
        bufferA.forEach(a => this.push({ a, b: chunk }));
      }
      callback();
    }
  });
}

// Merge two streams into one
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
const joined = merged.pipe(windowJoin(200));

(async () => {
  console.log('Window join pipeline started');
  for await (const pair of joined) {
    console.log(`[window-join] A:${pair.a.value} <-> B:${pair.b.value}`);
  }
  console.log('Pipeline complete!');
})();