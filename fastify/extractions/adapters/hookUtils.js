/**
 * hookUtils: Functional hook management for Fastify
 *
 * - Standard API: clear, readable, composable
 * - Advanced FP API: curried, point-free, higher-order
 * - All names are descriptive and instantly understandable
 *
 * Example usage:
 *   const { addHook, removeHook, listHookNames, createHookPipeline, fp } = require('./hookUtils')
 *   // Standard: addHook(hooks, name, fn)
 *   // Advanced: fp.addHook(name)(fn)(hooks)
 */

// Standard API
/** Adds a hook to the list. */
const addHook = (hooks, name, fn) => [...hooks, { name, fn }]
/** Removes a hook by name. */
const removeHook = (hooks, name) => hooks.filter(h => h.name !== name)
/** Lists all hook names. */
const listHookNames = hooks => hooks.map(h => h.name)
/** Composes hook transformation functions into a pipeline. */
const createHookPipeline = fns => input => fns.reduce((acc, fn) => fn(acc), input)

// Advanced FP API (curried, point-free)
const fp = {
  addHook: name => fn => hooks => [...hooks, { name, fn }],
  removeHook: name => hooks => hooks.filter(h => h.name !== name),
  listHookNames: () => hooks => hooks.map(h => h.name),
  createHookPipeline: (...fns) => input => fns.reduce((acc, fn) => fn(acc), input)
}

module.exports = {
  addHook,
  removeHook,
  listHookNames,
  createHookPipeline,
  fp
}
