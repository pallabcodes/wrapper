/**
 * Validation Middleware
 */

import { Request, Response, NextFunction } from 'express'
// const { z } = require('zod')

export const validateBody = <T extends any>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = (schema as any).parse(req.body)
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

export const validateParams = <T extends any>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = (schema as any).parse(req.params)
      req.params = result
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
export const validateSchema = <T extends any>(schema: T, data: unknown): any => {
  return (schema as any).parse(data)
}
