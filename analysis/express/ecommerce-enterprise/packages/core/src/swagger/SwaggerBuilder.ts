/**
 * Production-Grade Swagger Builder
 * 
 * This is a functional, type-safe approach to building OpenAPI specifications
 * without the verbose comment-based approach that Express.js typically uses.
 * 
 * Inspired by:
 * - Fastify's schema-first approach
 * - GraphQL's type system
 * - Railway-oriented programming patterns
 */

import { z } from 'zod'
import type { 
  OpenAPISpec, 
  OpenAPISchema, 
  SwaggerResult,
  RouteDefinition,
  OpenAPIInfo,
  OpenAPIServer 
} from './types'
import { 
  zodToOpenAPI, 
  createOpenAPISpec, 
  addPath, 
  addSchema,
  createPathItem
} from './utils'

// Swagger manager for Express.js using functional composition
export class SwaggerManager {
  private spec: OpenAPISpec

  constructor(info: OpenAPIInfo, servers: OpenAPIServer[] = []) {
    const result = createOpenAPISpec(info, servers)
    if (!result.success) {
      throw new Error(result.error)
    }
    this.spec = result.data
  }

  // Functional method for adding routes
  addRoute(route: RouteDefinition): this {
    const pathItem = createPathItem(route)
    const result = addPath(this.spec, route.path, route.method, pathItem)
    if (!result.success) {
      throw new Error(result.error)
    }
    this.spec = result.data
    return this
  }

  // Functional method for adding schemas
  addSchema(name: string, schema: OpenAPISchema): this {
    const result = addSchema(this.spec, name, schema)
    if (!result.success) {
      throw new Error(result.error)
    }
    this.spec = result.data
    return this
  }

  // Functional method for adding Zod schemas
  addZodSchema(name: string, zodSchema: z.ZodTypeAny): this {
    return this.addSchema(name, zodToOpenAPI(zodSchema))
  }

  // Get the current specification
  getSpec(): OpenAPISpec {
    return this.spec
  }

  // Convert to JSON string
  toJSON(): string {
    return JSON.stringify(this.spec, null, 2)
  }

  // Add common schemas
  addCommonSchemas(): this {
    // Common schemas can be added individually
    return this
  }

  // Add security schemes
  addSecuritySchemes(schemes: Record<string, any>): this {
    if (!this.spec.components) {
      this.spec.components = {}
    }
    if (!this.spec.components.securitySchemes) {
      this.spec.components.securitySchemes = {}
    }
    
    Object.entries(schemes).forEach(([name, scheme]) => {
      this.spec.components!.securitySchemes![name] = scheme
    })
    
    return this
  }

  // Add tags
  addTags(tags: Array<{ name: string; description?: string }>): this {
    if (!this.spec.tags) {
      this.spec.tags = []
    }
    this.spec.tags.push(...tags)
    return this
  }
}

// Export types and utilities for external use
export type { 
  OpenAPISpec, 
  OpenAPISchema, 
  SwaggerResult,
  RouteDefinition,
  OpenAPIInfo,
  OpenAPIServer 
}

export { 
  zodToOpenAPI, 
  createOpenAPISpec, 
  addPath, 
  addSchema,
  createPathItem
}
