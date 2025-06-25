/**
 * Advanced Pattern: Windowed Aggregation (Sliding Window)
 * 
 * This example demonstrates:
 *  - Maintaining a sliding window of N items
 *  - Emitting rolling sums (or averages, etc)
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');

// Sliding window transform
function slidingWindow(size) {
  let window = [];
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      window.push(chunk);
      if (window.length > size) window.shift();
      if (window.length === size) {
        // Example: rolling sum
        const sum = window.reduce((a, b) => a + b, 0);
        this.push({ window: [...window], sum });
      }
      callback();
    }
  });
}

// Example async generator: numbers 1-20
async function* numbers() {
  for (let i = 1; i <= 20; i++) {
    await new Promise(r => setTimeout(r, 30));
    yield i;
  }
}

const pipeline = from(numbers()).pipe(slidingWindow(5));

(async () => {
  console.log('Windowed aggregation pipeline started');
  for await (const result of pipeline) {
    console.log(`[window] ${result.window.join(', ')} | sum: ${result.sum}`);
  }
  console.log('Pipeline complete!');
})();