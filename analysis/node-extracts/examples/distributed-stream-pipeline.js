/**
 * Advanced Pattern: Distributed Stream Simulation
 * 
 * This example demonstrates:
 *  - Multiple async producers (shards) emitting data
 *  - Central consumer merges and processes all data
 */

const { PassThrough } = require('stream');

// Simulate N distributed producers
function distributedProducer(id, count, delay) {
  let i = 1;
  const stream = new PassThrough({ objectMode: true });
  const interval = setInterval(() => {
    if (i > count) {
      clearInterval(interval);
      stream.end();
    } else {
      stream.write({ producer: id, value: i++ });
    }
  }, delay);
  return stream;
}

// Merge all producers
function mergeStreams(streams) {
  const output = new PassThrough({ objectMode: true });
  let ended = 0;
  streams.forEach(s => {
    s.on('data', chunk => output.write(chunk));
    s.on('end', () => {
      ended++;
      if (ended === streams.length) output.end();
    });
  });
  return output;
}

const producers = [
  distributedProducer('A', 5, 60),
  distributedProducer('B', 5, 100),
  distributedProducer('C', 5, 80)
];

const merged = mergeStreams(producers);

(async () => {
  console.log('Distributed stream pipeline started');
  for await (const item of merged) {
    console.log(`[central] from ${item.producer}: ${item.value}`);
  }
  console.log('Pipeline complete!');
})();