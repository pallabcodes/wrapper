import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AnalyticsLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AnalyticsHTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || 'Unknown';

    // Log incoming request
    this.logger.log('Incoming request', {
      method,
      url: originalUrl,
      ip,
      userAgent: userAgent.substring(0, 100), // Truncate for privacy
      timestamp: new Date().toISOString(),
    });

    // Override response.end to log response details
    const originalEnd = res.end;
    const logger = this.logger; // Capture logger in closure
    res.end = function(chunk?: any, encoding?: any): Response {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      // Log response
      const logLevel = statusCode >= 400 ? 'warn' : 'log';
      const logData = {
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        ip,
        userAgent: userAgent.substring(0, 100),
        contentLength: res.get('Content-Length'),
        timestamp: new Date().toISOString(),
      };

      if (statusCode >= 400) {
        // Log errors with more detail
        logger.error('Request failed', {
          ...logData,
          error: 'HTTP error response',
        });
      } else {
        logger[logLevel]('Request completed', logData);
      }

      // Call original end method
      return originalEnd.call(res, chunk, encoding);
    }.bind(res);

    next();
  }
}
