/**
 * Functional Schema Registry - Enterprise Grade
 * 
 * This is a pure functional approach that automatically generates
 * OpenAPI specifications from existing Zod schemas.
 * 
 * Inspired by GraphQL schema-first approaches and TypeScript compiler APIs.
 */

import { z } from 'zod'

// File upload configuration
export type FileUploadConfig = {
  fieldName: string
  isMultiple: boolean
  allowedMimeTypes?: string[]
  maxSize?: number // in bytes
  description?: string
}

// Functional type for route definition
export type RouteDefinition = {
  path: string
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  summary: string
  description: string
  tags: string[]
  requestSchema?: z.ZodTypeAny | undefined
  responseSchema: z.ZodTypeAny
  requiresAuth: boolean
  statusCodes: number[]
  fileUpload?: FileUploadConfig | undefined
}

// Functional utility to convert Zod to OpenAPI
const zodToOpenAPI = (schema: z.ZodTypeAny): any => {
  if (!schema || !schema._def) {
    return { type: 'string' }
  }

  const typeName = schema._def.typeName

  switch (typeName) {
    case 'ZodString':
      const stringSchema: any = { type: 'string' }
      if (schema._def.checks) {
        schema._def.checks.forEach((check: any) => {
          if (check.kind === 'email') stringSchema.format = 'email'
          if (check.kind === 'uuid') stringSchema.format = 'uuid'
          if (check.kind === 'datetime') stringSchema.format = 'date-time'
          if (check.kind === 'min') stringSchema.minLength = check.value
          if (check.kind === 'max') stringSchema.maxLength = check.value
        })
      }
      return stringSchema

    case 'ZodNumber':
      return { type: 'number' }

    case 'ZodBoolean':
      return { type: 'boolean' }

    case 'ZodObject':
      const shape = schema._def.shape()
      const properties: Record<string, any> = {}
      const required: string[] = []

      Object.entries(shape).forEach(([key, value]) => {
        properties[key] = zodToOpenAPI(value as z.ZodTypeAny)
        if ((value as z.ZodTypeAny)._def.typeName !== 'ZodOptional') {
          required.push(key)
        }
      })

      return {
        type: 'object',
        properties,
        ...(required.length > 0 && { required })
      }

    case 'ZodArray':
      return {
        type: 'array',
        items: zodToOpenAPI(schema._def.type)
      }

    default:
      return { type: 'string' }
  }
}

// Functional route builder
export const createRoute = (
  path: string,
  method: RouteDefinition['method'],
  summary: string,
  description: string,
  tags: string[],
  responseSchema: z.ZodTypeAny,
  requestSchema?: z.ZodTypeAny,
  requiresAuth = false,
  statusCodes = [200],
  fileUpload?: FileUploadConfig
): RouteDefinition => ({
  path,
  method,
  summary,
  description,
  tags,
  requestSchema,
  responseSchema,
  requiresAuth,
  statusCodes,
  fileUpload
})

// Functional OpenAPI path generator
const generatePathItem = (route: RouteDefinition): any => {
  const pathItem: any = {
    summary: route.summary,
    description: route.description,
    tags: route.tags,
    responses: {}
  }

  // Add request body if schema exists or file upload
  if (route.requestSchema || route.fileUpload) {
    pathItem.requestBody = {
      required: true,
      content: {}
    }

    // Add JSON schema if exists
    if (route.requestSchema) {
      pathItem.requestBody.content['application/json'] = {
        schema: zodToOpenAPI(route.requestSchema)
      }
    }

    // Add file upload schema if exists
    if (route.fileUpload) {
      const { fieldName, isMultiple, allowedMimeTypes, maxSize, description } = route.fileUpload
      
      pathItem.requestBody.content['multipart/form-data'] = {
        schema: {
          type: 'object',
          properties: {
            [fieldName]: {
              type: isMultiple ? 'array' : 'string',
              format: 'binary',
              description: description || `Upload ${isMultiple ? 'files' : 'file'}`,
              ...(isMultiple && {
                items: {
                  type: 'string',
                  format: 'binary'
                }
              })
            }
          },
          required: [fieldName]
        }
      }

      // Add file validation info
      if (allowedMimeTypes || maxSize) {
        pathItem.requestBody.content['multipart/form-data'].schema.properties[fieldName].description += 
          `\n\n**Validation:**` +
          (allowedMimeTypes ? `\n- Allowed types: ${allowedMimeTypes.join(', ')}` : '') +
          (maxSize ? `\n- Max size: ${(maxSize / 1024 / 1024).toFixed(1)}MB` : '')
      }
    }
  }

  // Add security for protected routes
  if (route.requiresAuth) {
    pathItem.security = [{ bearerAuth: [] }]
  }

  // Generate responses
  route.statusCodes.forEach(code => {
    const isSuccess = code >= 200 && code < 300
    const isError = code >= 400

    pathItem.responses[code] = {
      description: isSuccess ? 'Success' : isError ? 'Error' : 'Response',
      content: {
        'application/json': {
          schema: zodToOpenAPI(route.responseSchema)
        }
      }
    }
  })

  // Add common error responses
  if (route.requiresAuth) {
    pathItem.responses['401'] = {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    }
  }

  return pathItem
}

// Functional OpenAPI spec generator
export const generateOpenAPISpec = (routes: RouteDefinition[]) => {
  const paths: Record<string, any> = {}

  routes.forEach(route => {
    if (!paths[route.path]) {
      paths[route.path] = {}
    }
    paths[route.path][route.method] = generatePathItem(route)
  })

  return {
    openapi: '3.0.0',
    info: {
      title: 'Ecommerce Enterprise API',
      version: '1.0.0',
      description: 'Enterprise-grade ecommerce API with functional programming patterns'
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development server' }
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }
}
