/**
 * bufferUtils: Functional buffer and stream utilities for Fastify and Node.js
 *
 * - Standard API: clear, readable, composable
 * - Advanced FP API: curried, point-free, higher-order
 * - All names are descriptive and instantly understandable
 *
 * Example usage:
 *   const { concatBuffers, bufferToString, bufferToStream, isBufferType, getByteLength, createBufferPipeline, fp } = require('./bufferUtils')
 *   // Standard: concatBuffers([buf1, buf2])
 *   // Advanced: fp.concat(buf1)(buf2)
 */

// Standard API
/** Concatenates an array of buffers. */
const concatBuffers = buffers => Buffer.concat(buffers)
/** Converts a buffer to string with encoding. */
const bufferToString = (buffer, encoding = 'utf8') => buffer.toString(encoding)
/** Converts a buffer to a readable stream. */
const bufferToStream = buffer => require('stream').Readable.from(buffer)
/** Checks if value is a Buffer. */
const isBufferType = Buffer.isBuffer
/** Gets byte length of data with encoding. */
const getByteLength = (data, encoding = 'utf8') => Buffer.byteLength(data, encoding)
/** Composes buffer transformation functions into a pipeline. */
const createBufferPipeline = fns => input => fns.reduce((acc, fn) => fn(acc), input)

// Advanced FP API (curried, point-free)
const fp = {
  concat: buf1 => buf2 => Buffer.concat([buf1, buf2]),
  toString: encoding => buffer => buffer.toString(encoding),
  toStream: () => buffer => require('stream').Readable.from(buffer),
  isBuffer: () => Buffer.isBuffer,
  byteLength: encoding => data => Buffer.byteLength(data, encoding),
  createBufferPipeline: (...fns) => input => fns.reduce((acc, fn) => fn(acc), input)
}

module.exports = {
  concatBuffers,
  bufferToString,
  bufferToStream,
  isBufferType,
  getByteLength,
  createBufferPipeline,
  fp
}
