/**
 * Swagger Middleware for Express.js
 * 
 * Provides a clean, functional approach to serving OpenAPI documentation
 * without the verbose comment-based approach.
 */

import { Request, Response, NextFunction } from 'express'
import { SwaggerManager, RouteDefinition } from './SwaggerBuilder'
import { z } from 'zod'

// Express.js middleware factory
export const createSwaggerMiddleware = (
  swaggerManager: SwaggerManager,
  options: {
    uiPath?: string
    jsonPath?: string
    yamlPath?: string
  } = {}
) => {
  const {
    uiPath = '/api-docs',
    jsonPath = '/api-docs.json',
    yamlPath = '/api-docs.yaml'
  } = options

  const serveJson = (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerManager.toJSON())
  }

  const serveYaml = (_req: Request, res: Response) => {
    const yaml = require('js-yaml')
    const spec = swaggerManager.getSpec()
    const yamlString = yaml.dump(spec)
    
    res.setHeader('Content-Type', 'text/yaml')
    res.send(yamlString)
  }

  const serveUI = (_req: Request, res: Response) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="API Documentation" />
    <title>API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js" crossorigin></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: '${jsonPath}',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            });
        };
    </script>
</body>
</html>`
    
    res.setHeader('Content-Type', 'text/html')
    res.send(html)
  }

  const registerRoutes = (app: any) => {
    app.get(jsonPath, serveJson)
    app.get(yamlPath, serveYaml)
    app.get(uiPath, serveUI)
  }

  return {
    serveJson,
    serveYaml,
    serveUI,
    registerRoutes
  }
}

// High-level route registration helper
export const registerSwaggerRoute = (
  swaggerManager: SwaggerManager,
  route: RouteDefinition
) => {
  swaggerManager.addRoute(route)
  return route
}

// Express.js route decorator (functional approach)
export const swaggerRoute = (
  swaggerManager: SwaggerManager,
  routeDefinition: RouteDefinition
) => {
  // Register the route in Swagger
  swaggerManager.addRoute(routeDefinition)
  
  // Return a function that can be used as Express middleware
  return (req: Request, _res: Response, next: NextFunction) => {
    // Add route metadata to request for potential use
    req.swaggerRoute = routeDefinition
    next()
  }
}

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      swaggerRoute?: RouteDefinition
    }
  }
}

// Predefined route definitions for common patterns
export const createRouteDefinitions = {
  // Health check route
  health: (path: string = '/health'): RouteDefinition => ({
    path,
    method: 'get',
    summary: 'Health Check',
    description: 'Check if the service is healthy',
    tags: ['System'],
    responses: {
      '200': {
        description: 'Service is healthy',
        schema: z.object({
          status: z.string(),
          timestamp: z.string(),
          uptime: z.number()
        })
      }
    }
  }),

  // CRUD operations
  list: (path: string, resource: string, schema: z.ZodTypeAny): RouteDefinition => ({
    path,
    method: 'get',
    summary: `List ${resource}`,
    description: `Get a list of ${resource}`,
    tags: [resource],
    queryParams: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      sort: z.string().optional(),
      filter: z.string().optional()
    }),
    responses: {
      '200': {
        description: `List of ${resource}`,
        schema: z.object({
          data: z.array(schema),
          pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            pages: z.number()
          })
        })
      }
    }
  }),

  get: (path: string, resource: string, schema: z.ZodTypeAny): RouteDefinition => ({
    path,
    method: 'get',
    summary: `Get ${resource}`,
    description: `Get a single ${resource} by ID`,
    tags: [resource],
    pathParams: z.object({
      id: z.string()
    }),
    responses: {
      '200': {
        description: `${resource} found`,
        schema: schema
      },
      '404': {
        description: `${resource} not found`
      }
    }
  }),

  create: (path: string, resource: string, schema: z.ZodTypeAny): RouteDefinition => ({
    path,
    method: 'post',
    summary: `Create ${resource}`,
    description: `Create a new ${resource}`,
    tags: [resource],
    requestBody: schema,
    responses: {
      '201': {
        description: `${resource} created successfully`,
        schema: schema
      },
      '400': {
        description: 'Invalid input'
      }
    }
  }),

  update: (path: string, resource: string, schema: z.ZodTypeAny): RouteDefinition => ({
    path,
    method: 'put',
    summary: `Update ${resource}`,
    description: `Update an existing ${resource}`,
    tags: [resource],
    pathParams: z.object({
      id: z.string()
    }),
    requestBody: schema,
    responses: {
      '200': {
        description: `${resource} updated successfully`,
        schema: schema
      },
      '404': {
        description: `${resource} not found`
      }
    }
  }),

  delete: (path: string, resource: string): RouteDefinition => ({
    path,
    method: 'delete',
    summary: `Delete ${resource}`,
    description: `Delete a ${resource}`,
    tags: [resource],
    pathParams: z.object({
      id: z.string()
    }),
    responses: {
      '204': {
        description: `${resource} deleted successfully`
      },
      '404': {
        description: `${resource} not found`
      }
    }
  })
}
