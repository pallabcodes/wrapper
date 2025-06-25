/**
 * Node.js Transform Stream Core - Repurposable Extraction
 *
 * This is the distilled, hacky, and ingenious core of Node.js's Transform stream.
 * It shows how Node composes duplex logic with a transform step between input and output.
 *
 * You can repurpose this pattern for any async data transformation pipeline (compression, encryption, parsing, etc).
 */

const { Duplex } = require('./duplex');

class Transform extends Duplex {
  constructor(options = {}) {
    super({
      ...options,
      readableObjectMode: !!options.objectMode,
      writableObjectMode: !!options.objectMode
    });
    
    // Ensure transform state is initialized
    this._transformState = {
      transforming: false,
      writechunk: null,
      writeencoding: null,
      writecb: null
    };

    // User-defined transform function
    this._transform = options.transform || this._transform;
    this._flush = options.flush || this._flush;
  }

  _write(chunk, encoding, callback) {
    const ts = this._transformState;
    
    try {
      this._transform(chunk, encoding, (err, transformed) => {
        if (err) {
          callback(err);
          return;
        }
        if (transformed !== undefined && transformed !== null) {
          this.push(transformed);
        }
        callback();
      });
    } catch (err) {
      callback(err);
    }
  }

  _transform(chunk, encoding, callback) {
    callback(new Error('_transform() must be implemented'));
  }

  _flush(callback) {
    callback();
  }

  end(chunk, encoding, cb) {
    const _cb = cb;
    if (chunk) {
      this.write(chunk, encoding, () => super.end(_cb));
    } else {
      super.end(_cb);
    }
  }
}

module.exports = { Transform };