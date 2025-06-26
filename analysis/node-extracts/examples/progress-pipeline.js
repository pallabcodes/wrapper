/**
 * Advanced Pattern: Stream Progress Reporting
 * 
 * This example demonstrates:
 *  - Reporting progress and ETA based on processed items
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');

function progressReporter(total) {
  let count = 0;
  const start = Date.now();
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      count++;
      const elapsed = (Date.now() - start) / 1000;
      const rate = count / elapsed;
      const eta = ((total - count) / rate).toFixed(2);
      console.log(`[progress] ${count}/${total} (${((count / total) * 100).toFixed(1)}%) ETA: ${eta}s`);
      this.push(chunk);
      callback();
    }
  });
}

// Example async generator: numbers 1-20
async function* numbers() {
  for (let i = 1; i <= 20; i++) {
    await new Promise(r => setTimeout(r, 50));
    yield i;
  }
}

const pipeline = from(numbers()).pipe(progressReporter(20));

(async () => {
  for await (const value of pipeline) {
    // Do nothing, just progress
  }
  console.log('Progress pipeline complete!');
})();