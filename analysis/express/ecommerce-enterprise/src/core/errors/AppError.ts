export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.AUTHENTICATION_ERROR]: 401,
  [ErrorCode.AUTHORIZATION_ERROR]: 403,
  [ErrorCode.NOT_FOUND_ERROR]: 404,
  [ErrorCode.CONFLICT_ERROR]: 409,
  [ErrorCode.RATE_LIMIT_ERROR]: 429,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500
};

export interface AppErrorData {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error') {
    super(message, 502);
  }
}

export const createValidationError = (message: string, details?: Record<string, any>): AppError => {
  return new AppError(message, ErrorCode.VALIDATION_ERROR, details);
};

export const createAuthenticationError = (message: string): AppError => {
  return new AppError(message, ErrorCode.AUTHENTICATION_ERROR);
};

export const createAuthorizationError = (message: string): AppError => {
  return new AppError(message, ErrorCode.AUTHORIZATION_ERROR);
};

export const createNotFoundError = (message: string): AppError => {
  return new AppError(message, ErrorCode.NOT_FOUND_ERROR);
};

export const createConflictError = (message: string): AppError => {
  return new AppError(message, ErrorCode.CONFLICT_ERROR);
};

export const createRateLimitError = (message: string): AppError => {
  return new AppError(message, ErrorCode.RATE_LIMIT_ERROR);
};

export const createExternalServiceError = (message: string): AppError => {
  return new AppError(message, ErrorCode.EXTERNAL_SERVICE_ERROR);
};

export const createInternalServerError = (message: string): AppError => {
  return new AppError(message, ErrorCode.INTERNAL_SERVER_ERROR);
};
