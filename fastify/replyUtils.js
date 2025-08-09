/**
 * replyUtils: Functional reply/response utilities for Fastify
 *
 * - Extracted and refactored from Fastify core (reply.js)
 * - Pure FP: stateless, composable, higher-order
 * - Standard and advanced FP APIs
 * - Instantly readable, debuggable, and DX-friendly
 *
 * Example scenarios:
 *   - Efficiently send millions of HTTP responses with custom headers, trailers, and serialization
 *   - Compose reply pipelines for APIs, microservices, and plugins
 */

// Standard API
/** Sends a response payload, handling errors and serialization. */
const sendReply = ({ reply, payload, error, serializer, send, onError }) => {
  if (reply.sent) return
  if (error) {
    reply.isError = true
    onError(reply, error)
    return
  }
  let result = payload
  if (serializer) {
    result = serializer(payload)
  }
  send(reply, result)
}

/** Sets a header on the reply. */
const setHeader = (reply, key, value) => {
  reply.headers = reply.headers || {}
  reply.headers[key.toLowerCase()] = value
  return reply
}

/** Removes a header from the reply. */
const removeHeader = (reply, key) => {
  if (reply.headers) delete reply.headers[key.toLowerCase()]
  return reply
}

/** Sets the status code on the reply. */
const setStatusCode = (reply, code) => {
  reply.statusCode = code
  return reply
}

/** Serializes a payload using a provided function or JSON. */
const serializePayload = (payload, serializer) => serializer ? serializer(payload) : JSON.stringify(payload)

/** Redirects the reply to a URL. */
const redirectReply = (reply, url, code = 302, send) => {
  setHeader(reply, 'location', url)
  setStatusCode(reply, code)
  send(reply)
}

// Advanced FP API (curried, point-free)
const fp = {
  sendReply: config => sendReply(config),
  setHeader: key => value => reply => setHeader(reply, key, value),
  removeHeader: key => reply => removeHeader(reply, key),
  setStatusCode: code => reply => setStatusCode(reply, code),
  serializePayload: serializer => payload => serializePayload(payload, serializer),
  redirectReply: url => code => send => reply => redirectReply(reply, url, code, send)
}

module.exports = {
  sendReply,
  setHeader,
  removeHeader,
  setStatusCode,
  serializePayload,
  redirectReply,
  fp
}
