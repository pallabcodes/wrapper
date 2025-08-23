/**
 * Simple Fastify Extensions
 * 
 * Minimal extensions to Fastify's native APIs for better DX
 * while maintaining full compatibility and fallback support.
 */

import type { FastifyInstance, RouteOptions, FastifySchema } from 'fastify'

// ============================================================================
// SIMPLE ROUTE BUILDER (WRAPS NATIVE FASTIFY)
// ============================================================================

export class SimpleRouteBuilder {
  private fastify: FastifyInstance
  private currentRoute: Partial<RouteOptions> = {}

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify
  }

  // HTTP Methods
  get(url: string): this {
    this.currentRoute.method = 'GET'
    this.currentRoute.url = url
    return this
  }

  post(url: string): this {
    this.currentRoute.method = 'POST'
    this.currentRoute.url = url
    return this
  }

  put(url: string): this {
    this.currentRoute.method = 'PUT'
    this.currentRoute.url = url
    return this
  }

  patch(url: string): this {
    this.currentRoute.method = 'PATCH'
    this.currentRoute.url = url
    return this
  }

  delete(url: string): this {
    this.currentRoute.method = 'DELETE'
    this.currentRoute.url = url
    return this
  }

  // Route configuration
  schema(schema: FastifySchema): this {
    this.currentRoute.schema = schema
    return this
  }

  handler(handler: RouteOptions['handler']): this {
    this.currentRoute.handler = handler
    return this
  }

  preHandler(...handlers: any[]): this {
    this.currentRoute.preHandler = handlers
    return this
  }

  preValidation(...handlers: any[]): this {
    this.currentRoute.preValidation = handlers
    return this
  }

  // Register the route using native Fastify
  register(): this {
    try {
      // Use native Fastify route registration
      this.fastify.route(this.currentRoute as RouteOptions)
      
      // Reset for next route
      this.currentRoute = {}
      return this
    } catch (error) {
      // Fallback: log error and continue
      console.warn('Route registration failed:', error)
      return this
    }
  }
}

// ============================================================================
// SIMPLE DI (USES FASTIFY DECORATORS)
// ============================================================================

export class SimpleDI {
  private fastify: FastifyInstance
  private services = new Map<string, any>()

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify
  }

  // Register a service using Fastify decorators
  register<T extends Record<string, any>>(name: string, service: T): void {
    try {
      this.services.set(name, service)
      ;(this.fastify as any).decorate(name, service)
    } catch (error) {
      console.warn(`Failed to register service '${name}':`, error)
    }
  }

  // Get a service
  get<T>(name: string): T {
    return this.services.get(name) || (this.fastify as any)[name]
  }

  // Check if service exists
  has(name: string): boolean {
    return this.services.has(name) || (this.fastify as any)[name] !== undefined
  }
}

// ============================================================================
// FASTIFY EXTENSION
// ============================================================================

export const extendFastify = (fastify: FastifyInstance): FastifyInstance => {
  // Add route builder
  fastify.decorate('routeBuilder', new SimpleRouteBuilder(fastify))
  
  // Add simple DI
  fastify.decorate('di', new SimpleDI(fastify))

  return fastify
}

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare module 'fastify' {
  interface FastifyInstance {
    routeBuilder: SimpleRouteBuilder
    di: SimpleDI
  }
}
