/**
 * Advanced Pattern: Custom Stream Window Eviction Policy
 * 
 * This example demonstrates:
 *  - Evicting items from a window based on custom logic (max size or age)
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');

function windowWithEviction(maxSize, maxAgeMs) {
  let window = [];
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      const now = Date.now();
      window.push({ ts: now, value: chunk });
      // Evict by size
      while (window.length > maxSize) window.shift();
      // Evict by age
      window = window.filter(item => now - item.ts <= maxAgeMs);
      this.push(window.map(item => item.value));
      callback();
    }
  });
}

// Example async generator: numbers 1-10
async function* numbers() {
  for (let i = 1; i <= 10; i++) {
    await new Promise(r => setTimeout(r, 50));
    yield i;
  }
}

const pipeline = from(numbers()).pipe(windowWithEviction(4, 200));

(async () => {
  console.log('Custom window eviction pipeline started');
  for await (const win of pipeline) {
    console.log(`[window] ${win.join(', ')}`);
  }
  console.log('Pipeline complete!');
})();