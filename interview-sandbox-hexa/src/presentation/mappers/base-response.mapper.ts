/**
 * Base Response Mapper
 * 
 * Provides standard response structure for all API endpoints
 * Ensures consistent response format across the application
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
  requestId?: string;
  meta?: {
    version?: string;
    environment?: string;
    [key: string]: any;
  };
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Base Response Mapper Class
 * 
 * All controller-specific mappers should extend this class
 */
export abstract class BaseResponseMapper {
  /**
   * Create success response
   */
  protected success<T>(data: T, message: string = 'Operation successful', requestId?: string): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId,
      meta: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }

  /**
   * Create created response (201)
   */
  protected created<T>(data: T, message: string = 'Resource created successfully', requestId?: string): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId,
      meta: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }

  /**
   * Create updated response (200)
   */
  protected updated<T>(data: T, message: string = 'Resource updated successfully', requestId?: string): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId,
      meta: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }

  /**
   * Create deleted response (200)
   */
  protected deleted(message: string = 'Resource deleted successfully', requestId?: string): ApiResponse<null> {
    return {
      success: true,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      requestId,
      meta: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }

  /**
   * Create paginated response
   */
  protected paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Data retrieved successfully',
    requestId?: string,
  ): PaginatedResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      meta: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }

  /**
   * Create error response
   */
  protected error(message: string, requestId?: string, meta?: Record<string, any>): ApiResponse<null> {
    return {
      success: false,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      requestId,
      meta: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        ...meta,
      },
    };
  }
}

