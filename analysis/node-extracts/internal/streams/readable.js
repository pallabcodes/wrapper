const { EventEmitter } = require('events');

/**
 * Node.js Readable Stream Core - Repurposable Extraction
 *
 * This is the distilled, hacky, and ingenious core of Node.js's Readable stream.
 * It shows how Node manages read state, buffering, flow control, and async data delivery.
 *
 * You can repurpose this pattern for any async data source (file, socket, DB, etc).
 */

// Readable state: tracks everything about the stream's lifecycle
class ReadableState {
  constructor(options, stream) {
    this.highWaterMark = options.highWaterMark || 16 * 1024;
    this.objectMode = !!options.objectMode;
    this.buffer = [];
    this.length = 0; // total bytes buffered

    // Stream state
    this.ended = false;
    this.endEmitted = false;
    this.reading = false;
    this.needReadable = false;
    this.emittedReadable = false;
    this.sync = true;
    this.destroyed = false;
    this.stream = stream;
  }
}

// The hacky, extensible core: all async sources can subclass this
class Readable extends EventEmitter {
  constructor(options = {}) {
    super();
    this._readableState = new ReadableState(options, this); // <-- FIXED
    this.readable = true;
    this._read = options.read || this._read;
  }

  // Public API: read(n)
  read(n) {
    const state = this._readableState;
    if (state.destroyed) return null;

    // If no data, trigger _read to fill buffer
    if (state.length === 0 && !state.ended) {
      state.needReadable = true;
      this._read(state.highWaterMark);
      return null;
    }

    // If ended and buffer empty, emit 'end'
    if (state.ended && state.length === 0 && !state.endEmitted) {
      state.endEmitted = true;
      this.emit('end');
      return null;
    }

    // Pull from buffer
    let ret;
    if (state.objectMode) {
      ret = state.buffer.shift();
      state.length -= 1;
    } else {
      n = n == null ? state.length : Math.min(n, state.length);
      ret = Buffer.concat(state.buffer, n);
      state.buffer = [Buffer.from(state.buffer.join('').slice(n))];
      state.length -= n;
    }

    // If buffer below highWaterMark, trigger _read
    if (state.length < state.highWaterMark && !state.ended) {
      state.needReadable = true;
      this._read(state.highWaterMark);
    }

    return ret;
  }

  // Core: subclass must implement this
  _read(size) {
    // Example: async read from file/socket/etc
    setTimeout(() => {
      // Push data with this.push(data)
      // Or push null to signal end
    }, 0);
  }

  // Critical: This handles the async data flow
  push(chunk) {
    if (chunk === null) {
      this._readableState.ended = true;
      process.nextTick(() => this.emit('end'));
      return false;
    }

    if (this._readableState.flowing) {
      this.emit('data', chunk);
    }
    return true;
  }

  // Critical: This makes the stream start flowing
  resume() {
    if (!this._readableState.flowing) {
      this._readableState.flowing = true;
      process.nextTick(() => this._read());
    }
    return this;
  }

  pause() {
    this._readableState.flowing = false;
    return this;
  }

  // Push data into the buffer (called by _read)
  push(chunk) {
    const state = this._readableState;
    if (state.destroyed) return false;

    if (chunk === null) {
      state.ended = true;
      if (state.length === 0) {
        this.emit('end');
        state.endEmitted = true;
      }
      return false;
    }

    if (state.objectMode) {
      state.buffer.push(chunk);
      state.length += 1;
    } else {
      state.buffer.push(chunk);
      state.length += chunk.length;
    }

    // Emit 'data' event immediately for flowing mode
    this.emit('data', chunk);

    // Emit 'readable' if needed
    if (state.needReadable) {
      state.needReadable = false;
      this.emit('readable');
    }

    // Return false if buffer is over highWaterMark (backpressure)
    return state.length < state.highWaterMark;
  }

  // Add this method to your Readable class
  pipe(dest) {
    this.on('data', (chunk) => {
      const ok = dest.write(chunk);
      if (!ok) this.pause();
    });

    dest.on('drain', () => {
      if (this._readableState.flowing === false) {
        this.resume();
      }
    });

    this.on('end', () => {
      dest.end();
    });

    this.resume();
    return dest;
  }

  // Add this inside your Readable and Transform classes
  [Symbol.asyncIterator]() {
    this.resume();
    return {
      next: () => {
        return new Promise((resolve, reject) => {
          const onData = (chunk) => {
            cleanup();
            resolve({ value: chunk, done: false });
          };
          const onEnd = () => {
            cleanup();
            resolve({ value: undefined, done: true });
          };
          const onError = (err) => {
            cleanup();
            reject(err);
          };
          const cleanup = () => {
            this.removeListener('data', onData);
            this.removeListener('end', onEnd);
            this.removeListener('error', onError);
          };
          
          this.once('data', onData);
          this.once('end', onEnd);
          this.once('error', onError);
        });
      }
    };
  }

  // Destroy the stream
  destroy(err) {
    const state = this._readableState;
    if (state.destroyed) return;
    state.destroyed = true;
    if (err) this.emit('error', err);
    this.emit('close');
  }
}

module.exports = { Readable };

/*
Key takeaways for repurposing:
- The state machine (buffering, ended, reading) is the hacky, reusable core.
- Backpressure is handled by highWaterMark and push() return value.
- All async sources can be built by subclassing and implementing _read.
- The event-driven flow (readable, end) enables composability.
- This pattern is the backbone for file, socket, HTTP, and custom streams.
*/