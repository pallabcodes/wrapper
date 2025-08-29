/**
 * Versioned Swagger Generator - Enterprise Grade
 * 
 * This is a functional approach to generate versioned OpenAPI specifications
 * that supports multiple API versions with proper documentation.
 */

import { z } from 'zod'
import { generateOpenAPISpec } from './schemaRegistry'
import { authRoutes } from './authRoutes'
import { VERSION_CONFIG, APIVersion } from '../versioning/versionManager'

// Response schemas for version-specific endpoints
const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any()
})

const bulkOperationsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    operations: z.array(z.any()),
    analytics: z.any().optional()
  })
})

const webhookResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    webhookId: z.string(),
    realtime: z.boolean().optional()
  })
})

const realtimeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    events: z.array(z.any()),
    subscription: z.string()
  })
})

const analyticsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    metrics: z.any(),
    insights: z.array(z.any())
  })
})

const graphqlResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    query: z.string(),
    variables: z.any()
  })
})

// Functional version-specific route definitions
const createVersionedAuthRoutes = (version: APIVersion) => {
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

// Functional version info route
const createVersionInfoRoute = (version: APIVersion) => ({
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

// Functional versioned OpenAPI spec generator
export const generateVersionedOpenAPISpec = (version: APIVersion) => {
  const versionMeta = VERSION_CONFIG[version]
  const routes = [
    ...createVersionedAuthRoutes(version),
    createVersionInfoRoute(version)
  ]
  
  const spec = generateOpenAPISpec(routes)
  
  // Enhance with version-specific information
  return {
    ...spec,
    info: {
      ...spec.info,
      title: `Ecommerce Enterprise API - ${version.toUpperCase()}`,
      version: version,
      description: `${spec.info.description}\n\nVersion ${version} features: ${versionMeta.newFeatures.join(', ')}`,
      contact: {
        name: 'Enterprise Ecommerce Team',
        email: 'api@ecommerce-enterprise.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:3000/api/${version}`,
        description: `${version.toUpperCase()} Development server`
      },
      {
        url: `https://api.ecommerce-enterprise.com/api/${version}`,
        description: `${version.toUpperCase()} Production server`
      }
    ],
    tags: [
      {
        name: `Authentication (${version.toUpperCase()})`,
        description: `Authentication and authorization endpoints - ${version.toUpperCase()}`
      },
      {
        name: `System (${version.toUpperCase()})`,
        description: `System and utility endpoints - ${version.toUpperCase()}`
      },
      ...(version === 'v3' ? [{
        name: `GraphQL (${version.toUpperCase()})`,
        description: `GraphQL API endpoints - ${version.toUpperCase()}`
      }] : [])
    ],
    components: {
      ...spec.components,
      schemas: {
        [`VersionInfo${version.toUpperCase()}`]: {
          type: 'object',
          properties: {
            version: { type: 'string', example: version },
            status: { type: 'string', example: versionMeta.status },
            introducedAt: { type: 'string', example: versionMeta.introducedAt },
            newFeatures: { 
              type: 'array', 
              items: { type: 'string' },
              example: versionMeta.newFeatures
            },
            breakingChanges: { 
              type: 'array', 
              items: { type: 'string' },
              example: versionMeta.breakingChanges
            }
          }
        }
      }
    }
  }
}

// Functional multi-version OpenAPI spec generator
export const generateMultiVersionOpenAPISpec = () => {
  const versions: APIVersion[] = ['v1', 'v2', 'v3']
  const specs = versions.map(version => generateVersionedOpenAPISpec(version))
  
  return {
    openapi: '3.0.0',
    info: {
      title: 'Ecommerce Enterprise API - Multi-Version',
      version: '1.0.0',
      description: 'Complete API documentation for all versions',
      contact: {
        name: 'Enterprise Ecommerce Team',
        email: 'api@ecommerce-enterprise.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development server' },
      { url: 'https://api.ecommerce-enterprise.com', description: 'Production server' }
    ],
    paths: specs.reduce((acc, spec) => ({ ...acc, ...spec.paths }), {}),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: specs.reduce((acc, spec) => ({ ...acc, ...(spec.components.schemas || {}) }), {})
    },
    tags: specs.flatMap(spec => spec.tags || [])
  }
}
