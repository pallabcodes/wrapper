/**
 * symbols: Functional symbol registry utilities for Fastify
 *
 * - Standard API: clear, readable, composable
 * - Advanced FP API: curried, point-free, higher-order
 * - All names are descriptive and instantly understandable
 *
 * Example usage:
 *   const { createSymbol, symbolRegistry, addSymbolToRegistry, createSymbolPipeline, fp } = require('./symbols')
 *   // Standard: addSymbolToRegistry(reg, desc)
 *   // Advanced: fp.addSymbol(desc)(reg)
 */

// Standard API
/** Creates a new symbol with description. */
const createSymbol = desc => Symbol(desc)
/** Symbol registry (array of symbols). */
const symbolRegistry = []
/** Adds a symbol to the registry. */
const addSymbolToRegistry = (reg, desc) => [...reg, createSymbol(desc)]
/** Composes symbol registry transformation functions into a pipeline. */
const createSymbolPipeline = fns => input => fns.reduce((acc, fn) => fn(acc), input)

// Advanced FP API (curried, point-free)
const fp = {
  createSymbol: desc => Symbol(desc),
  addSymbol: desc => reg => [...reg, Symbol(desc)],
  createSymbolPipeline: (...fns) => input => fns.reduce((acc, fn) => fn(acc), input)
}

module.exports = {
  createSymbol,
  symbolRegistry,
  addSymbolToRegistry,
  createSymbolPipeline,
  fp
}
