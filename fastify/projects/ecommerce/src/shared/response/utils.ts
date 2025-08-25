/**
 * Response Utilities
 * 
 * Helper functions for response handling
 */

import type { FastifyReply } from 'fastify'
import type { PaginationParams, PaginationMeta } from './types.js'
import { ResponseBuilder } from './builder.js'

export const createResponseBuilder = <T = unknown>(
  reply: FastifyReply
): ResponseBuilder<T> => {
  return new ResponseBuilder<T>(reply)
}

export const calculatePagination = (
  params: PaginationParams,
  total?: number
): PaginationMeta => {
  const page = params.page || 1
  const limit = params.limit || 20
  const offset = params.offset ?? (page - 1) * limit

  return {
    page,
    limit,
    offset,
    ...(total !== undefined && { total })
  }
}

export const validatePaginationParams = (
  query: Record<string, unknown>
): PaginationParams => {
  const page = Number(query.page) || 1
  const limit = Math.min(Number(query.limit) || 20, 100)
  const offset = Number(query.offset) || (page - 1) * limit

  return { page, limit, offset }
}

export const formatErrorDetails = (
  error: unknown
): Record<string, unknown> => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  }
  
  if (typeof error === 'object' && error !== null) {
    return error as Record<string, unknown>
  }
  
  return { error: String(error) }
}

export const isSuccessResponse = <T>(
  response: unknown
): response is { success: true; data: T } => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === true &&
    'data' in response
  )
}

export const isErrorResponse = (
  response: unknown
): response is { success: false; error: unknown } => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false &&
    'error' in response
  )
}
