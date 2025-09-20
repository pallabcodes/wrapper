import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DebugService {
  private readonly logger = new Logger(DebugService.name);

  logRequest(method: string, url: string, body?: any): void {
    this.logger.debug(`Request: ${method} ${url}`, { body });
  }

  logResponse(statusCode: number, responseTime: number): void {
    this.logger.debug(`Response: ${statusCode} (${responseTime}ms)`);
  }

  logError(error: Error, context?: string): void {
    this.logger.error(`Error${context ? ` in ${context}` : ''}: ${error.message}`, error.stack);
  }

  logPerformance(operation: string, duration: number): void {
    this.logger.debug(`Performance: ${operation} took ${duration}ms`);
  }
}

