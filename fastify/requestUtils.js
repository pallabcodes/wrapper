/**
 * requestUtils: Functional request object utilities for Fastify
 *
 * - Extracted and refactored from Fastify core (request.js)
 * - Pure FP: stateless, composable, higher-order
 * - Standard and advanced FP APIs
 * - Instantly readable, debuggable, and DX-friendly
 *
 * Where and When to Use:
 *   - Use in Fastify route handlers, plugins, or custom frameworks to access and manipulate request properties.
 *   - Ideal for APIs, microservices, and high-scale systems needing robust request utilities.
 *
 * Example Usage:
 *   const { getMethod, getUrl, getHeader, getParam, getQuery, getBody, validateInput, fp } = require('./requestUtils')
 *   // In a Fastify route handler:
 *   fastify.get('/user/:id', (request, reply) => {
 *     const method = getMethod(request)
 *     const userId = getParam(request, 'id')
 *     // ...
 *   })
 *
 *   // For millions of requests: use in high-throughput APIs for predictable, debuggable request flow.
 */

// Standard API
const getMethod = req => req.method
const getUrl = req => req.url
const getHeader = (req, key) => req.headers[key.toLowerCase()]
const getHeaders = req => req.headers
const getParam = (req, key) => req.params?.[key]
const getQuery = (req, key) => req.query?.[key]
const getBody = req => req.body
const getProtocol = req => req.protocol
const getHost = req => req.host
const getIp = req => req.ip
const getOriginalUrl = req => req.originalUrl
const getSocket = req => req.socket

// Validation utility
const validateInput = (input, schema, validator) => validator ? validator(input, schema) : true

// Decorator utilities
const getDecorator = (req, name) => typeof req[name] === 'function' ? req[name].bind(req) : req[name]
const setDecorator = (req, name, value) => { req[name] = value; return req }

// Advanced FP API (curried, point-free)
const fp = {
  getMethod: () => req => req.method,
  getUrl: () => req => req.url,
  getHeader: key => req => req.headers[key.toLowerCase()],
  getHeaders: () => req => req.headers,
  getParam: key => req => req.params?.[key],
  getQuery: key => req => req.query?.[key],
  getBody: () => req => req.body,
  getProtocol: () => req => req.protocol,
  getHost: () => req => req.host,
  getIp: () => req => req.ip,
  getOriginalUrl: () => req => req.originalUrl,
  getSocket: () => req => req.socket,
  validateInput: validator => schema => input => validator ? validator(input, schema) : true,
  getDecorator: name => req => typeof req[name] === 'function' ? req[name].bind(req) : req[name],
  setDecorator: name => value => req => { req[name] = value; return req }
}

module.exports = {
  getMethod,
  getUrl,
  getHeader,
  getHeaders,
  getParam,
  getQuery,
  getBody,
  getProtocol,
  getHost,
  getIp,
  getOriginalUrl,
  getSocket,
  validateInput,
  getDecorator,
  setDecorator,
  fp
}
