// Node.js Event Loop - Advanced Conceptual Extraction
// This version adds timers, IO simulation, and microtask queue to the minimal event loop.

class AdvancedEventLoop {
  constructor() {
    this.taskQueue = [];
    this.microtaskQueue = [];
    this.timers = [];
    this.ioQueue = [];
    this.running = false;
    this.time = 0;
  }

  // Schedule a macro-task
  enqueue(fn) {
    this.taskQueue.push(fn);
  }

  // Schedule a microtask (like process.nextTick or Promise.resolve)
  enqueueMicrotask(fn) {
    this.microtaskQueue.push(fn);
  }

  // Schedule a timer
  setTimeout(fn, delay) {
    this.timers.push({ fn, time: this.time + delay });
  }

  // Simulate IO (callback after delay)
  simulateIO(fn, delay) {
    this.ioQueue.push({ fn, time: this.time + delay });
  }

  // Run the event loop
  run() {
    this.running = true;
    while (this.running && (this.taskQueue.length > 0 || this.timers.length > 0 || this.ioQueue.length > 0)) {
      // 1. Run all microtasks
      while (this.microtaskQueue.length > 0) {
        const fn = this.microtaskQueue.shift();
        try { fn(); } catch (err) { console.error('Microtask error:', err); }
      }
      // 2. Run next macro-task
      if (this.taskQueue.length > 0) {
        const fn = this.taskQueue.shift();
        try { fn(); } catch (err) { console.error('Task error:', err); }
      }
      // 3. Run timers
      this.timers = this.timers.filter(timer => {
        if (timer.time <= this.time) {
          try { timer.fn(); } catch (err) { console.error('Timer error:', err); }
          return false;
        }
        return true;
      });
      // 4. Run IO callbacks
      this.ioQueue = this.ioQueue.filter(io => {
        if (io.time <= this.time) {
          try { io.fn(); } catch (err) { console.error('IO error:', err); }
          return false;
        }
        return true;
      });
      // Advance time (simulate event loop tick)
      this.time++;
    }
  }

  stop() {
    this.running = false;
  }
}

// Example usage:
// const loop = new AdvancedEventLoop();
// loop.enqueue(() => console.log('Macro-task'));
// loop.enqueueMicrotask(() => console.log('Microtask'));
// loop.setTimeout(() => console.log('Timer'), 2);
// loop.simulateIO(() => console.log('IO done'), 3);
// loop.run();

module.exports = { AdvancedEventLoop };

// --- GOD-MODE / HACKY / PATCHY PATTERNS ---

// Monkey-patch setTimeout/setImmediate/process.nextTick to inject custom scheduling
function patchTimers({ setTimeoutImpl, setImmediateImpl, nextTickImpl }) {
  const origSetTimeout = global.setTimeout;
  const origSetImmediate = global.setImmediate;
  const origNextTick = process.nextTick;
  if (setTimeoutImpl) global.setTimeout = setTimeoutImpl;
  if (setImmediateImpl) global.setImmediate = setImmediateImpl;
  if (nextTickImpl) process.nextTick = nextTickImpl;
  return () => {
    global.setTimeout = origSetTimeout;
    global.setImmediate = origSetImmediate;
    process.nextTick = origNextTick;
  };
}

// Force an event loop tick (dangerous, for debugging or hotfixes)
function forceEventLoopTick(fn) {
  setImmediate(fn);
}

// Hijack the microtask queue (dangerous, for advanced scheduling)
function hijackMicrotaskQueue(hijacker) {
  const origQueueMicrotask = global.queueMicrotask;
  global.queueMicrotask = hijacker;
  return () => { global.queueMicrotask = origQueueMicrotask; };
}

// Example usage:
// const unpatch = patchTimers({ setTimeoutImpl: (fn, ms) => { console.log('Patched setTimeout'); return setTimeout(fn, ms); } });
// setTimeout(() => console.log('test'), 10);
// unpatch();

module.exports.patchTimers = patchTimers;
module.exports.forceEventLoopTick = forceEventLoopTick;
module.exports.hijackMicrotaskQueue = hijackMicrotaskQueue;
