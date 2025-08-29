/**
 * Functional Swagger Setup
 * 
 * This file provides a functional approach to setting up Swagger documentation
 * using the SwaggerBuilder instead of verbose comment-based definitions.
 */

import { SwaggerManager } from './SwaggerBuilder'
import { authSchemas } from '../modules/auth/authSchemas'
import { authRouteDefinitions } from '../modules/auth/authRoutes.types'

// Functional composition for creating Swagger manager
export const createSwaggerManager = (): SwaggerManager => {
  const swaggerManager = new SwaggerManager(
    {
      title: 'Ecommerce Enterprise API',
      version: '1.0.0',
      description: 'Enterprise-grade ecommerce API with functional programming patterns',
      contact: {
        name: 'Enterprise Ecommerce Team',
        email: 'api@ecommerce-enterprise.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.ecommerce-enterprise.com',
        description: 'Production server'
      }
    ]
  )

  // Add schemas using functional composition
  Object.entries(authSchemas).forEach(([name, schema]) => {
    swaggerManager.addZodSchema(name, schema)
  })

  // Add route definitions using functional composition
  authRouteDefinitions.forEach(route => {
    swaggerManager.addRoute(route)
  })

  return swaggerManager
}

// Functional middleware creator
export const createSwaggerMiddleware = (swaggerManager: SwaggerManager) => {
  return {
    serve: (_req: any, res: any) => {
      res.setHeader('Content-Type', 'application/json')
      res.send(swaggerManager.toJSON())
    },
    setup: (_swaggerSpec: any) => {
      return (_req: any, res: any) => {
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
export const registerSwaggerRoutes = (app: any, swaggerManager: SwaggerManager) => {
  const middleware = createSwaggerMiddleware(swaggerManager)
  
  // Serve OpenAPI spec
  app.get('/api-docs.json', middleware.serve)
  
  // Serve Swagger UI
  app.get('/api-docs', middleware.setup(swaggerManager.getSpec()))
  
  return app
}
