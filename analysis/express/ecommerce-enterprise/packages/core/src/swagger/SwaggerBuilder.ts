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

// Core types for building OpenAPI specs
export interface OpenAPISpec {
  openapi: string
  info: OpenAPIInfo
  servers: OpenAPIServer[]
  paths: Record<string, Record<string, OpenAPIPathItem>>
  components?: OpenAPIComponents
  tags?: OpenAPITag[]
}

export interface OpenAPIInfo {
  title: string
  version: string
  description?: string
  contact?: OpenAPIContact
  license?: OpenAPILicense
}

export interface OpenAPIServer {
  url: string
  description?: string
}

export interface OpenAPIPathItem {
  summary?: string
  description?: string
  tags?: string[]
  parameters?: OpenAPIParameter[]
  requestBody?: OpenAPIRequestBody
  responses: Record<string, OpenAPIResponse>
  security?: OpenAPISecurityRequirement[]
}

export interface OpenAPIParameter {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  required?: boolean
  schema: OpenAPISchema
  description?: string
}

export interface OpenAPIRequestBody {
  required?: boolean
  content: Record<string, OpenAPIMediaType>
}

export interface OpenAPIMediaType {
  schema: OpenAPISchema
  example?: any
}

export interface OpenAPIResponse {
  description: string
  content?: Record<string, OpenAPIMediaType>
  headers?: Record<string, OpenAPIHeader>
}

export interface OpenAPIHeader {
  schema: OpenAPISchema
  description?: string
}

export interface OpenAPISchema {
  type?: string
  format?: string
  items?: OpenAPISchema
  properties?: Record<string, OpenAPISchema>
  required?: string[]
  enum?: any[]
  default?: any
  example?: any
  $ref?: string
}

export interface OpenAPIComponents {
  schemas?: Record<string, OpenAPISchema>
  securitySchemes?: Record<string, OpenAPISecurityScheme>
}

export interface OpenAPISecurityScheme {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect'
  scheme?: string
  bearerFormat?: string
  name?: string
  in?: string
}

export interface OpenAPISecurityRequirement {
  [key: string]: string[]
}

export interface OpenAPITag {
  name: string
  description?: string
}

export interface OpenAPIContact {
  name?: string
  url?: string
  email?: string
}

export interface OpenAPILicense {
  name: string
  url?: string
}

// Functional builders using Railway-oriented programming
export type SwaggerResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string }

