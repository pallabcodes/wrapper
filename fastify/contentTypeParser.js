/**
 * contentTypeParser: Functional content-type parsing utilities for Fastify
 *
 * - Standard API: clear, readable, composable
 * - Advanced FP API: curried, point-free, higher-order
 * - All names are descriptive and instantly understandable
 *
 * Example usage:
 *   const { isJSONType, isMultipartType, isFormType, parseContentType, createContentTypePipeline, fp } = require('./contentTypeParser')
 *   // Standard: isJSONType(ct)
 *   // Advanced: fp.isJSON()(ct)
 */

// Standard API
/** Checks if content-type is JSON. */
const isJSONType = ct => /application\/json/i.test(ct)
/** Checks if content-type is multipart. */
const isMultipartType = ct => /multipart\//i.test(ct)
/** Checks if content-type is form-urlencoded. */
const isFormType = ct => /application\/x-www-form-urlencoded/i.test(ct)
/** Parses content-type and returns type info. */
const parseContentType = ct => ({
  isJSON: isJSONType(ct),
  isMultipart: isMultipartType(ct),
  isForm: isFormType(ct),
  raw: ct
})
/** Composes content-type transformation functions into a pipeline. */
const createContentTypePipeline = fns => input => fns.reduce((acc, fn) => fn(acc), input)

// Advanced FP API (curried, point-free)
const fp = {
  isJSON: () => ct => /application\/json/i.test(ct),
  isMultipart: () => ct => /multipart\//i.test(ct),
  isForm: () => ct => /application\/x-www-form-urlencoded/i.test(ct),
  parse: () => ct => ({
    isJSON: /application\/json/i.test(ct),
    isMultipart: /multipart\//i.test(ct),
    isForm: /application\/x-www-form-urlencoded/i.test(ct),
    raw: ct
  }),
  createContentTypePipeline: (...fns) => input => fns.reduce((acc, fn) => fn(acc), input)
}

module.exports = {
  isJSONType,
  isMultipartType,
  isFormType,
  parseContentType,
  createContentTypePipeline,
  fp
}

