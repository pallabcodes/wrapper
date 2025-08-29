/**
 * Functional Swagger Generator - Enterprise Grade
 * 
 * This is a pure functional approach that composes route definitions
 * and generates OpenAPI specifications using our schema registry.
 */

import { generateOpenAPISpec as generateSpec } from './schemaRegistry'
import { authRoutes } from './authRoutes'

// Pure functional composition of all routes
const allRoutes = [
  ...authRoutes
  // Future: Add more route modules here
  // ...productRoutes,
  // ...orderRoutes,
  // ...paymentRoutes
]

// Main export - pure function with no side effects
export const generateOpenAPISpec = () => generateSpec(allRoutes)
