/**
 * Advanced Pattern: Windowed Deduplication
 * 
 * This example demonstrates:
 *  - Deduplicating items within a sliding time window
 *  - Useful for event processing where duplicates are allowed after some time
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');

function windowedDedupe(windowMs) {
  const seen = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, ts] of seen.entries()) {
      if (now - ts > windowMs) seen.delete(key);
    }
  }, windowMs / 2);

  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      const now = Date.now();
      if (seen.has(chunk)) {
        callback();
      } else {
        seen.set(chunk, now);
        this.push(chunk);
        callback();
      }
    }
  });
}

// Example async generator: numbers with repeats
async function* numbers() {
  const arr = [1, 2, 3, 2, 4, 1, 5, 2, 3, 6, 1, 7];
  for (const n of arr) {
    await new Promise(r => setTimeout(r, 100));
    yield n;
  }
}

const pipeline = from(numbers()).pipe(windowedDedupe(300));

(async () => {
  console.log('Windowed deduplication pipeline started');
  for await (const value of pipeline) {
    console.log(`[unique-in-window] ${value}`);
  }
  console.log('Pipeline complete!');
})();