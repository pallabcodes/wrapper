/**
 * Auth Middleware
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { createUnauthorizedResponse, createForbiddenResponse } from '../utils/responseWrapper'

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    createUnauthorizedResponse(res, 'No token provided')
    return
  }

  try {
    const user = jwt.verify(token, env.JWT_SECRET)
    ;(req as any).user = user
    next()
  } catch (error) {
    createForbiddenResponse(res, 'Invalid token')
    return
  }
}

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user
    if (!user || user.role !== role) {
      createForbiddenResponse(res, 'Insufficient permissions')
      return
    }
    next()
  }
}
