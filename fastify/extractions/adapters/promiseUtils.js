/**
 * promiseUtils: Functional promise utilities for Fastify
 *
 * - Standard API: clear, readable, composable
 * - Advanced FP API: curried, point-free, higher-order
 * - All names are descriptive and instantly understandable
 *
 * Example usage:
 *   const { resolvePromise, rejectPromise, allPromises, createPromisePipeline, fp } = require('./promiseUtils')
 *   // Standard: resolvePromise(value)
 *   // Advanced: fp.resolve(value)
 */

// Standard API
/** Resolves a value to a promise. */
const resolvePromise = Promise.resolve.bind(Promise)
/** Rejects a promise with a reason. */
const rejectPromise = Promise.reject.bind(Promise)
/** Resolves all promises in an array. */
const allPromises = Promise.all.bind(Promise)
/** Composes async transformation functions into a promise pipeline. */
const createPromisePipeline = fns => input => fns.reduce((acc, fn) => acc.then(fn), Promise.resolve(input))

// Advanced FP API (curried, point-free)
const fp = {
  resolve: value => Promise.resolve(value),
  reject: reason => Promise.reject(reason),
  all: promises => Promise.all(promises),
  createPromisePipeline: (...fns) => input => fns.reduce((acc, fn) => acc.then(fn), Promise.resolve(input))
}

module.exports = {
  resolvePromise,
  rejectPromise,
  allPromises,
  createPromisePipeline,
  fp
}
