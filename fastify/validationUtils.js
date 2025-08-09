/**
 * validationUtils: Functional schema validation utilities for Fastify
 *
 * - Standard API: clear, readable, composable
 * - Advanced FP API: curried, point-free, higher-order
 * - All names are descriptive and instantly understandable
 *
 * Example usage:
 *   const { isValidTypeMatch, validateWith, createValidationPipeline, fp } = require('./validationUtils')
 *   // Standard: isValidTypeMatch(data, schema)
 *   // Advanced: fp.isValidTypeMatch(schema)(data)
 */

// Standard API
/**
 * Checks if all keys in data match the types specified in schema.
 * @param {Object} data - The object to validate.
 * @param {Object} schema - An object with key:type pairs (type as string).
 * @returns {boolean}
 */
const isValidTypeMatch = (data, schema) => {
  for (const key in schema) {
    if (typeof data[key] !== schema[key]) return false
  }
  return true
}

/**
 * Runs a custom validator function on data.
 * @param {Object} data - The object to validate.
 * @param {Function} validator - The validation function.
 * @returns {boolean}
 */
const validateWith = (data, validator) => validator(data)

/**
 * Composes multiple validation functions into a pipeline.
 * Each function should return a boolean; pipeline returns true only if all pass.
 * @param {Array<Function>} validators - Array of validation functions.
 * @returns {Function}
 */
const createValidationPipeline = validators => input => validators.reduce((acc, fn) => acc && fn(input), true)

// Advanced FP API (curried, point-free)
const fp = {
  isValidTypeMatch: schema => data => {
    for (const key in schema) {
      if (typeof data[key] !== schema[key]) return false
    }
    return true
  },
  validateWith: validator => data => validator(data),
  createValidationPipeline: (...validators) => input => validators.reduce((acc, fn) => acc && fn(input), true)
}

module.exports = {
  isValidTypeMatch,
  validateWith,
  createValidationPipeline,
  fp
}
