/**
 * Advanced Pattern: Custom Stream Window Trigger
 * 
 * This example demonstrates:
 *  - Emitting a window when a custom condition is met (e.g., sum > threshold)
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');

function windowOnSum(threshold) {
  let buffer = [];
  let sum = 0;
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      buffer.push(chunk);
      sum += chunk;
      if (sum >= threshold) {
        this.push([...buffer]);
        buffer = [];
        sum = 0;
      }
      callback();
    },
    flush(callback) {
      if (buffer.length) this.push([...buffer]);
      callback();
    }
  });
}

// Example async generator: numbers 1-10
async function* numbers() {
  for (let i = 1; i <= 10; i++) {
    await new Promise(r => setTimeout(r, 30));
    yield i;
  }
}

const pipeline = from(numbers()).pipe(windowOnSum(15));

(async () => {
  console.log('Custom window trigger pipeline started');
  for await (const window of pipeline) {
    console.log(`[window] ${window.join(', ')}`);
  }
  console.log('Pipeline complete!');
})();