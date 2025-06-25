/**
 * Advanced Pattern: Distributed Checkpointing (Simulated)
 * 
 * This example demonstrates:
 *  - Saving and restoring checkpoints for multiple distributed sources
 *  - Useful for distributed stream processing recovery
 */

const { PassThrough } = require('stream');
const fs = require('fs');

const CHECKPOINT_FILE = 'distributed-checkpoint.json';

function saveCheckpoint(state) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(state));
}

function loadCheckpoint() {
  try {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// Simulate distributed producers
function distributedProducer(id, start, end, delay, lastCheckpoint) {
  let i = lastCheckpoint || start;
  const stream = new PassThrough({ objectMode: true });
  const interval = setInterval(() => {
    if (i > end) {
      clearInterval(interval);
      stream.end();
    } else {
      stream.write({ producer: id, value: i });
      i++;
    }
  }, delay);
  return stream;
}

const lastCheckpoints = loadCheckpoint();
const producers = [
  distributedProducer('A', 1, 5, 60, lastCheckpoints.A),
  distributedProducer('B', 1, 5, 100, lastCheckpoints.B),
  distributedProducer('C', 1, 5, 80, lastCheckpoints.C)
];

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

const merged = mergeStreams(producers);
const checkpointState = { ...lastCheckpoints };

(async () => {
  console.log('Distributed checkpoint pipeline started');
  for await (const item of merged) {
    checkpointState[item.producer] = item.value;
    saveCheckpoint(checkpointState);
    console.log(`[central] from ${item.producer}: ${item.value}`);
  }
  console.log('Pipeline complete!');
})();