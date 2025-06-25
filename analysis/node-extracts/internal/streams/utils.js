/**
 * Node.js Stream Utils Core - Repurposable Extraction
 *
 * This is a distilled set of hacky, ingenious, and reusable stream utility functions.
 * These utilities support core stream operations like pipeline composition, callback handling, and object checks.
 *
 * You can repurpose these helpers for any async/evented system, not just streams.
 */

// Simple once utility: ensures a function is only called once
function once(fn) {
  let called = false;
  return function (...args) {
    if (called) return;
    called = true;
    fn.apply(this, args);
  };
}

// Simple callbackify: turns a promise-returning fn into a callback-style fn
function callbackify(fn) {
  return function (...args) {
    const cb = args.pop();
    fn.apply(this, args)
      .then(result => cb(null, result))
      .catch(err => cb(err));
  };
}

// isStream: checks if an object is a stream-like (duck typing)
function isStream(obj) {
  return obj && typeof obj.pipe === 'function';
}

// isReadable: checks if an object is readable stream-like
function isReadable(obj) {
  return isStream(obj) && typeof obj.read === 'function';
}

// isWritable: checks if an object is writable stream-like
function isWritable(obj) {
  return isStream(obj) && typeof obj.write === 'function';
}

module.exports = {
  once,
  callbackify,
  isStream,
  isReadable,
  isWritable
};

/*
Key takeaways for repurposing:
- once() is essential for robust event/callback handling.
- callbackify() bridges promise and callback worlds.
- isStream/isReadable/isWritable enable flexible, duck-typed APIs.
- These patterns are useful in any async/evented system, not just streams.
*/