// Core builder functions
export const createOpenAPISpec = (
  info: OpenAPIInfo,
  servers: OpenAPIServer[] = []
): SwaggerResult<OpenAPISpec> => {
  try {
    return {
      success: true,
      data: {
        openapi: '3.0.3',
        info,
        servers,
        paths: {},
        components: {
          schemas: {},
          securitySchemes: {}
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to create OpenAPI spec: ${error}`
    }
  }
}

export const addPath = (
  spec: OpenAPISpec,
  path: string,
  method: string,
  pathItem: OpenAPIPathItem
): SwaggerResult<OpenAPISpec> => {
  try {
    const updatedSpec = { ...spec }
    if (!updatedSpec.paths[path]) {
      updatedSpec.paths[path] = {}
    }
    updatedSpec.paths[path][method.toLowerCase()] = pathItem
    return { success: true, data: updatedSpec }
  } catch (error) {
    return {
      success: false,
      error: `Failed to add path: ${error}`
    }
  }
}

export const addSchema = (
  spec: OpenAPISpec,
  name: string,
  schema: OpenAPISchema
): SwaggerResult<OpenAPISpec> => {
  try {
    const updatedSpec = { ...spec }
    if (!updatedSpec.components) {
      updatedSpec.components = { schemas: {}, securitySchemes: {} }
    }
    if (!updatedSpec.components.schemas) {
      updatedSpec.components.schemas = {}
    }
    updatedSpec.components.schemas[name] = schema
    return { success: true, data: updatedSpec }
  } catch (error) {
    return {
      success: false,
      error: `Failed to add schema: ${error}`
    }
  }
}

// Zod to OpenAPI schema converter
export const zodToOpenAPI = (zodSchema: z.ZodTypeAny): OpenAPISchema => {
  if (zodSchema instanceof z.ZodString) {
    return { type: 'string' }
  }
  if (zodSchema instanceof z.ZodNumber) {
    return { type: 'number' }
  }
  if (zodSchema instanceof z.ZodBoolean) {
    return { type: 'boolean' }
  }
  if (zodSchema instanceof z.ZodArray) {
    return {
      type: 'array',
      items: zodToOpenAPI(zodSchema.element)
    }
  }
  if (zodSchema instanceof z.ZodObject) {
    const shape = zodSchema.shape
    const properties: Record<string, OpenAPISchema> = {}
    const required: string[] = []

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToOpenAPI(value as z.ZodTypeAny)
      if (!(value instanceof z.ZodOptional)) {
        required.push(key)
      }
    }

    return {
      type: 'object',
      properties,
      ...(required.length > 0 && { required })
    }
  }
  if (zodSchema instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: zodSchema._def.values
    }
  }
  if (zodSchema instanceof z.ZodOptional) {
    return zodToOpenAPI(zodSchema.unwrap())
  }

  return { type: 'string' } // fallback
}

// High-level route builder
export interface RouteDefinition {
  path: string
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  summary: string
  description?: string
  tags?: string[]
  requestBody?: z.ZodTypeAny
  queryParams?: z.ZodTypeAny
  pathParams?: z.ZodTypeAny
  responses: Record<string, {
    description: string
    schema?: z.ZodTypeAny
  }>
  security?: OpenAPISecurityRequirement[]
}

export const buildRouteSpec = (route: RouteDefinition): OpenAPIPathItem => {
  const pathItem: OpenAPIPathItem = {
    summary: route.summary,
    responses: {},
    ...(route.description && { description: route.description }),
    ...(route.tags && { tags: route.tags }),
    ...(route.security && { security: route.security })
  }

  // Add request body
  if (route.requestBody) {
    pathItem.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: zodToOpenAPI(route.requestBody)
        }
      }
    }
  }

  // Add query parameters
  if (route.queryParams) {
    const querySchema = zodToOpenAPI(route.queryParams)
    if (querySchema.type === 'object' && querySchema.properties) {
      pathItem.parameters = Object.entries(querySchema.properties).map(([name, schema]) => ({
        name,
        in: 'query' as const,
        required: querySchema.required?.includes(name) || false,
        schema,
        description: `Query parameter: ${name}`
      }))
    }
  }

  // Add path parameters
  if (route.pathParams) {
    const pathSchema = zodToOpenAPI(route.pathParams)
    if (pathSchema.type === 'object' && pathSchema.properties) {
      const pathParams = Object.entries(pathSchema.properties).map(([name, schema]) => ({
        name,
        in: 'path' as const,
        required: true,
        schema,
        description: `Path parameter: ${name}`
      }))
      pathItem.parameters = [...(pathItem.parameters || []), ...pathParams]
    }
  }

  // Add responses
  for (const [code, response] of Object.entries(route.responses)) {
    pathItem.responses[code] = {
      description: response.description,
      ...(response.schema && {
        content: {
          'application/json': {
            schema: zodToOpenAPI(response.schema)
          }
        }
      })
    }
  }

  return pathItem
}

// Swagger manager for Express.js
export class SwaggerManager {
  private spec: OpenAPISpec

  constructor(info: OpenAPIInfo, servers: OpenAPIServer[] = []) {
    const result = createOpenAPISpec(info, servers)
    if (!result.success) {
      throw new Error(result.error)
    }
    this.spec = result.data
  }

  addRoute(route: RouteDefinition): this {
    const pathItem = buildRouteSpec(route)
    const result = addPath(this.spec, route.path, route.method, pathItem)
    if (!result.success) {
      throw new Error(result.error)
    }
    this.spec = result.data
    return this
  }

  addSchema(name: string, schema: OpenAPISchema): this {
    const result = addSchema(this.spec, name, schema)
    if (!result.success) {
      throw new Error(result.error)
    }
    this.spec = result.data
    return this
  }

  addZodSchema(name: string, zodSchema: z.ZodTypeAny): this {
    return this.addSchema(name, zodToOpenAPI(zodSchema))
  }

  getSpec(): OpenAPISpec {
    return this.spec
  }

  toJSON(): string {
    return JSON.stringify(this.spec, null, 2)
  }
}

// Predefined schemas
export const commonSchemas = {
  error: {
    type: 'object',
    properties: {
      error: { type: 'string' },
      message: { type: 'string' },
      code: { type: 'string' },
      timestamp: { type: 'string', format: 'date-time' }
    },
    required: ['error', 'message']
  },
  success: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: { type: 'object' },
      message: { type: 'string' }
    },
    required: ['success']
  }
}
