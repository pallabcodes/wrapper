/**
 * Server Configuration
 * 
 * Fastify server configuration for enterprise ecommerce platform
 */

import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'

// ============================================================================
// SERVER CONFIGURATION
// ============================================================================

export const createServer = (): FastifyInstance => {
  return Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      serializers: {
        req(request): Record<string, unknown> {
          return {
            method: request.method,
            url: request.url,
            headers: request.headers,
            hostname: request.hostname,
            remoteAddress: request.ip,
            remotePort: request.socket?.remotePort
          }
        },
        res(response): Record<string, unknown> {
          return {
            statusCode: response.statusCode,
            headers: response.getHeaders?.() ?? {}
          }
        }
      }
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: () => crypto.randomUUID(),
    trustProxy: true,
    disableRequestLogging: false
  })
}
