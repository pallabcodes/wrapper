/**
 * Real-World Example: Backpressure Handling with Rate Limiting
 * 
 * This example demonstrates:
 *  - How to handle fast producers with slow consumers
 *  - Rate limiting with highWaterMark
 *  - Monitoring backpressure events
 *  - Memory usage tracking
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('../internal/streams/transform');

// Simulate a fast producer
async function* fastProducer() {
  for (let i = 1; i <= 1000; i++) {
    yield { id: i, data: 'x'.repeat(1000) }; // Each item is ~1KB
  }
}

// Simulate a slow consumer
function slowProcessor() {
  return new Transform({
    objectMode: true,
    highWaterMark: 10, // Only buffer 10 items
    transform(chunk, encoding, callback) {
      // Simulate slow processing
      setTimeout(() => {
        console.log(`[processor] Processing item ${chunk.id}, queue size: ${this._readableState.length}`);
        callback(null, chunk);
      }, 100);
    }
  });
}

// Monitor memory usage
function logMemoryUsage() {
  const used = process.memoryUsage();
  console.log('[memory] Usage:', {
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`
  });
}

// Create and compose the pipeline
const source = from(fastProducer());
const pipeline = source
  .pipe(slowProcessor());

// Monitor backpressure
let backpressureCount = 0;
source.on('pause', () => {
  backpressureCount++;
  console.log(`[backpressure] Source paused! (${backpressureCount} times)`);
});
source.on('resume', () => console.log('[backpressure] Source resumed!'));

// Consume with backpressure monitoring
(async () => {
  console.log('Backpressure pipeline started');
  const interval = setInterval(logMemoryUsage, 1000);
  
  try {
    for await (const item of pipeline) {
      console.log(`[output] Processed ${item.id}`);
    }
  } finally {
    clearInterval(interval);
  }
  
  console.log('Pipeline complete!');
  console.log(`Total backpressure events: ${backpressureCount}`);
})();