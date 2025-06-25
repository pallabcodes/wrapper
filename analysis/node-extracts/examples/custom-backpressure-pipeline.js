/**
 * Advanced Pattern: Custom Backpressure Strategy
 * 
 * This example demonstrates:
 *  - Dropping items when downstream is slow (instead of buffering)
 *  - Could also be adapted to buffer or pause
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');

// Drop strategy: if downstream is slow, drop the chunk
function dropOnBackpressure() {
  return new Transform({
    objectMode: true,
    highWaterMark: 2, // Small buffer to demonstrate dropping
    transform(chunk, encoding, callback) {
      // Try to push, but if buffer is full, drop
      if (this.push(chunk) === false) {
        console.log('[drop] Downstream slow, dropping next chunk!');
      }
      callback();
    }
  });
}

// Example async generator: numbers 1-20
async function* numbers() {
  for (let i = 1; i <= 20; i++) {
    await new Promise(r => setTimeout(r, 10));
    yield i;
  }
}

const pipeline = from(numbers()).pipe(dropOnBackpressure());

(async () => {
  console.log('Custom backpressure pipeline started');
  for await (const value of pipeline) {
    await new Promise(r => setTimeout(r, 100)); // Simulate slow consumer
    console.log(`[output] ${value}`);
  }
  console.log('Pipeline complete!');
})();