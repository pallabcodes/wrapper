// Node.js EventEmitter God-Mode / Hacky / Patchy Patterns
const { EventEmitter } = require('events');

// Monkey-patch EventEmitter.prototype.emit to intercept all events
function patchEventEmitterEmit(interceptor) {
  const origEmit = EventEmitter.prototype.emit;
  EventEmitter.prototype.emit = function(event, ...args) {
    interceptor(event, ...args);
    return origEmit.apply(this, [event, ...args]);
  };
  return () => { EventEmitter.prototype.emit = origEmit; };
}

// Monkey-patch EventEmitter.prototype.on to wrap all listeners
function patchEventEmitterOn(listenerWrapper) {
  const origOn = EventEmitter.prototype.on;
  EventEmitter.prototype.on = function(event, listener) {
    return origOn.call(this, event, listenerWrapper(event, listener));
  };
  return () => { EventEmitter.prototype.on = origOn; };
}

// Runtime mutation of EventEmitter properties (dangerous, for deep debugging)
function mutateEmitterProperty(emitter, prop, value) {
  const orig = emitter[prop];
  emitter[prop] = value;
  return () => { emitter[prop] = orig; };
}

// Access internal event listeners (undocumented, for introspection)
function getInternalListeners(emitter, event) {
  return emitter._events && emitter._events[event] ? emitter._events[event] : [];
}

// Example usage:
// const unpatch = patchEventEmitterEmit((event, ...args) => { console.log('[EMIT]', event, args); });
// emitter.emit('foo', 1, 2);
// unpatch();

module.exports = {
  patchEventEmitterEmit,
  patchEventEmitterOn,
  mutateEmitterProperty,
  getInternalListeners
};

// --- EVEN DEEPER GOD-MODE / REAL-WORLD HACKS ---

// Monkey-patch EventEmitter.prototype.once to wrap all once-listeners
function patchEventEmitterOnce(listenerWrapper) {
  const origOnce = EventEmitter.prototype.once;
  EventEmitter.prototype.once = function(event, listener) {
    return origOnce.call(this, event, listenerWrapper(event, listener));
  };
  return () => { EventEmitter.prototype.once = origOnce; };
}

// Monkey-patch removeListener to intercept listener removals
function patchRemoveListener(interceptor) {
  const origRemove = EventEmitter.prototype.removeListener;
  EventEmitter.prototype.removeListener = function(event, listener) {
    interceptor(event, listener);
    return origRemove.call(this, event, listener);
  };
  return () => { EventEmitter.prototype.removeListener = origRemove; };
}

// Hijack the event queue (dangerous, for advanced scheduling)
function hijackEventQueue(emitter, event, hijacker) {
  if (emitter._events && emitter._events[event]) {
    const orig = emitter._events[event];
    emitter._events[event] = hijacker(orig);
    return () => { emitter._events[event] = orig; };
  }
  return () => {};
}

// Bypass listener leak detection (dangerous, for stress testing)
function bypassListenerLeakDetection(emitter) {
  const orig = emitter.getMaxListeners();
  emitter.setMaxListeners(0); // 0 = unlimited
  return () => { emitter.setMaxListeners(orig); };
}

module.exports.patchEventEmitterOnce = patchEventEmitterOnce;
module.exports.patchRemoveListener = patchRemoveListener;
module.exports.hijackEventQueue = hijackEventQueue;
module.exports.bypassListenerLeakDetection = bypassListenerLeakDetection;

// --- EXTREME GOD-MODE / REAL-WORLD HACKS ---

// Monkey-patch all EventEmitters globally (dangerous, for global event interception)
function patchAllEventEmitters(interceptor) {
  const origEmit = EventEmitter.prototype.emit;
  EventEmitter.prototype.emit = function(event, ...args) {
    interceptor(this, event, ...args);
    return origEmit.apply(this, [event, ...args]);
  };
  return () => { EventEmitter.prototype.emit = origEmit; };
}

// Event replay: capture and replay all events on an emitter
function enableEventReplay(emitter) {
  const events = [];
  const origEmit = emitter.emit;
  emitter.emit = function(event, ...args) {
    events.push([event, ...args]);
    return origEmit.apply(this, [event, ...args]);
  };
  emitter.replayEvents = function() {
    for (const e of events) {
      origEmit.apply(this, e);
    }
  };
  return () => { emitter.emit = origEmit; delete emitter.replayEvents; };
}

// Runtime mutation of event arguments (dangerous, for advanced event rewriting)
function patchEventArgs(emitter, event, mutator) {
  const origEmit = emitter.emit;
  emitter.emit = function(ev, ...args) {
    if (ev === event) {
      args = mutator(args);
    }
    return origEmit.apply(this, [ev, ...args]);
  };
  return () => { emitter.emit = origEmit; };
}

