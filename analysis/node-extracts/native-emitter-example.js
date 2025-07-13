// JS loader and usage example for native-emitter addon
// Build the addon first: npx node-gyp configure build
const { EventEmitter } = require('events');
const native = require('./build/Release/native_emitter');

const emitter = new EventEmitter();
emitter.on('native', (val) => {
  console.log('Received native event with value:', val);
});

// Emit event from C++
native.emitEvent(emitter, 'native', 42);
