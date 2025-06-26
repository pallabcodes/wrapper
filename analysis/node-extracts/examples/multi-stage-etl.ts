/**
 * Advanced Pattern: Multi-Stage ETL with Error Handling and Retries
 *
 * This example demonstrates:
 *  - Extract, transform, and load with error handling and retry logic
 *  - Skipping bad records and logging errors
 */

const { from } = require('../internal/streams/from');
import { Transform } from 'stream';

// Simulated unreliable API
async function unreliableTransform(data) {
  if (Math.random() < 0.3) throw new Error('Random failure');
  return { ...data, processed: true };
}

// Retry transform with exponential backoff
function retryTransform(maxRetries = 3) {
  return new Transform({
    objectMode: true,
    async transform(chunk, encoding, callback) {
      let attempts = 0;
      while (attempts <= maxRetries) {
        try {
          const result = await unreliableTransform(chunk);
          this.push(result);
          return callback();
        } catch (err) {
          attempts++;
          if (attempts > maxRetries) {
            console.error(`[retry] Giving up on`, chunk);
            return callback(); // skip
          }
          const delay = Math.pow(2, attempts) * 50;
          console.warn(`[retry] Attempt ${attempts}/${maxRetries} failed, retrying in ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
  });
}

// Example async generator: numbers 1-10
async function* numbers() {
  for (let i = 1; i <= 10; i++) {
    await new Promise(r => setTimeout(r, 30));
    yield { id: i, value: `val${i}` };
  }
}

const pipeline = from(numbers()).pipe(retryTransform(3));

(async () => {
  console.log('Multi-stage ETL with error handling pipeline started');
  for await (const item of pipeline) {
    if (item) {
      console.log('[output]', item);
    }
  }
  console.log('Pipeline complete!');
})();