module.exports.patchAllEventEmitters = patchAllEventEmitters;
module.exports.enableEventReplay = enableEventReplay;
module.exports.patchEventArgs = patchEventArgs;

// --- UBER-SCALE GOD-MODE / REAL-WORLD HACKS ---

// 1. Global EventEmitter Registry & Mass Patching
const _emitterRegistry = new Set();
const origEE = require('events').EventEmitter;
const origEEInit = origEE.prototype.constructor;
origEE.prototype.constructor = function(...args) {
  _emitterRegistry.add(this);
  return origEEInit.apply(this, args);
};
function getAllEmitters() { return Array.from(_emitterRegistry); }
function patchAllEmitters(fn) {
  for (const emitter of _emitterRegistry) fn(emitter);
}

// 2. Listener Stack Tracing & Source Tracking
function patchListenerStackTrace(emitter) {
  const origOn = emitter.on;
  emitter.on = function(event, listener) {
    const stack = new Error().stack;
    listener._registeredStack = stack;
    return origOn.call(this, event, listener);
  };
  return () => { emitter.on = origOn; };
}
function getListenerStack(emitter, event) {
  const listeners = emitter.listeners(event);
  return listeners.map(l => l._registeredStack || null);
}

// 3. EventEmitter Time Travel (Event Buffering & Rewind)
function enableEventTimeTravel(emitter, maxBuffer = 1000) {
  const events = [];
  const origEmit = emitter.emit;
  emitter.emit = function(event, ...args) {
    if (events.length >= maxBuffer) events.shift();
    events.push([event, ...args]);
    return origEmit.apply(this, [event, ...args]);
  };
  emitter.rewindEvents = function(n = events.length) {
    for (let i = events.length - n; i < events.length; ++i) {
      if (i >= 0) origEmit.apply(this, events[i]);
    }
  };
  emitter.clearEventBuffer = function() { events.length = 0; };
  return () => { emitter.emit = origEmit; delete emitter.rewindEvents; delete emitter.clearEventBuffer; };
}

// 4. Dynamic Listener Replacement/Swapping
function replaceListener(emitter, event, oldListener, newListener) {
  emitter.removeListener(event, oldListener);
  emitter.on(event, newListener);
}

// 5. EventEmitter Shadowing (Proxy/Clone Emitters)
function shadowEmitter(source, target) {
  const origEmit = source.emit;
  source.emit = function(event, ...args) {
    target.emit(event, ...args);
    return origEmit.apply(this, [event, ...args]);
  };
  return () => { source.emit = origEmit; };
}

// 6. Leak/Storm Detection & Auto-Mitigation
function patchLeakStormDetection(emitter, opts = {}) {
  const eventCounts = Object.create(null);
  const listenerCounts = Object.create(null);
  const maxEvents = opts.maxEvents || 10000;
  const maxListeners = opts.maxListeners || 100;
  const origEmit = emitter.emit;
  const origOn = emitter.on;
  emitter.emit = function(event, ...args) {
    eventCounts[event] = (eventCounts[event] || 0) + 1;
    if (eventCounts[event] > maxEvents) {
      if (opts.onStorm) opts.onStorm(event, eventCounts[event]);
      if (opts.throttle) return false;
    }
    return origEmit.apply(this, [event, ...args]);
  };
  emitter.on = function(event, listener) {
    listenerCounts[event] = (listenerCounts[event] || 0) + 1;
    if (listenerCounts[event] > maxListeners) {
      if (opts.onLeak) opts.onLeak(event, listenerCounts[event]);
      if (opts.preventLeak) return this;
    }
    return origOn.call(this, event, listener);
  };
  return () => { emitter.emit = origEmit; emitter.on = origOn; };
}

module.exports.getAllEmitters = getAllEmitters;
module.exports.patchAllEmitters = patchAllEmitters;
module.exports.patchListenerStackTrace = patchListenerStackTrace;
module.exports.getListenerStack = getListenerStack;
module.exports.enableEventTimeTravel = enableEventTimeTravel;
module.exports.replaceListener = replaceListener;
module.exports.shadowEmitter = shadowEmitter;
module.exports.patchLeakStormDetection = patchLeakStormDetection;

// --- SYSTEM CALL / OS-LEVEL GOD-MODE HACKS ---

// 1. FD Hijacking for EventEmitter Streams
// Patch EventEmitter-based streams to hijack their file descriptors (FDs) at runtime
function hijackStreamFD(stream, newFD) {
  if (typeof stream.fd !== 'undefined') {
    const origFD = stream.fd;
    stream.fd = newFD;
    return () => { stream.fd = origFD; };
  }
  throw new Error('Stream does not expose fd');
}

