/**
 * Node.js Stream State Management - Repurposable Extraction
 *
 * This file distills the hacky, ingenious state management patterns used in Node.js streams.
 * It shows how to track and mutate stream state for buffering, flow control, and lifecycle.
 *
 * Repurpose these patterns for any async resource or pipeline that needs robust state tracking.
 */

// Writable state pattern
class WritableState {
  constructor(options, stream) {
    this.highWaterMark = options.highWaterMark || 16 * 1024;
    this.objectMode = !!options.objectMode;
    this.buffered = [];
    this.length = 0;
    this.corked = 0;
    this.ending = false;
    this.ended = false;
    this.finished = false;
    this.errorEmitted = false;
    this.needDrain = false;
    this.writing = false;
    this.sync = true;
    this.pendingcb = 0;
    this.stream = stream;
  }
}

// Readable state pattern
class ReadableState {
  constructor(options, stream) {
    this.highWaterMark = options.highWaterMark || 16 * 1024;
    this.objectMode = !!options.objectMode;
    this.buffer = [];
    this.length = 0;
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

// Duplex state: combines readable and writable state
class DuplexState {
  constructor(options, stream) {
    this.readableState = new ReadableState(options, stream);
    this.writableState = new WritableState(options, stream);
  }
}

module.exports = {
  WritableState,
  ReadableState,
  DuplexState
};

/*
Key takeaways:
- State objects encapsulate all mutable state for a stream.
- This pattern enables robust, debuggable, and extensible async resource management.
- Repurpose for any async system needing lifecycle, buffering,
*/