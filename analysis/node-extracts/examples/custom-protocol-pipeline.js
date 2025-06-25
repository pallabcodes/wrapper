/**
 * Advanced Pattern: Custom Stream Protocol Implementation
 * 
 * This example demonstrates:
 *  - Parsing a simple binary protocol from a byte stream
 *  - Emitting parsed messages as objects
 */

const { Readable, Transform } = require('stream');

// Simulate a byte stream: [len][payload...][len][payload...]
function* byteStream() {
  const messages = ['hello', 'world', 'foo', 'bar'];
  for (const msg of messages) {
    yield Buffer.from([msg.length, ...Buffer.from(msg)]);
  }
}

function concatBuffers(gen) {
  return new Readable({
    read() {
      const { value, done } = gen.next();
      if (done) return this.push(null);
      this.push(value);
    }
  });
}

// Protocol parser: reads [len][payload...]
function protocolParser() {
  let buffer = Buffer.alloc(0);
  return new Transform({
    transform(chunk, encoding, callback) {
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length > 0) {
        const len = buffer[0];
        if (buffer.length < len + 1) break;
        const payload = buffer.slice(1, len + 1).toString();
        this.push({ payload });
        buffer = buffer.slice(len + 1);
      }
      callback();
    },
    objectMode: true
  });
}

const pipeline = concatBuffers(byteStream()).pipe(protocolParser());

(async () => {
  console.log('Custom protocol pipeline started');
  for await (const msg of pipeline) {
    console.log(`[protocol] payload: ${msg.payload}`);
  }
  console.log('Pipeline complete!');
})();