/**
 * fileValidator: Functional file validation utilities for Fastify
 *
 * - Standard API: clear, readable, composable
 * - Advanced FP API: curried, point-free, higher-order
 * - All names are descriptive and instantly understandable
 *
 * Example usage:
 *   const { isFileSizeValid, isFileTypeValid, createFileValidationPipeline, fp } = require('./fileValidator')
 *   // Standard: isFileSizeValid(file, maxSize)
 *   // Advanced: fp.isFileSizeValid(maxSize)(file)
 */

// Standard API
/** Checks if file size is within maxSize. */
const isFileSizeValid = (file, maxSize) => file.size <= maxSize
/** Checks if file type is in allowed types. */
const isFileTypeValid = (file, types) => types.includes(file.type)
/** Composes file validation functions into a pipeline. */
const createFileValidationPipeline = fns => input => fns.reduce((acc, fn) => acc && fn(input), true)

// Advanced FP API (curried, point-free)
const fp = {
  isFileSizeValid: maxSize => file => file.size <= maxSize,
  isFileTypeValid: types => file => types.includes(file.type),
  createFileValidationPipeline: (...fns) => input => fns.reduce((acc, fn) => acc && fn(input), true)
}

module.exports = {
  isFileSizeValid,
  isFileTypeValid,
  createFileValidationPipeline,
  fp
}
