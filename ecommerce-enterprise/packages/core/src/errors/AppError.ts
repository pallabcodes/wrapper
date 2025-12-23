/**
 * AppError - Production-ready error handling
 */

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly severity: ErrorSeverity
  public readonly isOperational: boolean
  public readonly retryable: boolean
  public readonly timestamp: Date

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isOperational: boolean = true,
    retryable: boolean = false
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.severity = severity
    this.isOperational = isOperational
    this.retryable = retryable
    this.timestamp = new Date()

    Error.captureStackTrace(this, AppError)
  }

  // Factory methods for common errors
  static validationError(message: string = 'Validation failed'): AppError {
    return new AppError(message, ErrorCode.VALIDATION_ERROR, 400, ErrorSeverity.LOW, true, false)
  }

  static unauthorized(message: string = 'Unauthorized access'): AppError {
    return new AppError(message, ErrorCode.UNAUTHORIZED, 401, ErrorSeverity.MEDIUM, true, false)
  }

  static forbidden(message: string = 'Access forbidden'): AppError {
    return new AppError(message, ErrorCode.FORBIDDEN, 403, ErrorSeverity.MEDIUM, true, false)
  }

  static notFound(resource: string = 'Resource'): AppError {
    return new AppError(`${resource} not found`, ErrorCode.NOT_FOUND, 404, ErrorSeverity.LOW, true, false)
  }

  static conflict(message: string = 'Resource conflict'): AppError {
    return new AppError(message, ErrorCode.CONFLICT, 409, ErrorSeverity.MEDIUM, true, false)
  }

  static rateLimitExceeded(message: string = 'Rate limit exceeded'): AppError {
    return new AppError(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, ErrorSeverity.MEDIUM, true, true)
  }

  static internalError(message: string = 'Internal server error'): AppError {
    return new AppError(message, ErrorCode.INTERNAL_SERVER_ERROR, 500, ErrorSeverity.HIGH, false, true)
  }

  static externalServiceError(service: string): AppError {
    return new AppError(
      `External service error: ${service}`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      502,
      ErrorSeverity.HIGH,
      true,
      true
    )
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      severity: this.severity,
      isOperational: this.isOperational,
      retryable: this.retryable,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    }
  }
}
