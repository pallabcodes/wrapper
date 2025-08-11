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
/** Maps an error using a mapping function. */
const mapError = (err, mapFn) => mapFn(err)
/** Composes error transformation functions into a pipeline. */
const createErrorPipeline = fns => input => fns.reduce((acc, fn) => fn(acc), input)

// Advanced FP API (curried, point-free)
const fpUtils = {
  handle: handler => err => handler(err),
  mapError: mapFn => err => mapFn(err),
  createErrorPipeline: (...fns) => input => fns.reduce((acc, fn) => fn(acc), input)
}

/**
 * errorHandler: Functional error handling utilities for Fastify
 *
 * - Extracted and refactored from Fastify core (error-handler.js)
 * - Pure FP: stateless, composable, higher-order
 * - Standard and advanced FP APIs
 * - Instantly readable, debuggable, and DX-friendly
 *
 * Example Usage:
 *   const { handleError, fp } = require('./errorHandler')
 *   // Standard API:
 *   handleError(reply, error)
 *   // FP API:
 *   fp.handleError(reply)(error)
 */

// --- Standard API ---
const handleError = (reply, error) => {
  if (reply.sent) return
  reply.isError = true
  reply.send(error)
}

// --- Advanced FP API (curried, point-free) ---
const fp = {
  handleError: reply => error => handleError(reply, error)
}

module.exports = {
  handleError,
  fp,
  fpUtils
}
