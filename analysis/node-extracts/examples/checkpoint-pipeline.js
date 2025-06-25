/**
 * Advanced Pattern: Stream Checkpointing
 * 
 * This example demonstrates:
 *  - Saving progress (last processed item) to disk
 *  - Resuming from the last checkpoint after a crash/restart
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');
const fs = require('fs');

const CHECKPOINT_FILE = 'checkpoint.txt';

function saveCheckpoint(id) {
  fs.writeFileSync(CHECKPOINT_FILE, String(id));
}

function loadCheckpoint() {
  try {
    return parseInt(fs.readFileSync(CHECKPOINT_FILE, 'utf8'), 10);
  } catch {
    return 0;
  }
}

// Example async generator: numbers 1-20
async function* numbers(start) {
  for (let i = start; i <= 20; i++) {
    await new Promise(r => setTimeout(r, 50));
    yield i;
  }
}

const lastCheckpoint = loadCheckpoint();
const pipeline = from(numbers(lastCheckpoint + 1)).pipe(new Transform({
  objectMode: true,
  transform(chunk, encoding, callback) {
    saveCheckpoint(chunk);
    this.push(chunk);
    callback();
  }
}));

(async () => {
  console.log('Checkpoint pipeline started (resume from', lastCheckpoint + 1, ')');
  for await (const value of pipeline) {
    console.log(`[checkpointed] ${value}`);
  }
  console.log('Pipeline complete!');
})();