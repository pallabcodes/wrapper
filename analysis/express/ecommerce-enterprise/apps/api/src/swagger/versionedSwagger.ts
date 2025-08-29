/**
 * Versioned Swagger Generator - Functional Approach
 * 
 * Critical business logic for generating versioned OpenAPI specifications.
 * Uses focused functional modules for maintainability.
 */

import { generateOpenAPISpec } from './schemaRegistry'
import { VERSION_CONFIG, APIVersion } from '../versioning/versionManager'
import {
  createVersionedAuthRoutes,
  createVersionedProductRoutes,
  createVersionedFileUploadRoutes,
  createVersionInfoRoute
} from './versionRouteCreators'

// ============================================================================
// MAIN GENERATOR FUNCTION
// ============================================================================

export const generateVersionedOpenAPISpec = (version: APIVersion) => {
  const versionMeta = VERSION_CONFIG[version]
  const routes = [
    ...createVersionedAuthRoutes(version),
    ...createVersionedProductRoutes(version),
    ...createVersionedFileUploadRoutes(version),
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
        name: `File Upload (${version.toUpperCase()})`,
        description: `File upload and processing endpoints - ${version.toUpperCase()}`
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

// ============================================================================
// MULTI-VERSION GENERATOR
// ============================================================================

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