// 2. epoll/kqueue/IOCP Integration (requires native modules)
// Example: Use 'epoll' npm module to bridge kernel events to EventEmitter
// Usage: const Epoll = require('epoll').Epoll;
//   const epoll = new Epoll((err, fd, events) => emitter.emit('epoll', fd, events));
//   epoll.add(fd, Epoll.EPOLLIN);
//   // ...
//   epoll.remove(fd);

// 3. Process Signal Bridging
// Patch process signal handlers to emit custom events on any EventEmitter
function bridgeProcessSignal(emitter, signal, eventName = 'signal') {
  const handler = (...args) => emitter.emit(eventName, signal, ...args);
  process.on(signal, handler);
  return () => process.off(signal, handler);
}

// 4. Native Addon Event Injection (C++/N-API required)
// Example: Use a native addon to call emitter.emit('native', ...args) from C++
// See: https://nodejs.org/api/n-api.html for N-API event emission

// 5. /proc and /dev Monitoring
// Monitor /proc or /dev files and emit events on change
const fs = require('fs');
function monitorProcFile(emitter, file, eventName = 'procChange') {
  let last = null;
  const watcher = fs.watch(file, () => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (!err && data !== last) {
        last = data;
        emitter.emit(eventName, data);
      }
    });
  });
  return () => watcher.close();
}

// 6. Monkey-patch net.Socket and child_process for system-level event interception
function patchNetSocketEmit(interceptor) {
  const net = require('net');
  const origEmit = net.Socket.prototype.emit;
  net.Socket.prototype.emit = function(event, ...args) {
    interceptor(this, event, ...args);
    return origEmit.apply(this, [event, ...args]);
  };
  return () => { net.Socket.prototype.emit = origEmit; };
}
function patchChildProcessEmit(interceptor) {
  const cp = require('child_process');
  const origEmit = cp.ChildProcess.prototype.emit;
  cp.ChildProcess.prototype.emit = function(event, ...args) {
    interceptor(this, event, ...args);
    return origEmit.apply(this, [event, ...args]);
  };
  return () => { cp.ChildProcess.prototype.emit = origEmit; };
}

module.exports.hijackStreamFD = hijackStreamFD;
module.exports.bridgeProcessSignal = bridgeProcessSignal;
module.exports.monitorProcFile = monitorProcFile;
module.exports.patchNetSocketEmit = patchNetSocketEmit;
module.exports.patchChildProcessEmit = patchChildProcessEmit;

// --- EXAMPLES OF USAGE ---

// const unpatch = patchEventEmitterEmit((event, ...args) => { console.log('[EMIT]', event, args); });
// emitter.emit('foo', 1, 2);
// unpatch();

// const fs = require('fs');
// const { hijackStreamFD } = require('./event-emitter');
// const stream = fs.createReadStream('/dev/null');
// const restore = hijackStreamFD(stream, 1); // Redirect to stdout (fd 1)
// ...use stream...
// restore(); // Restore original fd

// npm install epoll
const Epoll = require('epoll').Epoll;
const { EventEmitter } = require('events');
const emitter = new EventEmitter();
const fd = /* some file descriptor */;
const epoll = new Epoll((err, fd, events) => emitter.emit('epoll', fd, events));
epoll.add(fd, Epoll.EPOLLIN);
// Listen for kernel events
emitter.on('epoll', (fd, events) => { /* handle */ });

// const { bridgeProcessSignal } = require('./event-emitter');
// const { EventEmitter } = require('events');
// const emitter = new EventEmitter();
// const unbridge = bridgeProcessSignal(emitter, 'SIGUSR1', 'customSignal');
// emitter.on('customSignal', (signal) => { console.log('Got', signal); });
// // kill -USR1 <pid> from another shell
// unbridge();

const { monitorProcFile } = require('./event-emitter');
const { EventEmitter } = require('events');
const emitter = new EventEmitter();
const stop = monitorProcFile(emitter, '/proc/meminfo', 'memChange');
emitter.on('memChange', (data) => { console.log('Memory info changed:', data); });
// ...later
stop();

const { patchNetSocketEmit, patchChildProcessEmit } = require('./event-emitter');
const unpatchNet = patchNetSocketEmit((sock, event, ...args) => {
  if (event === 'data') console.log('Intercepted socket data:', args[0]);
});
const unpatchCP = patchChildProcessEmit((cp, event, ...args) => {
  if (event === 'exit') console.log('Child exited:', args[0]);
});
// ...use net or child_process...
unpatchNet();
unpatchCP();
