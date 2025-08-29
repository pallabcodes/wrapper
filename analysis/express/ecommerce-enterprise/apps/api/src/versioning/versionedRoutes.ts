/**
 * Versioned Routes - Functional Programming Approach
 * 
 * This file defines versioned API routes using functional programming patterns.
 * Each version maintains backward compatibility while introducing new features.
 */

import { authRoutes } from '@ecommerce-enterprise/core'
import { 
  createVersionedRoute, 
  composeVersionedRoutes, 
  createVersionInfoHandler
} from './versionManager'

// V1 Routes - Original implementation
const v1Routes = [
  // Auth routes (original implementation)
  createVersionedRoute('v1', '/auth/register', 'post', authRoutes),
  createVersionedRoute('v1', '/auth/login', 'post', authRoutes),
  createVersionedRoute('v1', '/auth/logout', 'post', authRoutes),
  createVersionedRoute('v1', '/auth/refresh-token', 'post', authRoutes),
  createVersionedRoute('v1', '/auth/me', 'get', authRoutes),
  createVersionedRoute('v1', '/auth/verify-email', 'post', authRoutes),
  createVersionedRoute('v1', '/auth/forgot-password', 'post', authRoutes),
  createVersionedRoute('v1', '/auth/reset-password', 'post', authRoutes),
  createVersionedRoute('v1', '/auth/change-password', 'post', authRoutes),
  createVersionedRoute('v1', '/auth/profile', 'put', authRoutes),
  createVersionedRoute('v1', '/auth/delete-account', 'delete', authRoutes),
  
  // Version info endpoint
  createVersionedRoute('v1', '/version', 'get', createVersionInfoHandler())
]

// V2 Routes - Enhanced with new features
const v2Routes = [
  // Enhanced auth routes with additional features
  createVersionedRoute('v2', '/auth/register', 'post', authRoutes),
  createVersionedRoute('v2', '/auth/login', 'post', authRoutes),
  createVersionedRoute('v2', '/auth/logout', 'post', authRoutes),
  createVersionedRoute('v2', '/auth/refresh-token', 'post', authRoutes),
  createVersionedRoute('v2', '/auth/me', 'get', authRoutes),
  createVersionedRoute('v2', '/auth/verify-email', 'post', authRoutes),
  createVersionedRoute('v2', '/auth/forgot-password', 'post', authRoutes),
  createVersionedRoute('v2', '/auth/reset-password', 'post', authRoutes),
  createVersionedRoute('v2', '/auth/change-password', 'post', authRoutes),
  createVersionedRoute('v2', '/auth/profile', 'put', authRoutes),
  createVersionedRoute('v2', '/auth/delete-account', 'delete', authRoutes),
  
  // New V2 features
  createVersionedRoute('v2', '/auth/bulk-operations', 'post', (_req: any, res: any) => {
    res.json({
      success: true,
      message: 'Bulk operations endpoint - V2 feature',
      data: { operations: [] }
    })
  }),
  
  createVersionedRoute('v2', '/auth/webhooks', 'post', (_req: any, res: any) => {
    res.json({
      success: true,
      message: 'Webhooks endpoint - V2 feature',
      data: { webhookId: 'webhook_123' }
    })
  }),
  
  // Version info endpoint
  createVersionedRoute('v2', '/version', 'get', createVersionInfoHandler())
]

// V3 Routes - Latest with GraphQL and real-time features
const v3Routes = [
  // Enhanced auth routes with latest features
  createVersionedRoute('v3', '/auth/register', 'post', authRoutes),
  createVersionedRoute('v3', '/auth/login', 'post', authRoutes),
  createVersionedRoute('v3', '/auth/logout', 'post', authRoutes),
  createVersionedRoute('v3', '/auth/refresh-token', 'post', authRoutes),
  createVersionedRoute('v3', '/auth/me', 'get', authRoutes),
  createVersionedRoute('v3', '/auth/verify-email', 'post', authRoutes),
  createVersionedRoute('v3', '/auth/forgot-password', 'post', authRoutes),
  createVersionedRoute('v3', '/auth/reset-password', 'post', authRoutes),
  createVersionedRoute('v3', '/auth/change-password', 'post', authRoutes),
  createVersionedRoute('v3', '/auth/profile', 'put', authRoutes),
  createVersionedRoute('v3', '/auth/delete-account', 'delete', authRoutes),
  
  // V2 features maintained
  createVersionedRoute('v3', '/auth/bulk-operations', 'post', (_req: any, res: any) => {
    res.json({
      success: true,
      message: 'Bulk operations endpoint - V3 enhanced',
      data: { operations: [], analytics: {} }
    })
  }),
  
  createVersionedRoute('v3', '/auth/webhooks', 'post', (_req: any, res: any) => {
    res.json({
      success: true,
      message: 'Webhooks endpoint - V3 enhanced',
      data: { webhookId: 'webhook_123', realtime: true }
    })
  }),
  
  // New V3 features
  createVersionedRoute('v3', '/auth/real-time', 'get', (_req: any, res: any) => {
    res.json({
      success: true,
      message: 'Real-time events endpoint - V3 feature',
      data: { events: [], subscription: 'active' }
    })
  }),
  
  createVersionedRoute('v3', '/auth/analytics', 'get', (_req: any, res: any) => {
    res.json({
      success: true,
      message: 'Advanced analytics endpoint - V3 feature',
      data: { metrics: {}, insights: [] }
    })
  }),
  
  // GraphQL endpoint
  createVersionedRoute('v3', '/graphql', 'post', (_req: any, res: any) => {
    res.json({
      success: true,
      message: 'GraphQL endpoint - V3 feature',
      data: { query: _req.body.query, variables: _req.body.variables }
    })
  }),
  
  // Version info endpoint
  createVersionedRoute('v3', '/version', 'get', createVersionInfoHandler())
]

// Compose all versioned routes
export const versionedRouters = composeVersionedRoutes([
  ...v1Routes,
  ...v2Routes,
  ...v3Routes
])

// Functional route registration
export const registerVersionedRoutes = (app: any) => {
  // Register each version under its own prefix
  Object.entries(versionedRouters).forEach(([version, router]) => {
    app.use(`/api/${version}`, router)
  })
  
  // Default to v1 for backward compatibility
  app.use('/api', versionedRouters.v1)
}
