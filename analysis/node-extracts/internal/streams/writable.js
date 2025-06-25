const { EventEmitter } = require('events');

/**
 * Node.js Writable Stream Core - Repurposable Extraction
 * 
 * This is the distilled, hacky, and ingenious core of Node.js's Writable stream.
 * It shows how Node manages write state, buffering, backpressure, and async flow.
 * 
 * You can repurpose this pattern for any async sink (file, socket, DB, etc).
 */

// Minimal EventEmitter (replace with your own or Node's)
class MyEventEmitter {
  constructor() { this._events = {}; }
  on(ev, fn) { (this._events[ev] = this._events[ev] || []).push(fn); }
  emit(ev, ...args) { (this._events[ev] || []).forEach(fn => fn(...args)); }
}

// Writable state: tracks everything about the stream's lifecycle
class WritableState {
  constructor(options, stream) {
    this.highWaterMark = options.highWaterMark || 16 * 1024;
    this.objectMode = !!options.objectMode;
    this.decodeStrings = !options.decodeStrings === false;
    this.defaultEncoding = options.defaultEncoding || 'utf8';

    // Buffer for writes that can't be flushed immediately
    this.buffered = [];
    this.length = 0; // total bytes buffered

    // Corking: temporarily buffer all writes
    this.corked = 0;

    // Stream state
    this.ending = false;
    this.ended = false;
    this.finished = false;
    this.errorEmitted = false;

    // Backpressure
    this.needDrain = false;
    this.writing = false;
    this.sync = true; // are we in the same tick?
    this.pendingcb = 0; // callbacks waiting for finish
    this.stream = stream;
  }
}

// The hacky, extensible core: all async sinks can subclass this
class Writable extends MyEventEmitter {
  constructor(options = {}) {
    super();
    this._writableState = new WritableState(options, this);
  }

  // Public API: write(chunk, encoding, cb)
  write(chunk, encoding, cb) {
    const state = this._writableState;
    if (typeof encoding === 'function') { cb = encoding; encoding = null; }
    encoding = encoding || state.defaultEncoding;

    // Validate input
    if (state.ending) throw new Error('write after end');
    if (typeof cb !== 'function') cb = () => {};

    // Convert chunk if needed
    if (!state.objectMode && typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding);
    }

    // Buffer the write if we're busy or corked
    if (state.writing || state.corked) {
      state.buffered.push({ chunk, encoding, cb });
      state.length += state.objectMode ? 1 : chunk.length;
    } else {
      // Write immediately
      this._write(chunk, encoding, cb);
      state.writing = true;
      state.length += state.objectMode ? 1 : chunk.length;
    }

    // Backpressure: return false if buffer is over highWaterMark
    const ret = state.length < state.highWaterMark;
    if (!ret) state.needDrain = true;
    return ret;
  }

  // Core: subclass must implement this
  _write(chunk, encoding, cb) {
    // Example: async write to file/socket/etc
    setTimeout(() => {
      cb();
      this._onwrite();
    }, 0);
  }

  // Internal: called after a write finishes
  _onwrite() {
    const state = this._writableState;
    state.writing = false;

    // Flush buffered writes
    if (state.buffered.length) {
      const { chunk, encoding, cb } = state.buffered.shift();
      this._write(chunk, encoding, cb);
      state.writing = true;
      state.length -= state.objectMode ? 1 : chunk.length;
    } else if (state.needDrain) {
      state.needDrain = false;
      this.emit('drain');
    }

    // Finish if ending and nothing left
    if (state.ending && !state.writing && !state.buffered.length) {
      state.finished = true;
      this.emit('finish');
    }
  }

  // Cork: buffer all writes until uncork is called
  cork() {
    this._writableState.corked++;
  }

  uncork() {
    const state = this._writableState;
    if (state.corked) {
      state.corked--;
      if (!state.writing && state.buffered.length) {
        const { chunk, encoding, cb } = state.buffered.shift();
        this._write(chunk, encoding, cb);
        state.writing = true;
        state.length -= state.objectMode ? 1 : chunk.length;
      }
    }
  }

  // End the stream: flush all writes, then emit 'finish'
  end(chunk, encoding, cb) {
    const state = this._writableState;
    if (typeof chunk === 'function') { cb = chunk; chunk = null; encoding = null; }
    else if (typeof encoding === 'function') { cb = encoding; encoding = null; }
    if (chunk != null) this.write(chunk, encoding);
    state.ending = true;
    if (!state.writing && !state.buffered.length) {
      state.finished = true;
      this.emit('finish');
      if (cb) cb();
    } else if (cb) {
      this.once('finish', cb);
    }
  }
}

// Repurposing: You can subclass Writable for any async sink
// Example: Repurposed for a custom logging sink
class LogSink extends Writable {
  _write(chunk, encoding, cb) {
    // Write to a log file, remote server, etc.
    process.stdout.write(`[LOG] ${chunk}\n`);
    cb();
    this._onwrite();
  }
}

module.exports = { Writable, WritableState, LogSink };

/*
Key takeaways for repurposing:
- The state machine (buffering, corking, ending) is the hacky, reusable core.
- Backpressure is handled by highWaterMark and needDrain.
- All async sinks can be built by subclassing and implementing _write.
- The event-driven flow (drain, finish) enables composability.
- This pattern is the backbone for file, socket, HTTP, and custom streams.
*/