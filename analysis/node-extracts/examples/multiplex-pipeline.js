/**
 * Real-World Example: Stream Multiplexing and Demultiplexing
 * 
 * This example demonstrates:
 *  - Splitting a stream into multiple streams (demux)
 *  - Processing streams in parallel
 *  - Merging streams back together (mux)
 *  - Maintaining order with parallel processing
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('../internal/streams/transform');

// Demultiplexer: splits stream by priority (high/low)
function demux() {
  const highPriority = new Transform({ objectMode: true });
  const lowPriority = new Transform({ objectMode: true });

  const splitter = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      const target = chunk.priority === 'high' ? highPriority : lowPriority;
      target.push(chunk);
      callback();
    }
  });

  splitter.high = highPriority;
  splitter.low = lowPriority;
  return splitter;
}

// Multiplexer: merges streams maintaining order
function mux() {
  const pending = new Map();
  let nextId = 1;

  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      pending.set(chunk.id, chunk);
      
      // Emit chunks in order
      while (pending.has(nextId)) {
        this.push(pending.get(nextId));
        pending.delete(nextId);
        nextId++;
      }
      
      callback();
    }
  });
}

// Simulate different processing speeds
function processStream(label, delay) {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      setTimeout(() => {
        console.log(`[${label}] Processing ${chunk.id}`);
        callback(null, {
          ...chunk,
          processedBy: label,
          processedAt: Date.now()
        });
      }, delay);
    }
  });
}

// Generate test data with different priorities
async function* generateMixedData() {
  for (let i = 1; i <= 10; i++) {
    yield {
      id: i,
      priority: i % 3 === 0 ? 'high' : 'low',
      data: `item-${i}`
    };
    await new Promise(r => setTimeout(r, 100));
  }
}

// Create and compose the pipeline
const source = from(generateMixedData());
const splitter = demux();
const merger = mux();

// Split and process streams
const highPriorityPath = splitter.high
  .pipe(processStream('high-priority', 100));  // Fast processing

const lowPriorityPath = splitter.low
  .pipe(processStream('low-priority', 300));   // Slow processing

// Merge streams back
highPriorityPath.pipe(merger);
lowPriorityPath.pipe(merger);
source.pipe(splitter);

// Consume the merged stream
(async () => {
  console.log('Multiplex pipeline started');
  
  for await (const item of merger) {
    console.log(`[output] ID: ${item.id}, Priority: ${item.priority}, Processed by: ${item.processedBy}`);
  }
  
  console.log('Pipeline complete!');
})();