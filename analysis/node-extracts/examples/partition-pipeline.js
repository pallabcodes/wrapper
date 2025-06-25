/**
 * Advanced Pattern: Stream Partitioning (Sharding)
 * 
 * This example demonstrates:
 *  - Splitting a stream into N partitions based on a hash/key
 *  - Processing partitions in parallel
 */

const { from } = require('../internal/streams/from');
const { Transform, PassThrough } = require('stream');

// Partition transform: routes chunks to N streams
function partitioner(numPartitions, keyFn) {
  const outputs = Array.from({ length: numPartitions }, () => new PassThrough({ objectMode: true }));
  const partitioner = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      const key = keyFn(chunk);
      const idx = key % numPartitions;
      outputs[idx].write(chunk);
      callback();
    }
  });
  partitioner.outputs = outputs;
  return partitioner;
}

// Example async generator: numbers 1-12
async function* numbers() {
  for (let i = 1; i <= 12; i++) {
    await new Promise(r => setTimeout(r, 20));
    yield i;
  }
}

const splitter = partitioner(3, n => n); // Partition by value mod 3
const source = from(numbers());
source.pipe(splitter);

splitter.outputs.forEach((stream, idx) => {
  (async () => {
    for await (const value of stream) {
      console.log(`[partition ${idx}] got: ${value}`);
    }
  })();
});

source.on('end', () => {
  splitter.outputs.forEach(s => s.end());
});