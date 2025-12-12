/**
 * Validation Middleware
 */

import { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'

interface ZodParseable {
  parse: (data: unknown) => unknown;
}

export const validateBody = <T extends ZodSchema | ZodParseable>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = (schema as ZodParseable).parse(req.body)
      req.body = result
      next()
    } catch (error) {
      if (error && typeof error === 'object' && 'errors' in error) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        })
      } else {
        next(error)
      }
    }
  }
}

export const validateQuery = <T extends any>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = (schema as any).parse(req.query)
      req.query = result
      next()
    } catch (error) {
      if (error && typeof error === 'object' && 'errors' in error) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        })
      } else {
        next(error)
      }
    }
  }
}

export const validateParams = <T extends ZodSchema | ZodParseable>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = (schema as ZodParseable).parse(req.params)
      req.params = result as any
      next()
    } catch (error) {
      if (error && typeof error === 'object' && 'errors' in error) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        })
      } else {
        next(error)
      }
    }
  }
}

// Utility function for validation
export const validateSchema = <T extends ZodSchema | ZodParseable>(schema: T, data: unknown): unknown => {
  return (schema as ZodParseable).parse(data)
}
