/**
 * Zod to OpenAPI Converter
 * 
 * Functional utilities for converting Zod schemas to OpenAPI specifications.
 */

import { z } from 'zod'
import type { OpenAPISchema } from './types'

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
      return convertZodObject(zodSchema)
    }

    if (typeName === 'ZodString') {
      return convertZodString(zodSchema)
    }

    if (typeName === 'ZodNumber') {
      return { type: 'number' }
    }

    if (typeName === 'ZodBoolean') {
      return { type: 'boolean' }
    }

    if (typeName === 'ZodArray') {
      return convertZodArray(zodSchema)
    }

    if (typeName === 'ZodUnion') {
      return convertZodUnion(zodSchema)
    }

    if (typeName === 'ZodEnum') {
      return convertZodEnum(zodSchema)
    }

    // Default fallback
    return { type: 'string' }
  } catch (error) {
    console.warn('Error in zodToOpenAPI:', error)
    return { type: 'string' }
  }
}

const convertZodObject = (zodSchema: z.ZodTypeAny): OpenAPISchema => {
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

const convertZodString = (zodSchema: z.ZodTypeAny): OpenAPISchema => {
  const schema: OpenAPISchema = { type: 'string' }
  
  try {
    if (zodSchema._def.checks) {
      zodSchema._def.checks.forEach((check: { kind: string; value?: number }) => {
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

const convertZodArray = (zodSchema: z.ZodTypeAny): OpenAPISchema => {
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

const convertZodUnion = (_zodSchema: z.ZodTypeAny): OpenAPISchema => {
  try {
    return {
      type: 'string' // Fallback for union types
    }
  } catch (error) {
    console.warn('Error processing ZodUnion:', error)
    return { type: 'string' }
  }
}

const convertZodEnum = (zodSchema: z.ZodTypeAny): OpenAPISchema => {
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
