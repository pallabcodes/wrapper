/**
 * Functional Swagger Types
 */

import { z } from 'zod'

export interface OpenAPISchema {
  type: string
  properties?: Record<string, OpenAPISchema>
  required?: string[]
  items?: OpenAPISchema
  format?: string
  enum?: string[]
  minLength?: number
  maxLength?: number
}

export interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    version: string
    description: string
    contact?: {
      name: string
      email: string
    }
    license?: {
      name: string
      url: string
    }
  }
  servers: Array<{
    url: string
    description: string
  }>
  paths: Record<string, any>
  components: {
    securitySchemes: Record<string, any>
    schemas: Record<string, OpenAPISchema>
  }
  tags: Array<{
    name: string
    description: string
  }>
}

export interface RouteDefinition {
  path: string
  method: string
  summary: string
  description: string
  tags: string[]
  requestBody?: {
    required: boolean
    schema: z.ZodTypeAny
  } | undefined
  responses: Record<string, {
    description: string
    schema: z.ZodTypeAny
  }>
  security?: Array<{
    bearerAuth: string[]
  }> | undefined
}
