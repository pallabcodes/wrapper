const { Transform } = require('./transform');

function map(fn) {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      try {
        console.log('[map] Processing chunk:', chunk);
        const result = fn(chunk);
        console.log('[map] Transformed to:', result);
        // Ensure we don't push null values through the pipeline
        if (result !== null && result !== undefined) {
          callback(null, result);
        } else {
          console.log('[map] Skipping null/undefined result');
          callback();
        }
      } catch (err) {
        console.error('[map] Error:', err);
        callback(err);
      }
    },
    flush(callback) {
      console.log('[map] Flushing');
      callback();
    }
  });
}

function filter(fn) {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      try {
        console.log('[filter] Testing chunk:', chunk);
        const keep = fn(chunk);
        console.log('[filter] Keep chunk?', keep);
        if (keep) {
          callback(null, chunk);
        } else {
          callback();
        }
      } catch (err) {
        console.error('[filter] Error:', err);
        callback(err);
      }
    },
    flush(callback) {
      console.log('[filter] Flushing');
      callback();
    }
  });
}

function reduce(fn, initial) {
  let acc = initial;
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      try {
        console.log('[reduce] Accumulating chunk:', chunk);
        console.log('[reduce] Current accumulator:', acc);
        acc = fn(acc, chunk);
        console.log('[reduce] New accumulator:', acc);
        callback();
      } catch (err) {
        console.error('[reduce] Error:', err);
        callback(err);
      }
    },
    flush(callback) {
      console.log('[reduce] Flushing with final value:', acc);
      callback(null, acc);
    }
  });
}

// Utility to create a debug-enabled transform
function debug(label) {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      console.log(`[${label}] chunk:`, chunk);
      callback(null, chunk);
    }
  });
}

module.exports = { map, filter, reduce, debug };