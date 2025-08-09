/**
 * decoratorUtils: Functional decorator management for Fastify
 *
 * - Standard API: clear, readable, composable
 * - Advanced FP API: curried, point-free, higher-order
 * - All names are descriptive and instantly understandable
 *
 * Example usage:
 *   const { addDecorator, removeDecorator, listDecoratorNames, createDecoratorPipeline, fp } = require('./decoratorUtils')
 *   // Standard: addDecorator(decs, name, fn)
 *   // Advanced: fp.addDecorator(name)(fn)(decs)
 */

// Standard API
/** Adds a decorator to the list. */
const addDecorator = (decorators, name, fn) => [...decorators, { name, fn }]
/** Removes a decorator by name. */
const removeDecorator = (decorators, name) => decorators.filter(d => d.name !== name)
/** Lists all decorator names. */
const listDecoratorNames = decorators => decorators.map(d => d.name)
/** Composes decorator transformation functions into a pipeline. */
const createDecoratorPipeline = fns => input => fns.reduce((acc, fn) => fn(acc), input)

// Advanced FP API (curried, point-free)
const fp = {
  addDecorator: name => fn => decorators => [...decorators, { name, fn }],
  removeDecorator: name => decorators => decorators.filter(d => d.name !== name),
  listDecoratorNames: () => decorators => decorators.map(d => d.name),
  createDecoratorPipeline: (...fns) => input => fns.reduce((acc, fn) => fn(acc), input)
}

module.exports = {
  addDecorator,
  removeDecorator,
  listDecoratorNames,
  createDecoratorPipeline,
  fp
}
