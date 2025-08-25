/**
 * Response Type Definitions
 * 
 * Core types for enterprise response handling
 */

export interface BaseResponse {
  readonly success: boolean
  readonly meta?: ResponseMeta
}

export interface SuccessResponse<T = unknown> extends BaseResponse {
  readonly success: true
  readonly data: T
}

export interface ErrorResponse extends BaseResponse {
  readonly success: false
  readonly error: {
    readonly code: string
    readonly message: string
    readonly details?: Record<string, unknown>
  }
}

export interface ResponseMeta {
  readonly pagination?: PaginationMeta
  readonly timestamp: Date
  readonly requestId: string
  readonly version: string
}

export interface PaginationMeta {
  readonly page: number
  readonly limit: number
  readonly offset: number
  readonly total?: number
}

export interface PaginationParams {
  readonly page?: number
  readonly limit?: number
  readonly offset?: number
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse
export type ApiSuccessResponse<T = unknown> = SuccessResponse<T>
export type ApiErrorResponse = ErrorResponse
