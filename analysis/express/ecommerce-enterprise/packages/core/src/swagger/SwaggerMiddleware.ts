/**
 * Swagger Middleware for Express.js
 * 
 * This file provides middleware and utilities for integrating Swagger documentation
 * with Express.js applications using functional programming patterns.
 */

import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { SwaggerManager, RouteDefinition } from './SwaggerBuilder'
import { zodToOpenAPI } from './zodConverter'

// Functional middleware creator
export const createSwaggerMiddleware = (
  swaggerManager: SwaggerManager
) => {
  return {
    serve: (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json')
      res.send(swaggerManager.toJSON())
    },
    setup: (_swaggerSpec: any) => {
      return (_req: Request, res: Response) => {
        res.setHeader('Content-Type', 'text/html')
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Ecommerce Enterprise API</title>
            <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
          </head>
          <body>
            <div id="swagger-ui"></div>
            <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js" crossorigin></script>
            <script>
              window.ui = SwaggerUIBundle({
                url: '/api-docs.json',
                dom_id: '#swagger-ui',
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
                ],
                plugins: [
                  SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
              });
            </script>
          </body>
          </html>
        `)
      }
    }
  }
}

// Functional route registration
export const registerSwaggerRoute = (
  swaggerManager: SwaggerManager,
  route: RouteDefinition
) => {
  swaggerManager.addRoute(route)
}

// Functional route decorator
export const swaggerRoute = (
  swaggerManager: SwaggerManager,
  routeDefinition: RouteDefinition
) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Register the route in Swagger
    swaggerManager.addRoute(routeDefinition)
    
    // Add route metadata to request for potential use
    req.swaggerRoute = routeDefinition
    
    next()
  }
}

// Extend Request interface for Swagger metadata
declare global {
  namespace Express {
    interface Request {
      swaggerRoute?: RouteDefinition
    }
  }
}

// Functional CRUD route generators
export const createRouteDefinitions = {
  list: (path: string, resource: string, schema: z.ZodSchema): RouteDefinition => ({
    path,
    method: 'get',
    summary: `List ${resource}`,
    description: `Get a list of ${resource}`,
    tags: [resource],
    responses: {
      '200': {
        description: `List of ${resource}`,
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: zodToOpenAPI(schema)
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                pages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }),

  get: (path: string, resource: string, schema: z.ZodSchema): RouteDefinition => ({
    path,
    method: 'get',
    summary: `Get ${resource}`,
    description: `Get a single ${resource} by ID`,
    tags: [resource],
    pathParams: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    },
    responses: {
      '200': {
        description: `${resource} found`,
        schema: zodToOpenAPI(schema) as any
      },
      '404': {
        description: `${resource} not found`
      }
    }
  }),

  create: (path: string, resource: string, schema: z.ZodSchema): RouteDefinition => ({
    path,
    method: 'post',
    summary: `Create ${resource}`,
    description: `Create a new ${resource}`,
    tags: [resource],
    requestBody: {
      required: true,
      schema: zodToOpenAPI(schema)
    },
    responses: {
      '201': {
        description: `${resource} created successfully`,
        schema: zodToOpenAPI(schema) as any
      },
      '400': {
        description: 'Invalid input'
      }
    }
  }),

  update: (path: string, resource: string, schema: z.ZodSchema): RouteDefinition => ({
    path,
    method: 'put',
    summary: `Update ${resource}`,
    description: `Update an existing ${resource}`,
    tags: [resource],
    pathParams: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    },
    requestBody: {
      required: true,
      schema: zodToOpenAPI(schema)
    },
    responses: {
      '200': {
        description: `${resource} updated successfully`,
        schema: zodToOpenAPI(schema) as any
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
    pathParams: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    },
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
