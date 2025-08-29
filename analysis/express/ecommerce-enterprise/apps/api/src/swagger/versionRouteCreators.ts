/**
 * Version-Specific Route Creators
 * 
 * Functional route creators for different API versions.
 * Kept separate to maintain file size limits.
 */

import { z } from 'zod'
import { authRoutes } from './authRoutes'
import { productRoutes } from './productRoutes'
import { fileUploadRoutes } from './fileUploadRoutes'
import { APIVersion } from '../versioning/versionManager'
import {
  successResponseSchema,
  bulkOperationsResponseSchema,
  webhookResponseSchema,
  realtimeResponseSchema,
  analyticsResponseSchema,
  graphqlResponseSchema
} from './versionSchemas'

// ============================================================================
// AUTH ROUTE CREATORS
// ============================================================================

export const createVersionedAuthRoutes = (version: APIVersion) => {
  const baseRoutes = authRoutes.map(route => ({
    ...route,
    path: route.path.replace('/api/v1', `/api/${version}`),
    tags: [`Authentication (${version.toUpperCase()})`]
  }))
  
  // Add version-specific features
  if (version === 'v2') {
    baseRoutes.push(
      {
        path: `/api/${version}/auth/bulk-operations`,
        method: 'post' as const,
        summary: 'Bulk operations (V2)',
        description: 'Perform bulk operations on multiple users',
        tags: [`Authentication (${version.toUpperCase()})`],
        requestSchema: undefined,
        responseSchema: bulkOperationsResponseSchema,
        requiresAuth: true,
        statusCodes: [200]
      },
      {
        path: `/api/${version}/auth/webhooks`,
        method: 'post' as const,
        summary: 'Webhooks (V2)',
        description: 'Manage webhook subscriptions',
        tags: [`Authentication (${version.toUpperCase()})`],
        requestSchema: undefined,
        responseSchema: webhookResponseSchema,
        requiresAuth: true,
        statusCodes: [200]
      }
    )
  }
  
  if (version === 'v3') {
    baseRoutes.push(
      {
        path: `/api/${version}/auth/bulk-operations`,
        method: 'post' as const,
        summary: 'Bulk operations (V3)',
        description: 'Enhanced bulk operations with analytics',
        tags: [`Authentication (${version.toUpperCase()})`],
        requestSchema: undefined,
        responseSchema: bulkOperationsResponseSchema,
        requiresAuth: true,
        statusCodes: [200]
      },
      {
        path: `/api/${version}/auth/webhooks`,
        method: 'post' as const,
        summary: 'Webhooks (V3)',
        description: 'Enhanced webhooks with real-time support',
        tags: [`Authentication (${version.toUpperCase()})`],
        requestSchema: undefined,
        responseSchema: webhookResponseSchema,
        requiresAuth: true,
        statusCodes: [200]
      },
      {
        path: `/api/${version}/auth/real-time`,
        method: 'get' as const,
        summary: 'Real-time events (V3)',
        description: 'Subscribe to real-time authentication events',
        tags: [`Authentication (${version.toUpperCase()})`],
        requestSchema: undefined,
        responseSchema: realtimeResponseSchema,
        requiresAuth: true,
        statusCodes: [200]
      },
      {
        path: `/api/${version}/auth/analytics`,
        method: 'get' as const,
        summary: 'Advanced analytics (V3)',
        description: 'Get advanced authentication analytics',
        tags: [`Authentication (${version.toUpperCase()})`],
        requestSchema: undefined,
        responseSchema: analyticsResponseSchema,
        requiresAuth: true,
        statusCodes: [200]
      },
      {
        path: `/api/${version}/graphql`,
        method: 'post' as const,
        summary: 'GraphQL API (V3)',
        description: 'GraphQL endpoint for advanced queries',
        tags: [`GraphQL (${version.toUpperCase()})`],
        requestSchema: undefined,
        responseSchema: graphqlResponseSchema,
        requiresAuth: false,
        statusCodes: [200]
      }
    )
  }
  
  return baseRoutes
}

// ============================================================================
// PRODUCT ROUTE CREATORS
// ============================================================================

