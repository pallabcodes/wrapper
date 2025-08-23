/**
 * httpLifecycleUtils: Functional HTTP lifecycle utilities for Fastify
 *
 * - Extracted and refactored from Fastify core (handleRequest.js)
 * - Pure FP: stateless, composable, higher-order
 * - Standard and advanced FP APIs
 * - Instantly readable, debuggable, and DX-friendly
 *
 * Where and When to Use:
 *   - Use in Fastify route handlers, plugins, or custom frameworks to manage the full HTTP request lifecycle.
 *   - Replace or extend Fastify's built-in lifecycle for custom validation, hooks, error handling, and response logic.
 *   - Ideal for microservices, APIs, and high-scale systems needing composable request processing.
 *
 * Example Usage:
 *   // In a Fastify route handler:
 *   const { handleRequestLifecycle } = require('./httpLifecycleUtils')
 *
 *   fastify.route({
 *     method: 'POST',
 *     url: '/upload',
 *     handler: (request, reply) => {
 *       handleRequestLifecycle({
 *         error: null,
 *         request,
 *         reply,
 *         validate: req => req.body && req.body.file ? null : new Error('Missing file'),
 *         preValidation: (req, rep, cb) => cb(null),
 *         preHandler: (req, rep, cb) => cb(null),
 *         handler: (req, rep) => ({ status: 'ok' }),
 *         send: (rep, result) => rep.send(result),
 *         wrapAsync: (promise, rep) => promise.then(data => rep.send(data)).catch(err => rep.send(err))
 *       })
 *     }
 *   })
 *
 *   // In a plugin or custom framework:
 *   // Compose lifecycle pipelines for authentication, logging, etc.
 *
 *   // For millions of requests: use in high-throughput APIs for predictable, debuggable request flow.
 */

// Standard API
/** Handles an HTTP request lifecycle (validation, hooks, reply). */
const handleRequestLifecycle = ({
  error,
  request,
  reply,
  validate,
  preValidation,
  preHandler,
  handler,
  send,
  wrapAsync
}) => {
  if (reply.sent) return
  if (error) {
    reply.isError = true
    send(error)
    return
  }
  // Pre-validation hook
  if (preValidation) {
    preValidation(request, reply, (err) => {
      if (err) {
        reply.isError = true
        send(err)
        return
      }
      runValidation()
    })
  } else {
    runValidation()
  }
  function runValidation() {
    const validationErr = validate ? validate(request) : null
    if (validationErr) {
      reply.isError = true
      send(validationErr)
      return
    }
    // Pre-handler hook
    if (preHandler) {
      preHandler(request, reply, (err) => {
        if (err) {
          reply.isError = true
          send(err)
          return
        }
        runHandler()
      })
    } else {
      runHandler()
    }
  }
  function runHandler() {
    let result
    try {
      result = handler(request, reply)
    } catch (err) {
      reply.isError = true
      send(err)
      return
    }
    if (result !== undefined) {
      if (result !== null && typeof result.then === 'function') {
        wrapAsync(result, reply)
      } else {
        send(result)
      }
    }
  }
}

// Advanced FP API (curried, point-free)
const fp = {
  handleRequestLifecycle: config => handleRequestLifecycle(config)
}

module.exports = {
  handleRequestLifecycle,
  fp
}
