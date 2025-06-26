/**
 * Buffered Window Pipeline Example
 * 
 * Demonstrates:
 *  - Buffering events in memory
 *  - Emitting results based on time window or buffer size
 *  - Buffer eviction strategies
 */

import { Readable, Transform } from 'stream';

interface EventData {
  ts: number;
  value: number;
}

// Simulated event stream
function eventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 20) return this.push(null);
      setTimeout(() => this.push({ ts: Date.now(), value: i++ }), 50);
    }
  });
}

// Buffered window transform
function bufferedWindow(windowMs: number, maxBuffer: number) {
  let buffer: EventData[] = [];
  let timer: NodeJS.Timeout | null = null;

  function flush(self: Transform) {
    if (buffer.length > 0) {
      self.push([...buffer]);
      buffer = [];
    }
  }

  return new Transform({
    objectMode: true,
    transform(chunk: EventData, _enc, cb) {
      buffer.push(chunk);

      // Emit if buffer size reached
      if (buffer.length >= maxBuffer) {
        flush(this);
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        return cb();
      }

      // Start/reset timer for time window
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        flush(this);
        timer = null;
      }, windowMs);

      cb();
    },
    flush(cb) {
      flush(this);
      if (timer) clearTimeout(timer);
      cb();
    }
  });
}

// Usage
const src = eventStream();
const windowed = src.pipe(bufferedWindow(500, 5));

(async () => {
  console.log('Buffered window pipeline started');
  for await (const batch of windowed) {
    const values = (batch as EventData[]).map(e => e.value);
    console.log(`[buffered-window] Batch: ${values.join(', ')}`);
  }
  console.log('Pipeline complete!');
})();