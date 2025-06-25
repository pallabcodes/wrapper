/**
 * Advanced Pattern: Fan-Out (Broadcasting)
 * 
 * This example demonstrates:
 *  - Broadcasting each chunk to multiple output streams
 *  - Useful for logging, metrics, and parallel processing
 */

const { from } = require('../internal/streams/from');
const { PassThrough } = require('stream');

// Fan-out: broadcast to N output streams
function fanOut(numOutputs) {
  const outputs = Array.from({ length: numOutputs }, () => new PassThrough({ objectMode: true }));
  return {
    write(chunk) {
      outputs.forEach(s => s.write(chunk));
    },
    outputs
  };
}

// Example async generator: numbers 1-8
async function* numbers() {
  for (let i = 1; i <= 8; i++) {
    await new Promise(r => setTimeout(r, 40));
    yield i;
  }
}

const source = from(numbers());
const broadcaster = fanOut(3);

source.on('data', chunk => broadcaster.write(chunk));
source.on('end', () => broadcaster.outputs.forEach(s => s.end()));

broadcaster.outputs.forEach((stream, idx) => {
  (async () => {
    for await (const value of stream) {
      console.log(`[output ${idx}] got: ${value}`);
    }
  })();
});