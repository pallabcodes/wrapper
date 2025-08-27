import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { logger } from '@/core/utils/logger';

export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Convert to AppError if it's not already
  if (error instanceof AppError) {
    appError = error;
  } else {
    // Handle different types of errors
    if (error.name === 'ValidationError') {
      appError = new AppError('Validation failed', 400, error.message);
    } else if (error.name === 'CastError') {
      appError = new AppError('Invalid ID format', 400);
    } else if (error.name === 'JsonWebTokenError') {
      appError = new AppError('Invalid token', 401);
    } else if (error.name === 'TokenExpiredError') {
      appError = new AppError('Token expired', 401);
    } else if (error.name === 'MongoError' && (error as any).code === 11000) {
      appError = new AppError('Duplicate field value', 409);
    } else {
      appError = new AppError('Internal server error', 500);
    }
  }

  // Log error
  if (appError.statusCode >= 500) {
    logger.error('Server error:', {
      error: appError.message,
      stack: appError.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } else {
    logger.warn('Client error:', {
      error: appError.message,
      statusCode: appError.statusCode,
      url: req.url,
      method: req.method,
      ip: req.ip
    });
  }

  // Send error response
  const errorResponse = {
    error: {
      message: appError.message,
      statusCode: appError.statusCode,
      ...(appError.details && { details: appError.details })
    }
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = {
      ...errorResponse.error,
      stack: appError.stack
    };
  }

  res.status(appError.statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`
    }
  });
};

export const requestTiming = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip
    });
  });

  next();
};

export const gracefulShutdown = (server: any, signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};
