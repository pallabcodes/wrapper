/**
 * Real-World Example: Error Handling and Recovery in Streams
 * 
 * This example demonstrates:
 *  - Handling temporary failures (retry logic)
 *  - Skipping bad records
 *  - Logging errors without breaking the pipeline
 *  - Circuit breaker pattern for critical errors
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('../internal/streams/transform');

// Simulate an unreliable API that sometimes fails
async function simulateAPI(id) {
  if (Math.random() < 0.3) { // 30% failure rate
    throw new Error(`API failed for ID ${id}`);
  }
  return { id, result: `processed-${id}` };
}

// Retry transform with exponential backoff
function retryTransform(maxRetries = 3) {
  const failures = new Map();
  
  return new Transform({
    objectMode: true,
    async transform(chunk, encoding, callback) {
      const attempt = failures.get(chunk.id) || 0;
      
      try {
        if (attempt >= maxRetries) {
          console.error(`[retry] Max retries reached for ID ${chunk.id}`);
          callback(null, { id: chunk.id, error: 'MAX_RETRIES' });
          return;
        }

        const result = await simulateAPI(chunk.id);
        failures.delete(chunk.id);
        callback(null, result);
        
      } catch (err) {
        failures.set(chunk.id, attempt + 1);
        const delay = Math.pow(2, attempt) * 100; // Exponential backoff
        
        console.warn(`[retry] Attempt ${attempt + 1}/${maxRetries} failed for ID ${chunk.id}, retrying in ${delay}ms`);
        setTimeout(() => {
          this.push(chunk); // Re-queue for retry
          callback();
        }, delay);
      }
    }
  });
}

// Circuit breaker transform
function circuitBreaker(errorThreshold = 5, resetTimeout = 5000) {
  let failures = 0;
  let circuitOpen = false;
  let lastFailure = 0;
  
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (circuitOpen) {
        const now = Date.now();
        if (now - lastFailure >= resetTimeout) {
          console.log('[circuit] Attempting reset...');
          circuitOpen = false;
          failures = 0;
        } else {
          callback(new Error('Circuit breaker open'));
          return;
        }
      }

      if (chunk.error === 'MAX_RETRIES') {
        failures++;
        lastFailure = Date.now();
        
        if (failures >= errorThreshold) {
          circuitOpen = true;
          console.error('[circuit] Circuit breaker opened!');
          callback(new Error('Circuit breaker triggered'));
          return;
        }
      }

      callback(null, chunk);
    }
  });
}

// Create test data
async function* generateTestData() {
  for (let i = 1; i <= 20; i++) {
    yield { id: i };
    await new Promise(r => setTimeout(r, 100));
  }
}

// Compose pipeline with error handling
const pipeline = from(generateTestData())
  .pipe(retryTransform(3))
  .pipe(circuitBreaker(5, 5000));

// Run with error monitoring
(async () => {
  console.log('Error handling pipeline started');
  
  try {
    for await (const item of pipeline) {
      if (item.error) {
        console.warn(`[output] Item ${item.id} failed processing`);
      } else {
        console.log(`[output] Successfully processed ${item.id}`);
      }
    }
  } catch (err) {
    if (err.message === 'Circuit breaker triggered') {
      console.error('Pipeline stopped: Too many errors');
    } else {
      console.error('Pipeline failed:', err);
    }
  }
  
  console.log('Pipeline complete!');
})();