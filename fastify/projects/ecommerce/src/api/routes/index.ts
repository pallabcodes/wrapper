/**
 * API Routes Setup
 * 
 * Centralized route registration for all API endpoints.
 * Includes authentication, products, orders, and health check routes.
 */

export const setupRoutes = async (app: any): Promise<void> => {
  // Health check endpoint
  app.get('/health', async () => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'ecommerce-api',
      version: '1.0.0'
    }
  })

  // API v1 prefix
  await app.register(async function (api: any) {
    // Product routes placeholder
    api.get('/products', async () => {
      return { message: 'Products endpoint - coming soon' }
    })

    // Auth routes placeholder  
    api.post('/auth/login', async () => {
      return { message: 'Login endpoint - coming soon' }
    })

    // Order routes placeholder
    api.get('/orders', async () => {
      return { message: 'Orders endpoint - coming soon' }
    })
  }, { prefix: '/api/v1' })
}
