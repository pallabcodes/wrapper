/**
 * Response Validation Schemas
 * 
 * Zod schemas for response validation
 */

import { z } from 'zod'

export const BaseResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional()
  }).optional(),
  meta: z.object({
    pagination: z.object({
      page: z.number(),
      limit: z.number(), 
      offset: z.number(),
      total: z.number().optional()
    }).optional(),
    timestamp: z.date(),
    requestId: z.string(),
    version: z.string()
  }).optional()
})

export const SuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.object({
      timestamp: z.date(),
      requestId: z.string(),
      version: z.string(),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        offset: z.number(),
        total: z.number().optional()
      }).optional()
    }).optional()
  })

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional()
  }),
  meta: z.object({
    timestamp: z.date(),
    requestId: z.string(),
    version: z.string()
  })
})

export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).optional()
})

export type ValidationResult<T> = {
  readonly success: boolean
  readonly data?: T
  readonly errors?: string[]
}
