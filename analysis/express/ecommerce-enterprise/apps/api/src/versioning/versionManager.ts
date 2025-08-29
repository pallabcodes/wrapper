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

import { Router, Request, Response, NextFunction, RequestHandler } from 'express'
import { RouteDefinition } from '../swagger/schemaRegistry'
import { composeMiddlewareFromHelpers } from '../swagger/middlewareHelpers'
import { validateBody, authenticateToken } from '@ecommerce-enterprise/core'
import { authController } from '../auth/authController'

// Extend Express Request interface for version metadata
declare global {
  namespace Express {
    interface Request {
      apiVersion?: string
      versionMetadata?: VersionMetadata
    }
  }
}

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
export const createVersionMiddleware = (supportedVersions: APIVersion[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestedVersion = req.params['version'] || (Array.isArray(req.headers['x-api-version']) ? req.headers['x-api-version'][0] : req.headers['x-api-version']) || 'v1'
    
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
    
    return next()
  }
}

// Functional route versioning
export const createVersionedRoute = (
  version: APIVersion,
  path: string,
  method: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'use',
  handler: RequestHandler | Router,
  middleware: RequestHandler[] = []
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
  router.use((req: Request, _res: Response, next: NextFunction) => {
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
  method: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'use'
  handler: RequestHandler | Router
  middleware?: RequestHandler[]
}>) => {
  const versionRouters: Record<APIVersion, Router> = {
    v1: createVersionRouter('v1'),
    v2: createVersionRouter('v2'),
    v3: createVersionRouter('v3')
  }
  
  routes.forEach(route => {
    const router = versionRouters[route.version]
    if (route.method === 'use') {
      router.use(route.path, route.handler)
    } else {
      const handlers = [...(route.middleware || []), route.handler]
      router[route.method](route.path, ...handlers)
    }
  })
  
  return versionRouters
}

// Functional route definition composition (for individual routes with middleware)
export const composeRouteDefinitions = (routeDefinitions: RouteDefinition[], version: APIVersion) => {
  const router = createVersionRouter(version)
  
  routeDefinitions.forEach(routeDef => {
    const { path, method, middleware, middlewareHelpers, requestSchema, requiresAuth } = routeDef
    
    // Compose middleware from both direct and helper sources
    const allMiddleware: RequestHandler[] = []
    
    // Add validation middleware if requestSchema is provided
    if (requestSchema) {
      allMiddleware.push(validateBody(requestSchema))
    }
    
    // Add authentication middleware if required
    if (requiresAuth) {
      allMiddleware.push(authenticateToken)
    }
    
    // Add middleware from helpers if provided
    if (middlewareHelpers) {
      allMiddleware.push(...composeMiddlewareFromHelpers(middlewareHelpers))
    }
    
    // Add direct middleware if provided
    if (middleware) {
      allMiddleware.push(...middleware)
    }
    
    // Create handler based on route path - Simple, direct approach
    const handler: RequestHandler = (req, res) => {
      // Simple route matching - how internal teams do it
      // Extract the endpoint from the full path
      const endpoint = path.split('/').pop() || ''
      
      if (endpoint === 'register') {
        return authController.register(req, res)
      } else if (endpoint === 'login') {
        return authController.login(req, res)
      } else if (endpoint === 'logout') {
        return authController.logout(req, res)
      } else if (endpoint === 'refresh-token') {
        return authController.refreshToken(req, res)
      } else if (endpoint === 'forgot-password') {
        return authController.forgotPassword(req, res)
      } else if (endpoint === 'reset-password') {
        return authController.resetPassword(req, res)
      } else if (endpoint === 'verify-email') {
        return authController.verifyEmail(req, res)
      } else if (endpoint === 'me') {
        return authController.getProfile(req, res)
      } else if (endpoint === 'profile' && method === 'put') {
        return authController.updateProfile(req, res)
      } else if (endpoint === 'change-password') {
        return authController.changePassword(req, res)
      }
      
      // Default handler for other routes
      return res.json({
        success: true,
        message: `${method.toUpperCase()} ${path}`,
        data: { route: path, method, version }
      })
    }
    
    // Register the route with all middleware
    const handlers = [...allMiddleware, handler]
    if (method === 'get') router.get(path, ...handlers)
    else if (method === 'post') router.post(path, ...handlers)
    else if (method === 'put') router.put(path, ...handlers)
    else if (method === 'delete') router.delete(path, ...handlers)
    else if (method === 'patch') router.patch(path, ...handlers)
  })
  
  return router
}

// Functional version info endpoint
export const createVersionInfoHandler = () => {
  return (req: Request, res: Response) => {
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
