import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Request interface to include custom properties
interface RequestWithTracking extends Request {
  requestId?: string;
  startTime?: bigint;
}

@Injectable()
export class RequestTrackerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RequestTracker');

  use(req: Request, res: Response, next: NextFunction): void {
    // Generate unique request ID
    const requestId = uuidv4();
    const reqWithTracking = req as RequestWithTracking;
    reqWithTracking.requestId = requestId;

    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);

    // Track request start time
    const startTime = process.hrtime.bigint();
    reqWithTracking.startTime = startTime;

    // Log request tracking information
    this.logger.debug('Request tracked', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')?.substring(0, 100),
      timestamp: new Date().toISOString(),
    });

    // Track response
    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

      this.logger.debug('Request completed', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    });

    next();
  }
}