export const createVersionedProductRoutes = (version: APIVersion) => {
  const baseRoutes = productRoutes.map(route => ({
    ...route,
    path: route.path.replace('/api/v1', `/api/${version}`),
    tags: [`Product Management (${version.toUpperCase()})`]
  }))
  
  // Add version-specific features
  if (version === 'v2') {
    baseRoutes.push(
      {
        path: `/api/${version}/products/bulk-operations`,
        method: 'post' as const,
        summary: 'Bulk operations (V2)',
        description: 'Perform bulk operations on multiple products',
        tags: [`Product Management (${version.toUpperCase()})`],
        requestSchema: undefined,
        responseSchema: bulkOperationsResponseSchema,
        requiresAuth: true,
        statusCodes: [200]
      },
      {
        path: `/api/${version}/products/analytics`,
        method: 'get' as const,
        summary: 'Product analytics (V2)',
        description: 'Get advanced product analytics',
        tags: [`Product Management (${version.toUpperCase()})`],
        requestSchema: undefined,
        responseSchema: analyticsResponseSchema,
        requiresAuth: true,
        statusCodes: [200]
      }
    )
  }
  
  if (version === 'v3') {
    baseRoutes.push(
      {
        path: `/api/${version}/products/realtime`,
        method: 'get' as const,
        summary: 'Real-time updates (V3)',
        description: 'Get real-time product updates via SSE',
        tags: [`Product Management (${version.toUpperCase()})`],
        requestSchema: undefined,
        responseSchema: realtimeResponseSchema,
        requiresAuth: true,
        statusCodes: [200]
      },
      {
        path: `/api/${version}/products/graphql`,
        method: 'post' as const,
        summary: 'GraphQL endpoint (V3)',
        description: 'GraphQL endpoint for product queries',
        tags: [`Product Management (${version.toUpperCase()})`],
        requestSchema: undefined,
        responseSchema: graphqlResponseSchema,
        requiresAuth: true,
        statusCodes: [200]
      }
    )
  }
  
  return baseRoutes
}

// ============================================================================
// FILE UPLOAD ROUTE CREATORS
// ============================================================================

export const createVersionedFileUploadRoutes = (version: APIVersion) => {
  const baseRoutes = fileUploadRoutes.map(route => ({
    ...route,
    path: route.path.replace('/api/v1', `/api/${version}`),
    tags: route.tags.map(tag => 
      tag === 'File Upload' ? `File Upload (${version.toUpperCase()})` : tag
    )
  }))
  
  // Add version-specific file upload features
  if (version === 'v2') {
    baseRoutes.push({
      path: `/api/${version}/upload/batch-process`,
      method: 'post' as const,
      summary: 'Batch file processing (V2)',
      description: 'Upload and process multiple files in batch with progress tracking',
      tags: [`File Upload (${version.toUpperCase()})`],
      requestSchema: undefined,
      responseSchema: successResponseSchema,
      requiresAuth: true,
      statusCodes: [200],
      fileUpload: {
        fieldName: 'batchFiles',
        isMultiple: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/csv'],
        maxSize: 200 * 1024 * 1024, // 200MB
        description: 'Batch upload multiple files for processing'
      }
    })
  }
  
  if (version === 'v3') {
    baseRoutes.push({
      path: `/api/${version}/upload/ai-analysis`,
      method: 'post' as const,
      summary: 'AI-powered file analysis (V3)',
      description: 'Upload files for AI-powered analysis and insights',
      tags: [`File Upload (${version.toUpperCase()})`],
      requestSchema: z.object({
        analysisType: z.enum(['ocr', 'image-recognition', 'document-classification']),
        priority: z.enum(['low', 'normal', 'high']).default('normal')
      }),
      responseSchema: successResponseSchema,
      requiresAuth: true,
      statusCodes: [200],
      fileUpload: {
        fieldName: 'files',
        isMultiple: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'],
        maxSize: 500 * 1024 * 1024, // 500MB
        description: 'Upload files for AI analysis'
      }
    })
  }
  
  return baseRoutes
}

// ============================================================================
// SYSTEM ROUTE CREATORS
// ============================================================================

export const createVersionInfoRoute = (version: APIVersion) => ({
  path: `/api/${version}/version`,
  method: 'get' as const,
  summary: `API Version Information (${version.toUpperCase()})`,
  description: `Get information about API version ${version}`,
  tags: [`System (${version.toUpperCase()})`],
  requestSchema: undefined,
  responseSchema: successResponseSchema,
  requiresAuth: false,
  statusCodes: [200]
})
