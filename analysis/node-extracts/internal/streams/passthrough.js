/**
 * Node.js PassThrough Stream Core - Repurposable Extraction
 *
 * This is the distilled, hacky, and ingenious core of Node.js's PassThrough stream.
 * It is a Transform stream that simply passes input to output with no modification.
 *
 * You can repurpose this pattern as a base for monitoring, logging, throttling, or as a placeholder in pipelines.
 */

// Import the core Transform pattern
const { Transform } = require('./transform');

// The hack: PassThrough is just a Transform with identity _transform
class PassThrough extends Transform {
  _transform(chunk, encoding, callback) {
    // No transformation, just pass data through
    callback(null, chunk);
  }
}

module.exports = { PassThrough };

/*
Key takeaways for repurposing:
- PassThrough is a minimal Transform, useful for pipeline composition.
- You can subclass and override _transform for monitoring, logging, or throttling.
- This pattern is used internally for pipeline construction and as a placeholder in stream chains.
*/