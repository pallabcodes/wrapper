/**
 * Response Transformers - Functional Programming Approach
 * 
 * Functional transformers for customizing and modifying responses.
 * Kept separate to maintain file size limits.
 */

import type { BaseResponse } from './responseMapper'

// ============================================================================
// RESPONSE TRANSFORMERS
// ============================================================================

export const withPagination = <T>(
  response: BaseResponse & { data?: T },
  page: number,
  limit: number,
  total: number
) => ({
  ...response,
  meta: {
    ...response.meta,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
})

export const withFilters = <T>(
  response: BaseResponse & { data?: T },
  filters: Record<string, any>
) => ({
  ...response,
  meta: {
    ...response.meta,
    filters
  }
})

export const withSorting = <T>(
  response: BaseResponse & { data?: T },
  field: string,
  direction: 'asc' | 'desc'
) => ({
  ...response,
  meta: {
    ...response.meta,
    sorting: { field, direction }
  }
})

export const withCache = <T>(
  response: BaseResponse & { data?: T },
  ttl?: number
) => ({
  ...response,
  meta: {
    ...response.meta,
    cache: {
      cached: true,
      ttl
    }
  }
})

// ============================================================================
// HIGHER-ORDER TRANSFORMER
// ============================================================================

export const transformResponse = <T>(
  baseResponse: BaseResponse & { data?: T },
  ...transformers: Array<(response: BaseResponse & { data?: T }) => BaseResponse & { data?: T }>
) => transformers.reduce((response, transformer) => transformer(response), baseResponse)
