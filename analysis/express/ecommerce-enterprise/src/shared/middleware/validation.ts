import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '@/core/errors/AppError';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    throw new AppError('Validation failed', 400, errorMessages);
  }
  
  next();
};

export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorDetails = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.received
        }));
        
        next(createValidationError('Validation failed', { errors: errorDetails }));
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorDetails = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.received
        }));
        
        next(createValidationError('Validation failed', { errors: errorDetails }));
      } else {
        next(error);
      }
    }
  };
};

export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorDetails = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.received
        }));
        
        next(createValidationError('Validation failed', { errors: errorDetails }));
      } else {
        next(error);
      }
    }
  };
};

export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const { page, limit, sort } = req.query;

  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    next(createValidationError('Page must be a positive number'));
    return;
  }

  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    next(createValidationError('Limit must be between 1 and 100'));
    return;
  }

  if (sort && !['asc', 'desc'].includes(String(sort).toLowerCase())) {
    next(createValidationError('Sort must be either "asc" or "desc"'));
    return;
  }

  next();
};

export const validateUUID = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuid = req.params[paramName];
    
    if (!uuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) {
      next(createValidationError(`Invalid ${paramName} format`));
      return;
    }

    next();
  };
};

export const validateSearchQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { search } = req.query;

  if (search && typeof search === 'string') {
    if (search.length < 2) {
      next(createValidationError('Search query must be at least 2 characters long'));
      return;
    }

    if (search.length > 100) {
      next(createValidationError('Search query cannot exceed 100 characters'));
      return;
    }

    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(search)) {
        next(createValidationError('Search query contains invalid characters'));
        return;
      }
    }
  }

  next();
};
