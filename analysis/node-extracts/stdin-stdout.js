// Node.js process.stdin and process.stdout Patterns - Repurposable Extraction
// These patterns are universal and can be adapted to other languages (Go, Python, Rust, etc.)

// Reading from stdin (line by line)
function readLinesFromStdin(onLine, onClose) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });
  rl.on('line', onLine);
  rl.on('close', () => {
    if (onClose) onClose();
  });
}

// Writing to stdout
function writeToStdout(data) {
  process.stdout.write(data + '\n');
}

// Example usage:
// readLinesFromStdin(line => {
//   writeToStdout('Echo: ' + line);
// });

module.exports = {
  readLinesFromStdin,
  writeToStdout
};

// --- GOD-MODE / HACKY / PATCHY PATTERNS ---

// Monkey-patch process.stdout.write to intercept all output
function patchStdoutWrite(interceptor) {
  const origWrite = process.stdout.write;
  process.stdout.write = function(chunk, encoding, cb) {
    interceptor(chunk);
    return origWrite.apply(this, arguments);
  };
  return () => { process.stdout.write = origWrite; } // restore
}

// Monkey-patch process.stdin to inject or transform input
function patchStdinRead(transformer) {
  const origEmit = process.stdin.emit;
  process.stdin.emit = function(event, ...args) {
    if (event === 'data' && args[0]) {
      args[0] = Buffer.from(transformer(args[0].toString()));
    }
    return origEmit.call(this, event, ...args);
  };
  return () => { process.stdin.emit = origEmit; } // restore
}

// Hijack stdin to force synchronous read (dangerous, but possible)
function readStdinSync() {
  const fs = require('fs');
  return fs.readFileSync('/dev/stdin', 'utf8');
}

// Access internal Node.js handles (undocumented, for introspection)
function getActiveHandles() {
  return process._getActiveHandles ? process._getActiveHandles() : [];
}

// Example usage:
// const unpatch = patchStdoutWrite(chunk => { console.log('[INTERCEPTED]', chunk.toString()); });
// writeToStdout('test');
// unpatch();

// const restore = patchStdinRead(str => str.toUpperCase());
// readLinesFromStdin(line => { writeToStdout(line); });
// restore();

module.exports.patchStdoutWrite = patchStdoutWrite;
module.exports.patchStdinRead = patchStdinRead;
module.exports.readStdinSync = readStdinSync;
module.exports.getActiveHandles = getActiveHandles;

// Monkey-patch readline.Interface to intercept all input lines
function patchReadline(onLineInterceptor) {
  const readline = require('readline');
  const origOn = readline.Interface.prototype.on;
  readline.Interface.prototype.on = function(event, listener) {
    if (event === 'line') {
      const wrapped = line => {
        onLineInterceptor(line);
        listener(line);
      };
      return origOn.call(this, event, wrapped);
    }
    return origOn.call(this, event, listener);
  };
  return () => { readline.Interface.prototype.on = origOn; };
}

// Reassign process.stdin/process.stdout at runtime (dangerous, for hotpatching streams)
function patchProcessStdio(newStdin, newStdout) {
  const origStdin = process.stdin;
  const origStdout = process.stdout;
  if (newStdin) process.stdin = newStdin;
  if (newStdout) process.stdout = newStdout;
  return () => {
    process.stdin = origStdin;
    process.stdout = origStdout;
  };
}

// Runtime mutation of stream properties (dangerous, for deep debugging)
function mutateStreamProperty(stream, prop, value) {
  const orig = stream[prop];
  stream[prop] = value;
  return () => { stream[prop] = orig; };
}

// Example usage:
// const unpatch = patchReadline(line => { console.log('[READLINE]', line); });
// readLinesFromStdin(line => { writeToStdout(line); });
// unpatch();

module.exports.patchReadline = patchReadline;
module.exports.patchProcessStdio = patchProcessStdio;
module.exports.mutateStreamProperty = mutateStreamProperty;
