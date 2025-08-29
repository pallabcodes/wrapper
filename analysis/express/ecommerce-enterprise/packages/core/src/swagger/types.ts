/**
 * OpenAPI Type Definitions
 * 
 * Core types for building OpenAPI specifications using functional programming patterns.
 */

import { z } from 'zod'

// Core OpenAPI specification types
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

export interface OpenAPIContact {
  name?: string
  email?: string
  url?: string
}

export interface OpenAPILicense {
  name: string
  url?: string
}

export interface OpenAPIServer {
  url: string
  description?: string
}

export interface OpenAPITag {
  name: string
  description?: string
}

// Path and operation types
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

// Schema types
export interface OpenAPISchema {
  type?: string
  format?: string
  items?: OpenAPISchema
  properties?: Record<string, OpenAPISchema>
  required?: string[]
  enum?: string[] | number[]
  default?: string | number | boolean
  example?: string | number | boolean | Record<string, unknown>
  $ref?: string
}

// Components types
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

// Route definition types
export interface RouteDefinition {
  path: string
  method: string
  summary: string
  description: string
  tags: string[]
  requestBody?: {
    required: boolean
    schema: z.ZodTypeAny
  }
  responses: Record<string, {
    description: string
    schema?: z.ZodTypeAny
  }>
  security?: OpenAPISecurityRequirement[]
  pathParams?: z.ZodTypeAny
}

// Result types for functional programming
export type SwaggerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
