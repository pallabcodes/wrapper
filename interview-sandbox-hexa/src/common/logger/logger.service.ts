import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

/**
 * Application Logger Service
 * 
 * Centralized logging service for consistent log formatting
 * In production, integrate with structured logging (Winston, Pino, etc.)
 */
@Injectable()
export class AppLoggerService implements NestLoggerService {
  private readonly context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  /**
   * Log informational message
   */
  log(message: string, context?: string): void {
    const ctx = context || this.context || 'Application';
    console.log(`[${new Date().toISOString()}] [${ctx}] ${message}`);
  }

  /**
   * Log error message
   */
  error(message: string, trace?: string, context?: string): void {
    const ctx = context || this.context || 'Application';
    console.error(`[${new Date().toISOString()}] [${ctx}] ERROR: ${message}`);
    if (trace) {
      console.error(`[${new Date().toISOString()}] [${ctx}] TRACE: ${trace}`);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: string): void {
    const ctx = context || this.context || 'Application';
    console.warn(`[${new Date().toISOString()}] [${ctx}] WARN: ${message}`);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: string): void {
    const ctx = context || this.context || 'Application';
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${new Date().toISOString()}] [${ctx}] DEBUG: ${message}`);
    }
  }

  /**
   * Log verbose message
   */
  verbose(message: string, context?: string): void {
    const ctx = context || this.context || 'Application';
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${new Date().toISOString()}] [${ctx}] VERBOSE: ${message}`);
    }
  }
}

