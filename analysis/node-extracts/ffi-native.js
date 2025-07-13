// Node.js FFI/Native Binding Patterns - Repurposable Extraction
// These patterns show how to interface with native code from Node.js and can inspire similar patterns in Go, Rust, Python, etc.

// Using Node.js built-in 'ffi-napi' or 'node-ffi' (install via npm if needed)
// Example: Load a native C library and call a function
// const ffi = require('ffi-napi');
// const libm = ffi.Library('libm', {
//   'ceil': ['double', ['double']]
// });
// console.log(libm.ceil(1.5)); // 2

// Using N-API or node-addon-api for C/C++ addons
// Example: C++ binding (see Node.js docs for full details)
// const addon = require('./build/Release/addon');
// console.log(addon.hello());

// Using process.dlopen for dynamic libraries (rare, advanced)
// process.dlopen(module, pathToLib);

// Pattern: Expose a C/C++/Rust function to JS, call from Node.js, handle data marshaling
// - Write native code (C/C++/Rust)
// - Build as shared library or Node.js addon
// - Use ffi-napi, node-ffi, or N-API to load and call

// These patterns are directly portable to Go (cgo), Rust (FFI), Python (ctypes/cffi), etc.

module.exports = {
  /* See above for usage patterns. Actual code will depend on the native library and binding method. */
};

// --- GOD-MODE / HACKY / PATCHY PATTERNS ---

// Monkey-patch native bindings at runtime (dangerous, for debugging or hotfixes)
function patchNativeBinding(moduleName, fnName, newImpl) {
  try {
    const mod = process.binding(moduleName);
    if (mod && mod[fnName]) {
      const orig = mod[fnName];
      mod[fnName] = newImpl;
      return () => { mod[fnName] = orig; } // restore
    }
  } catch (e) {}
  return () => {};
}

// Direct memory manipulation (Buffer/ArrayBuffer hacks)
function overwriteBuffer(buf, value) {
  if (Buffer.isBuffer(buf)) {
    buf.fill(value);
  }
}

// Access internal native handles (undocumented, for introspection)
function getNativeHandle(obj) {
  return obj._handle || obj.fd || null;
}

// Example usage:
// const restore = patchNativeBinding('fs', 'open', (...args) => { throw new Error('fs.open disabled!'); });
// ...
// restore();

// Get the memory address of a Buffer (dangerous, for native interop)
function getBufferAddress(buf) {
  if (Buffer.isBuffer(buf)) {
    return buf.buffer ? buf.buffer : null;
  }
  return null;
}

// Unsafe type punning: reinterpret a Buffer as a different type (dangerous)
function reinterpretBuffer(buf, length, offset = 0) {
  if (Buffer.isBuffer(buf)) {
    return buf.slice(offset, offset + length);
  }
  return null;
}

// Resolve internal symbols (undocumented, for advanced FFI)
function resolveInternalSymbol(symbol) {
  try {
    return process.binding('natives')[symbol] || null;
  } catch (e) { return null; }
}

module.exports.getBufferAddress = getBufferAddress;
module.exports.reinterpretBuffer = reinterpretBuffer;
module.exports.resolveInternalSymbol = resolveInternalSymbol;

module.exports.patchNativeBinding = patchNativeBinding;
module.exports.overwriteBuffer = overwriteBuffer;
module.exports.getNativeHandle = getNativeHandle;
