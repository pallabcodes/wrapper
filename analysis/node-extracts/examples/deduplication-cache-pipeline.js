/**
 * Advanced Pattern: Deduplication with External Cache
 * 
 * This example demonstrates:
 *  - Using an in-memory Set as a cache to filter duplicates
 *  - In production, you could use Redis or another external store
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');

// Deduplication transform using a cache
function dedupeWithCache() {
  const cache = new Set();
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (cache.has(chunk)) {
        // Duplicate, skip
        callback();
      } else {
        cache.add(chunk);
        this.push(chunk);
        callback();
      }
    }
  });
}

// Example async generator: numbers with duplicates
async function* numbers() {
  const arr = [1, 2, 2, 3, 4, 4, 5, 1, 6, 7, 7, 8, 9, 10];
  for (const n of arr) {
    await new Promise(r => setTimeout(r, 30));
    yield n;
  }
}

const pipeline = from(numbers()).pipe(dedupeWithCache());

(async () => {
  console.log('Deduplication with cache pipeline started');
  for await (const value of pipeline) {
    console.log(`[unique] ${value}`);
  }
  console.log('Pipeline complete!');
})();