/**
 * Advanced Pattern: Custom Stream Metrics
 * 
 * This example demonstrates:
 *  - Tracking throughput and latency in a stream pipeline
 *  - Useful for monitoring and tuning performance
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');

function metrics() {
  let count = 0;
  let start = Date.now();
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      count++;
      this.push({ value: chunk, ts: Date.now() });
      callback();
    },
    flush(callback) {
      const duration = Date.now() - start;
      console.log(`[metrics] Processed ${count} items in ${duration} ms (${(count / (duration / 1000)).toFixed(2)} items/sec)`);
      callback();
    }
  });
}

// Example async generator: numbers 1-20
async function* numbers() {
  for (let i = 1; i <= 20; i++) {
    await new Promise(r => setTimeout(r, 15));
    yield i;
  }
}

const pipeline = from(numbers()).pipe(metrics());

(async () => {
  console.log('Metrics pipeline started');
  for await (const item of pipeline) {
    console.log(`[output] ${item.value} at ${item.ts}`);
  }
  console.log('Pipeline complete!');
})();