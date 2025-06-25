/**
 * Advanced Pattern: Multi-Stage Error Recovery
 * 
 * This example demonstrates:
 *  - Retrying on error, skipping bad items, or failing the pipeline
 *  - Each stage can have its own error strategy
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');

function retryTransform(maxRetries = 2) {
  return new Transform({
    objectMode: true,
    async transform(chunk, encoding, callback) {
      let attempts = 0;
      while (attempts <= maxRetries) {
        try {
          if (chunk === 5 && attempts < maxRetries) throw new Error('Temporary error');
          this.push(chunk);
          return callback();
        } catch (err) {
          attempts++;
          if (attempts > maxRetries) {
            console.log(`[retry] Giving up on ${chunk}`);
            return callback(); // skip
          }
          await new Promise(r => setTimeout(r, 50));
        }
      }
    }
  });
}

function failOnError() {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (chunk === 8) return callback(new Error('Fatal error on 8'));
      this.push(chunk);
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

const pipeline = from(numbers())
  .pipe(retryTransform(2))
  .pipe(failOnError());

pipeline.on('error', err => {
  console.error('[pipeline] Fatal error:', err.message);
});

(async () => {
  console.log('Multi-stage error recovery pipeline started');
  try {
    for await (const value of pipeline) {
      console.log(`[output] ${value}`);
    }
  } catch (err) {
    console.error('[main] Pipeline error:', err.message);
  }
  console.log('Pipeline complete!');
})();