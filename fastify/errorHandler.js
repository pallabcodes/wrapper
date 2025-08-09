/**
 * errorHandler: Functional error handling utilities for Fastify
 *
 * - Standard API: clear, readable, composable
 * - Advanced FP API: curried, point-free, higher-order
 * - All names are descriptive and instantly understandable
 *
 * Example usage:
 *   const { handleError, mapError, createErrorPipeline, fp } = require('./errorHandler')
 *   // Standard: handleError(err, handler)
 *   // Advanced: fp.handle(handler)(err)
 */

// Standard API
/** Handles an error using a handler function. */
const handleError = (err, handler) => handler(err)
/** Maps an error using a mapping function. */
const mapError = (err, mapFn) => mapFn(err)
/** Composes error transformation functions into a pipeline. */
const createErrorPipeline = fns => input => fns.reduce((acc, fn) => fn(acc), input)

// Advanced FP API (curried, point-free)
const fp = {
  handle: handler => err => handler(err),
  mapError: mapFn => err => mapFn(err),
  createErrorPipeline: (...fns) => input => fns.reduce((acc, fn) => fn(acc), input)
}

module.exports = {
  handleError,
  mapError,
  createErrorPipeline,
  fp
}
