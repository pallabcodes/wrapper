/**
 * Real-World Example: Custom Stream State Machine
 *
 * This example demonstrates:
 *  - Implementing a stream that parses a simple protocol with states
 *  - Handling multi-step workflows (e.g., header/body parsing)
 *  - Emitting parsed objects downstream
 */

const { from } = require('../internal/streams/from');
// --- FIX: Use Node's built-in Transform for correct object emission ---
const { Transform } = require('stream');

// Simulate a protocol: each message is "HEADER\nBODY\n"
async function* protocolStream() {
  const messages = [
    'A1\nHello World\n',
    'B2\nFoo Bar\n',
    'C3\nBaz Qux\n'
  ];
  for (const msg of messages) {
    for (const ch of msg) {
      await new Promise(r => setTimeout(r, 10));
      yield ch;
    }
  }
}

// State machine transform: parses header/body pairs
function protocolParser() {
  let buffer = '';
  let state = 'HEADER';
  let header = '';

  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      buffer += chunk;
      let idx;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);

        if (state === 'HEADER') {
          header = line;
          state = 'BODY';
        } else if (state === 'BODY') {
          const body = line;
          this.push({ header, body });
          state = 'HEADER';
        }
      }
      callback();
    },
    flush(callback) {
      callback();
    }
  });
}

// Compose the pipeline
const parsedMessages = from(protocolStream()).pipe(protocolParser());

// Consume the parsed messages
(async () => {
  console.log('State machine pipeline started');
  for await (const msg of parsedMessages) {
    console.log(`[parsed] Header: ${msg.header}, Body: ${msg.body}`);
  }
  console.log('Pipeline complete!');
})();