/**
 * Version-Specific Response Schemas
 * 
 * Response schemas for different API versions.
 * Kept separate to maintain file size limits.
 */

import { z } from 'zod'

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any()
})

// ============================================================================
// VERSION-SPECIFIC SCHEMAS
// ============================================================================

export const bulkOperationsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    operations: z.array(z.any()),
    analytics: z.any().optional()
  })
})

export const webhookResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    webhookId: z.string(),
    realtime: z.boolean().optional()
  })
})

export const realtimeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    events: z.array(z.any()),
    subscription: z.string()
  })
})

export const analyticsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    metrics: z.any(),
    insights: z.array(z.any())
  })
})

export const graphqlResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    query: z.string(),
    variables: z.any()
  })
})
