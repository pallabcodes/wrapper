/**
 * Node.js Stream Destroy Core - Repurposable Extraction
 *
 * This is the distilled, hacky, and ingenious core of Node.js's stream destroy logic.
 * It provides a robust way to tear down a stream, clean up resources, and emit the right events.
 *
 * You can repurpose this pattern for any async resource or lifecycle management (sockets, files, custom resources).
 */

// The core destroy logic: ensures cleanup and correct event emission
function destroy(err, cb) {
  if (this._destroyed) return;
  this._destroyed = true;

  // Custom resource cleanup logic (subclass can override _destroy)
  if (typeof this._destroy === 'function') {
    this._destroy(err, (error) => {
      if (cb) cb(error);
      if (error) this.emit('error', error);
      this.emit('close');
    });
  } else {
    if (cb) cb(err);
    if (err) this.emit('error', err);
    this.emit('close');
  }
}

// Patch destroy onto a stream instance
function addDestroy(stream) {
  stream.destroy = destroy.bind(stream);
  stream._destroyed = false;
}

// Repurposing: Use destroy for any async resource with a lifecycle
// Example: Custom socket or file handle
/*
class MySocket extends EventEmitter {
  constructor() { ... }
  _destroy(err, cb) {
    // Close socket, cleanup, etc.
    cb();
  }
}
addDestroy(MySocket.prototype);
*/

module.exports = { destroy, addDestroy };

/*
Key takeaways for repurposing:
- Robust destroy logic is essential for async resource management.
- Always emit 'close' and optionally 'error' on teardown.
- Subclass can override _destroy for custom cleanup.
- This pattern is the backbone for sockets, files, and custom resource streams.
*/