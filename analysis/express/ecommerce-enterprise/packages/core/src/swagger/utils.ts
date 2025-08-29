/**
 * Swagger Utilities
 * 
 * Utility functions for OpenAPI specification building using functional programming patterns.
 */

import { z } from 'zod'
import type { 
  OpenAPISpec, 
  OpenAPISchema, 
  SwaggerResult,
  RouteDefinition,
  OpenAPIPathItem 
} from './types'

// Helper function to check if a Zod schema is optional
const isOptional = (schema: z.ZodTypeAny): boolean => {
  try {
    return schema._def.typeName === 'ZodOptional' || 
           schema._def.typeName === 'ZodNullable' ||
           schema._def.typeName === 'ZodDefault'
  } catch {
    return false
  }
}

// Functional utility for converting Zod schemas to OpenAPI schemas
export const zodToOpenAPI = (zodSchema: z.ZodTypeAny): OpenAPISchema => {
  try {
    // Defensive check for valid Zod schema
    if (!zodSchema || !zodSchema._def || !zodSchema._def.typeName) {
      console.warn('Invalid Zod schema provided to zodToOpenAPI:', zodSchema)
      return { type: 'string' }
    }

    const typeName = zodSchema._def.typeName

    if (typeName === 'ZodObject') {
      try {
        const shape = zodSchema._def.shape()
        const properties: Record<string, OpenAPISchema> = {}
        const required: string[] = []

        Object.entries(shape).forEach(([key, value]) => {
          try {
            properties[key] = zodToOpenAPI(value as z.ZodTypeAny)
            if (!isOptional(value as z.ZodTypeAny)) {
              required.push(key)
            }
          } catch (error) {
            console.warn(`Error processing property ${key}:`, error)
            properties[key] = { type: 'string' }
          }
        })

        return {
          type: 'object',
          properties,
          ...(required.length > 0 && { required })
        }
      } catch (error) {
        console.warn('Error processing ZodObject:', error)
        return { type: 'object', properties: {} }
      }
    }

    if (typeName === 'ZodString') {
      const schema: OpenAPISchema = { type: 'string' }
      
      try {
        if (zodSchema._def.checks) {
          zodSchema._def.checks.forEach((check: any) => {
            if (check.kind === 'email') {
              schema.format = 'email'
            } else if (check.kind === 'uuid') {
              schema.format = 'uuid'
            } else if (check.kind === 'datetime') {
              schema.format = 'date-time'
            }
          })
        }
      } catch (error) {
        console.warn('Error processing ZodString checks:', error)
      }
      
      return schema
    }

    if (typeName === 'ZodNumber') {
      return { type: 'number' }
    }

    if (typeName === 'ZodBoolean') {
      return { type: 'boolean' }
    }

    if (typeName === 'ZodArray') {
      try {
        return {
          type: 'array',
          items: zodToOpenAPI(zodSchema._def.type)
        }
      } catch (error) {
        console.warn('Error processing ZodArray:', error)
        return { type: 'array', items: { type: 'string' } }
      }
    }

    if (typeName === 'ZodEnum') {
      try {
        return {
          type: 'string',
          enum: zodSchema._def.values
        }
      } catch (error) {
        console.warn('Error processing ZodEnum:', error)
        return { type: 'string' }
      }
    }

    if (typeName === 'ZodUnion') {
      try {
        // For unions, we'll use the first type as a fallback
        return zodToOpenAPI(zodSchema._def.options[0])
      } catch (error) {
        console.warn('Error processing ZodUnion:', error)
        return { type: 'string' }
      }
    }

    // Default fallback
    return { type: 'string' }
  } catch (error) {
    console.error('Error in zodToOpenAPI:', error)
    return { type: 'string' }
  }
}

// Functional utility for creating OpenAPI specification
export const createOpenAPISpec = (
  info: OpenAPISpec['info'],
  servers: OpenAPISpec['servers'] = []
): SwaggerResult<OpenAPISpec> => {
  try {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info,
      servers,
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      tags: []
    }

    return { success: true, data: spec }
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to create OpenAPI spec: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

// Functional utility for adding paths to specification
export const addPath = (
  spec: OpenAPISpec,
  path: string,
  method: string,
  pathItem: OpenAPIPathItem
): SwaggerResult<OpenAPISpec> => {
  try {
    const newSpec = { ...spec }
    
    if (!newSpec.paths[path]) {
      newSpec.paths[path] = {}
    }
    
    newSpec.paths[path][method.toLowerCase()] = pathItem
    
    return { success: true, data: newSpec }
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to add path: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

// Functional utility for adding schemas to specification
export const addSchema = (
  spec: OpenAPISpec,
  name: string,
  schema: OpenAPISchema
): SwaggerResult<OpenAPISpec> => {
  try {
    const newSpec = { ...spec }
    
    if (!newSpec.components) {
      newSpec.components = {}
    }
    
    if (!newSpec.components.schemas) {
      newSpec.components.schemas = {}
    }
    
    newSpec.components.schemas[name] = schema
    
    return { success: true, data: newSpec }
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to add schema: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

// Functional utility for building route specifications
export const buildRouteSpec = (route: RouteDefinition): OpenAPIPathItem => {
  const pathItem: OpenAPIPathItem = {
    summary: route.summary,
    description: route.description,
    tags: route.tags,
    responses: {}
  }

  // Add request body if present
  if (route.requestBody) {
    pathItem.requestBody = {
      required: route.requestBody.required,
      content: {
        'application/json': {
          schema: zodToOpenAPI(route.requestBody.schema)
        }
      }
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

// Predefined schemas for common patterns
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
} as const
