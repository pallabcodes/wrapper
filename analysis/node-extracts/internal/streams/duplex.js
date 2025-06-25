/**
 * Node.js Duplex Stream Core - Repurposable Extraction
 *
 * This is the distilled, hacky, and ingenious core of Node.js's Duplex stream.
 * It shows how Node composes readable and writable logic to create bidirectional streams.
 *
 * You can repurpose this pattern for any async source/sink pair (e.g., network socket, proxy, etc).
 */

// Import the core Readable and Writable patterns
const { Readable } = require('./readable');
const { Writable, WritableState } = require('./writable');

// The hack: Duplex is both Readable and Writable, sharing state and events
class Duplex extends Readable {
  constructor(options = {}) {
    super(options);
    this._writableState = new WritableState(options, this);

    this.readable = options.readable !== false;
    this.writable = options.writable !== false;
  }
}

// Copy Writable prototype methods onto Duplex prototype (mixin)
Object.getOwnPropertyNames(Writable.prototype).forEach(name => {
  if (name !== 'constructor') {
    Duplex.prototype[name] = Writable.prototype[name];
  }
});

// Add a basic .pipe implementation if not present (for chaining)
Duplex.prototype.pipe = Readable.prototype.pipe;

module.exports = { Duplex };

/*
Key takeaways for repurposing:
- Duplex composes readable and writable state/methods for bidirectional flow.
- You can override _read and _write for custom source/sink logic.
- This pattern is the backbone for sockets, proxies, and protocol streams
*/