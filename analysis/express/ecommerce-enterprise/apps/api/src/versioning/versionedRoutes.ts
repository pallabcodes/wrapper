/**
 * Versioned Routes - Functional Programming Approach
 * 
 * This file defines versioned API routes using functional programming patterns.
 * Each version maintains backward compatibility while introducing new features.
 */

import { Request, Response, Application } from 'express'
import { authRouter } from '../auth/authRoutes'
import { 
  createVersionedRoute, 
  composeVersionedRoutes, 
  createVersionInfoHandler
} from './versionManager'

// V1 Routes - Original implementation
const v1Routes = [
  // Auth routes using direct Express router
  createVersionedRoute('v1', '/auth', 'use', authRouter),
  
  // Version info endpoint
  createVersionedRoute('v1', '/version', 'get', createVersionInfoHandler())
]

// V2 Routes - Enhanced with new features
const v2Routes = [
  // Use the auth router for all auth routes
  createVersionedRoute('v2', '/auth', 'use', authRouter),
  
  // New V2 features
  createVersionedRoute('v2', '/auth/bulk-operations', 'post', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Bulk operations endpoint - V2 feature',
      data: { operations: [] }
    })
  }),
  
  createVersionedRoute('v2', '/auth/webhooks', 'post', (_req: Request, res: Response) => {
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
  // Use the auth router for all auth routes
  createVersionedRoute('v3', '/auth', 'use', authRouter),
  
  // V2 features maintained
  createVersionedRoute('v3', '/auth/bulk-operations', 'post', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Bulk operations endpoint - V3 enhanced',
      data: { operations: [], analytics: {} }
    })
  }),
  
  createVersionedRoute('v3', '/auth/webhooks', 'post', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Webhooks endpoint - V3 enhanced',
      data: { webhookId: 'webhook_123', realtime: true }
    })
  }),
  
  // New V3 features
  createVersionedRoute('v3', '/auth/real-time', 'get', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Real-time events endpoint - V3 feature',
      data: { events: [], subscription: 'active' }
    })
  }),
  
  createVersionedRoute('v3', '/auth/analytics', 'get', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Advanced analytics endpoint - V3 feature',
      data: { metrics: {}, insights: [] }
    })
  }),
  
  // GraphQL endpoint
  createVersionedRoute('v3', '/graphql', 'post', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'GraphQL endpoint - V3 feature',
      data: { query: req.body.query, variables: req.body.variables }
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
export const registerVersionedRoutes = (app: Application) => {
  // Register each version under its own prefix
  Object.entries(versionedRouters).forEach(([version, router]) => {
    app.use(`/api/${version}`, router)
  })
  
  // Default to v1 for backward compatibility
  app.use('/api', versionedRouters.v1)
}
