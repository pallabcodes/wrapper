/**
 * Zod to OpenAPI Converter
 * 
 * Functional utilities for converting Zod schemas to OpenAPI specifications.
 */

import { z } from 'zod'
import type { OpenAPISchema } from './types'

// Type for accessing Zod's internal _def property
interface ZodDef {
  typeName?: string;
  shape?: () => Record<string, z.ZodSchema>;
  checks?: Array<{ kind: string; value?: number }>;
  type?: z.ZodSchema;
  values?: string[];
}

// Helper function to safely access Zod's internal _def property
const getZodDef = (schema: z.ZodSchema): ZodDef | null => {
  try {
    return (schema as unknown as { _def?: ZodDef })._def || null;
  } catch {
    return null;
  }
};

// Helper function to check if a Zod schema is optional
const isOptional = (schema: z.ZodSchema): boolean => {
  try {
    const def = getZodDef(schema);
    if (!def || !def.typeName) return false;
    return def.typeName === 'ZodOptional' || 
           def.typeName === 'ZodNullable' ||
           def.typeName === 'ZodDefault';
  } catch {
    return false
  }
}

// Functional utility for converting Zod schemas to OpenAPI schemas
export const zodToOpenAPI = (zodSchema: z.ZodSchema): OpenAPISchema => {
  try {
    // Defensive check for valid Zod schema
    const def = getZodDef(zodSchema);
    if (!def || !def.typeName) {
      console.warn('Invalid Zod schema provided to zodToOpenAPI:', zodSchema)
      return { type: 'string' }
    }

    const typeName = def.typeName

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

const convertZodObject = (zodSchema: z.ZodSchema): OpenAPISchema => {
  try {
    const def = getZodDef(zodSchema);
    if (!def || !def.shape) {
      return { type: 'object', properties: {} };
    }
    
    const shape = def.shape();
    const properties: Record<string, OpenAPISchema> = {}
    const required: string[] = []

    Object.entries(shape).forEach(([key, value]) => {
      try {
        properties[key] = zodToOpenAPI(value as z.ZodSchema)
        if (!isOptional(value as z.ZodSchema)) {
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

const convertZodString = (zodSchema: z.ZodSchema): OpenAPISchema => {
  const schema: OpenAPISchema = { type: 'string' }
  
  try {
    const def = getZodDef(zodSchema);
    if (def && def.checks) {
      def.checks.forEach((check) => {
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

const convertZodArray = (zodSchema: z.ZodSchema): OpenAPISchema => {
  try {
    const def = getZodDef(zodSchema);
    if (!def || !def.type) {
      return { type: 'array', items: { type: 'string' } };
    }
    return {
      type: 'array',
      items: zodToOpenAPI(def.type)
    }
  } catch (error) {
    console.warn('Error processing ZodArray:', error)
    return { type: 'array', items: { type: 'string' } }
  }
}

const convertZodUnion = (_zodSchema: z.ZodSchema): OpenAPISchema => {
  try {
    return {
      type: 'string' // Fallback for union types
    }
  } catch (error) {
    console.warn('Error processing ZodUnion:', error)
    return { type: 'string' }
  }
}

const convertZodEnum = (zodSchema: z.ZodSchema): OpenAPISchema => {
  try {
    const def = getZodDef(zodSchema);
    if (!def || !def.values) {
      return { type: 'string' };
    }
    return {
      type: 'string',
      enum: def.values
    }
  } catch (error) {
    console.warn('Error processing ZodEnum:', error)
    return { type: 'string' }
  }
}
