/**
 * Advanced Pattern: Stream Rebalancing (Dynamic Load Balancing)
 * 
 * This example demonstrates:
 *  - Dynamically distributing items to the least-busy worker stream
 *  - Useful for parallel processing with uneven workloads
 */

const { from } = require('../internal/streams/from');
const { PassThrough } = require('stream');

// Simulate N worker streams with different processing speeds
function createWorker(id, delay) {
  const stream = new PassThrough({ objectMode: true });
  (async () => {
    for await (const item of stream) {
      await new Promise(r => setTimeout(r, delay));
      console.log(`[worker ${id}] processed: ${item}`);
    }
  })();
  return stream;
}

function rebalance(workers) {
  let next = 0;
  return {
    write(chunk) {
      // Find the worker with the smallest buffer
      let minIdx = 0;
      let minLen = workers[0]._writableState.length;
      for (let i = 1; i < workers.length; i++) {
        if (workers[i]._writableState.length < minLen) {
          minLen = workers[i]._writableState.length;
          minIdx = i;
        }
      }
      workers[minIdx].write(chunk);
    },
    end() {
      workers.forEach(w => w.end());
    }
  };
}

// Example async generator: numbers 1-12
async function* numbers() {
  for (let i = 1; i <= 12; i++) {
    await new Promise(r => setTimeout(r, 20));
    yield i;
  }
}

const workers = [
  createWorker(1, 100),
  createWorker(2, 200),
  createWorker(3, 50)
];

const source = from(numbers());
const balancer = rebalance(workers);

source.on('data', chunk => balancer.write(chunk));
source.on('end', () => balancer.end());