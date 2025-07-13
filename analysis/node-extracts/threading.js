// Node.js Threading and Worker Patterns - Repurposable Extraction
// These patterns can be adapted to other languages (Go, Python, Rust, etc.)

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Start a worker thread with a script and data
function startWorker(script, data) {
  return new Worker(script, { workerData: data });
}

// Example: Communicate with a worker
function setupWorkerCommunication(worker) {
  worker.on('message', msg => {
    console.log('Message from worker:', msg);
  });
  worker.on('error', err => {
    console.error('Worker error:', err);
  });
  worker.on('exit', code => {
    console.log('Worker exited with code', code);
  });
}

// In worker: send message to parent
function sendToParent(msg) {
  if (parentPort) {
    parentPort.postMessage(msg);
  }
}

// In worker: access workerData
function getWorkerData() {
  return workerData;
}

module.exports = {
  Worker,
  isMainThread,
  parentPort,
  workerData,
  startWorker,
  setupWorkerCommunication,
  sendToParent,
  getWorkerData
};

// --- GOD-MODE / HACKY / PATCHY PATTERNS ---

// Monkey-patch Worker to intercept all messages sent to workers
function patchWorkerPostMessage(interceptor) {
  const origPostMessage = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function(msg, ...args) {
    interceptor(msg);
    return origPostMessage.apply(this, [msg, ...args]);
  };
  return () => { Worker.prototype.postMessage = origPostMessage; } // restore
}

// Access internal thread pool (undocumented, for introspection)
function getActiveRequests() {
  // This is not officially documented and may break in future Node.js versions
  return process._getActiveRequests ? process._getActiveRequests() : [];
}

// Forcefully terminate all workers (dangerous, for god-mode debugging)
function terminateAllWorkers(workers) {
  for (const w of workers) {
    try { w.terminate(); } catch (e) { /* ignore */ }
  }
}

// Example usage:
// const unpatch = patchWorkerPostMessage(msg => { console.log('[INTERCEPTED]', msg); });
// ...
// unpatch();

module.exports.patchWorkerPostMessage = patchWorkerPostMessage;
module.exports.getActiveRequests = getActiveRequests;
module.exports.terminateAllWorkers = terminateAllWorkers;

// Monkey-patch Worker event listeners to intercept all events
function patchWorkerEvents(eventInterceptor) {
  const origOn = Worker.prototype.on;
  Worker.prototype.on = function(event, listener) {
    const wrapped = (...args) => {
      eventInterceptor(event, ...args);
      listener(...args);
    };
    return origOn.call(this, event, wrapped);
  };
  return () => { Worker.prototype.on = origOn; };
}

// Runtime mutation of worker properties (dangerous, for deep debugging)
function mutateWorkerProperty(worker, prop, value) {
  const orig = worker[prop];
  worker[prop] = value;
  return () => { worker[prop] = orig; };
}

// Manipulate thread pool size at runtime (dangerous, for performance tuning)
function setThreadPoolSize(size) {
  try {
    process.env.UV_THREADPOOL_SIZE = String(size);
  } catch (e) {}
}

// Example usage:
// const unpatch = patchWorkerEvents((event, ...args) => { console.log('[WORKER EVENT]', event, args); });
// ...
// unpatch();

module.exports.patchWorkerEvents = patchWorkerEvents;
module.exports.mutateWorkerProperty = mutateWorkerProperty;
module.exports.setThreadPoolSize = setThreadPoolSize;
