/**
 * API Version Manager - Enterprise Grade
 * 
 * This is a functional approach to API versioning that provides:
 * - Type-safe version handling
 * - Functional composition of versioned routes
 * - Backward compatibility management
 * - Version deprecation warnings
 * 
 * Inspired by Stripe, PayPal, and Google's API versioning strategies.
 */

import { Router } from 'express'

// Functional type definitions for versioning
export type APIVersion = 'v1' | 'v2' | 'v3'
export type VersionStatus = 'active' | 'deprecated' | 'sunset'

// Version metadata with functional composition
export interface VersionMetadata {
  version: APIVersion
  status: VersionStatus
  introducedAt: string
  deprecatedAt?: string
  sunsetAt?: string
  breakingChanges: string[]
  newFeatures: string[]
}

// Functional version configuration
export const VERSION_CONFIG: Record<APIVersion, VersionMetadata> = {
  v1: {
    version: 'v1',
    status: 'active',
    introducedAt: '2024-01-01',
    breakingChanges: [],
    newFeatures: ['Basic authentication', 'User management']
  },
  v2: {
    version: 'v2',
    status: 'active',
    introducedAt: '2024-06-01',
    breakingChanges: ['Enhanced validation', 'Improved error responses'],
    newFeatures: ['Advanced filtering', 'Bulk operations', 'Webhooks']
  },
  v3: {
    version: 'v3',
    status: 'active',
    introducedAt: '2024-12-01',
    breakingChanges: ['GraphQL support', 'Real-time subscriptions'],
    newFeatures: ['GraphQL API', 'Real-time events', 'Advanced analytics']
  }
} as const

// Functional version validation
export const validateAPIVersion = (version: string): version is APIVersion => {
  return Object.keys(VERSION_CONFIG).includes(version)
}

// Functional version middleware factory
export const createVersionMiddleware = (supportedVersions: APIVersion[]) => {
  return (req: any, res: any, next: any) => {
    const requestedVersion = req.params.version || req.headers['x-api-version'] || 'v1'
    
    if (!validateAPIVersion(requestedVersion)) {
      return res.status(400).json({
        error: 'Unsupported API version',
        message: `Supported versions: ${supportedVersions.join(', ')}`,
        code: 'UNSUPPORTED_VERSION'
      })
    }

    const versionMeta = VERSION_CONFIG[requestedVersion]
    
    // Add version info to request context
    req.apiVersion = requestedVersion
    req.versionMetadata = versionMeta
    
    // Add deprecation warnings
    if (versionMeta.status === 'deprecated') {
      res.set('X-API-Deprecation-Warning', 
        `API version ${requestedVersion} is deprecated. Please upgrade to a newer version.`)
    }
    
    next()
  }
}

// Functional route versioning
export const createVersionedRoute = (
  version: APIVersion,
  path: string,
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  handler: any,
  middleware: any[] = []
) => {
  return {
    version,
    path,
    method,
    handler,
    middleware
  }
}

// Functional version router factory
export const createVersionRouter = (version: APIVersion) => {
  const router = Router()
  
  // Add version-specific middleware
  router.use((req: any, _res: any, next: any) => {
    req.apiVersion = version
    req.versionMetadata = VERSION_CONFIG[version]
    next()
  })
  
  return router
}

// Functional version composition
export const composeVersionedRoutes = (routes: Array<{
  version: APIVersion
  path: string
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  handler: any
  middleware?: any[]
}>) => {
  const versionRouters: Record<APIVersion, Router> = {
    v1: createVersionRouter('v1'),
    v2: createVersionRouter('v2'),
    v3: createVersionRouter('v3')
  }
  
  routes.forEach(route => {
    const router = versionRouters[route.version]
    const handlers = [...(route.middleware || []), route.handler]
    router[route.method](route.path, ...handlers)
  })
  
  return versionRouters
}

// Functional version info endpoint
export const createVersionInfoHandler = () => {
  return (req: any, res: any) => {
    const versions = Object.values(VERSION_CONFIG).map(meta => ({
      version: meta.version,
      status: meta.status,
      introducedAt: meta.introducedAt,
      deprecatedAt: meta.deprecatedAt,
      sunsetAt: meta.sunsetAt,
      breakingChanges: meta.breakingChanges,
      newFeatures: meta.newFeatures
    }))
    
    res.json({
      success: true,
      data: {
        versions,
        currentVersion: req.apiVersion || 'v1',
        latestVersion: 'v3',
        deprecationPolicy: {
          deprecatedVersions: versions.filter(v => v.status === 'deprecated'),
          sunsetVersions: versions.filter(v => v.status === 'sunset')
        }
      }
    })
  }
}
