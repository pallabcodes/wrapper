/**
 * Swagger Utilities
 * 
 * Utility functions for OpenAPI specification building using functional programming patterns.
 */

import type { 
  OpenAPISpec, 
  OpenAPISchema, 
  SwaggerResult,
  RouteDefinition,
  OpenAPIPathItem,
  OpenAPIResponse
} from './types'
import { zodToOpenAPI } from './zodConverter'

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

// Functional utility for creating path item from route definition
export const createPathItem = (routeDef: RouteDefinition): OpenAPIPathItem => {
  const pathItem: OpenAPIPathItem = {
    summary: routeDef.summary,
    description: routeDef.description,
    tags: routeDef.tags,
    responses: {}
  }

  // Add request body if schema exists
  if (routeDef.requestBody) {
    pathItem.requestBody = {
      required: routeDef.requestBody.required,
      content: {
        'application/json': {
          schema: zodToOpenAPI(routeDef.requestBody.schema)
        }
      }
    }
  }

  // Add responses
  Object.entries(routeDef.responses).forEach(([code, response]) => {
    const apiResponse: OpenAPIResponse = {
      description: response.description
    }
    
    if (response.schema) {
      apiResponse.content = {
        'application/json': {
          schema: zodToOpenAPI(response.schema)
        }
      }
    }
    
    pathItem.responses[code] = apiResponse
  })

  // Add security if required
  if (routeDef.security) {
    pathItem.security = routeDef.security
  }

  return pathItem
}

// Re-export zodToOpenAPI for convenience
export { zodToOpenAPI }
