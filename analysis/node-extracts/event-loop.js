// Node.js Event Loop - Conceptual and Practical Extraction
// This is a simplified, educational version of the event loop pattern as seen in Node.js/libuv.
// The real implementation is in C/C++ (libuv), but the pattern is universal and can be adapted elsewhere.

// A minimal event loop in JavaScript (for educational purposes)
class EventLoop {
  constructor() {
    this.queue = [];
    this.running = false;
  }

  // Schedule a callback
  enqueue(fn) {
    this.queue.push(fn);
  }

  // Run the event loop
  run() {
    this.running = true;
    while (this.running && this.queue.length > 0) {
      const fn = this.queue.shift();
      try {
        fn();
      } catch (err) {
        console.error('Event loop error:', err);
      }
    }
  }

  // Stop the event loop
  stop() {
    this.running = false;
  }
}

// Example usage:
// const loop = new EventLoop();
// loop.enqueue(() => console.log('Task 1'));
// loop.enqueue(() => console.log('Task 2'));
// loop.run();

module.exports = { EventLoop };
