/**
 * Shared types and utilities for StreamVerse microservices
 *
 * This package contains common interfaces, types, and utilities
 * used across all StreamVerse services.
 */

// =============================================================================
// COMMON TYPES
// =============================================================================

/**
 * Standard response wrapper for all APIs
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =============================================================================
// DOMAIN TYPES
// =============================================================================

/**
 * Base entity interface
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Soft delete entity interface
 */
export interface SoftDeleteEntity extends BaseEntity {
  deletedAt?: Date;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Standard error response
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extract the type of an array element
 */
export type ArrayElement<T extends readonly unknown[]> = T extends readonly (infer U)[] ? U : never;

// =============================================================================
// CONSTANTS
// =============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_SORT_ORDER = 'desc' as const;
