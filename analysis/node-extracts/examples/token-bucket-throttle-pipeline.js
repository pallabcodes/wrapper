/**
 * Advanced Pattern: Token Bucket Throttling
 * 
 * This example demonstrates:
 *  - Limiting throughput to N items per interval (rate limiting)
 *  - Bursty traffic is smoothed out by the token bucket
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');

function tokenBucketThrottle(rate, intervalMs) {
  let tokens = rate;
  setInterval(() => {
    tokens = rate;
  }, intervalMs);

  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      const trySend = () => {
        if (tokens > 0) {
          tokens--;
          this.push(chunk);
          callback();
        } else {
          setTimeout(trySend, 10);
        }
      };
      trySend();
    }
  });
}

// Example async generator: numbers 1-20
async function* numbers() {
  for (let i = 1; i <= 20; i++) {
    yield i;
  }
}

const pipeline = from(numbers()).pipe(tokenBucketThrottle(3, 500));

(async () => {
  console.log('Token bucket throttle pipeline started');
  for await (const value of pipeline) {
    console.log(`[throttled] ${value}`);
  }
  console.log('Pipeline complete!');
})();