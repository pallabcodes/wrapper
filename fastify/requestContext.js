/**
 * requestContext: Functional request context utilities for Fastify
 *
 * - Standard API: clear, readable, composable
 * - Advanced FP API: curried, point-free, higher-order
 * - All names are descriptive and instantly understandable
 *
 * Example usage:
 *   const { createContext, enrichContext, getContextValue, createRequestContextPipeline, fp } = require('./requestContext')
 *   // Standard: enrichContext(ctx, extra)
 *   // Advanced: fp.enrich(extra)(ctx)
 */

// Standard API
/** Creates a new context object. */
const createContext = (data = {}) => ({ ...data })
/** Enriches a context object with extra properties. */
const enrichContext = (ctx, extra) => ({ ...ctx, ...extra })
/** Gets a value from context by key. */
const getContextValue = (ctx, key) => ctx[key]
/** Composes context transformation functions into a pipeline. */
const createRequestContextPipeline = fns => input => fns.reduce((acc, fn) => fn(acc), input)

// Advanced FP API (curried, point-free)
const fp = {
  create: data => ({ ...data }),
  enrich: extra => ctx => ({ ...ctx, ...extra }),
  get: key => ctx => ctx[key],
  createRequestContextPipeline: (...fns) => input => fns.reduce((acc, fn) => fn(acc), input)
}

module.exports = {
  createContext,
  enrichContext,
  getContextValue,
  createRequestContextPipeline,
  fp
}
