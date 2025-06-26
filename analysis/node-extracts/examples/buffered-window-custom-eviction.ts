import { Readable, Transform } from 'stream';

interface EventData {
  ts: number;
  value: number;
}

function eventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 20) return this.push(null);
      setTimeout(() => this.push({ ts: Date.now(), value: i++ }), 40);
    }
  });
}

// Custom eviction: evict oldest if buffer exceeds max, and evict items older than TTL
function customEvictionBuffer(maxBuffer: number, ttlMs: number) {
  let buffer: EventData[] = [];

  function evict() {
    const now = Date.now();
    // Remove items older than TTL
    buffer = buffer.filter(e => now - e.ts <= ttlMs);
    // Remove oldest if buffer exceeds max
    while (buffer.length > maxBuffer) buffer.shift();
  }

  return new Transform({
    objectMode: true,
    transform(chunk: EventData, _enc, cb) {
      buffer.push(chunk);
      evict();
      this.push([...buffer]);
      cb();
    },
    flush(cb) {
      buffer = [];
      cb();
    }
  });
}

// Usage
const src = eventStream();
const windowed = src.pipe(customEvictionBuffer(5, 200));

(async () => {
  console.log('Custom eviction buffered pipeline started');
  for await (const batch of windowed) {
    const values = (batch as EventData[]).map(e => e.value);
    console.log(`[custom-eviction-buffer] Batch: ${values.join(', ')}`);
  }
  console.log('Pipeline complete!');
})();