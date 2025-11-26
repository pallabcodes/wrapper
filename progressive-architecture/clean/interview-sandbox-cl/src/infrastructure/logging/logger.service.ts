import { Injectable, LoggerService, ConsoleLogger } from '@nestjs/common';

@Injectable()
export class CustomLoggerService extends ConsoleLogger implements LoggerService {
  log(message: any, context?: string) {
    super.log(`[INFO] ${message}`, context);
  }

  error(message: any, trace?: string, context?: string) {
    super.error(`[ERROR] ${message}`, trace, context);
  }

  warn(message: any, context?: string) {
    super.warn(`[WARN] ${message}`, context);
  }

  debug(message: any, context?: string) {
    super.debug(`[DEBUG] ${message}`, context);
  }

  verbose(message: any, context?: string) {
    super.verbose(`[VERBOSE] ${message}`, context);
  }

  // Additional structured logging methods
  security(message: string, meta?: any, context?: string) {
    this.warn(`[SECURITY] ${message}`, context || 'Security');
    if (meta) {
      this.debug(`Security metadata: ${JSON.stringify(meta)}`, context || 'Security');
    }
  }

  audit(action: string, userId: string, resource: string, meta?: any) {
    this.log(`[AUDIT] ${action} on ${resource} by user ${userId}`, 'Audit');
    if (meta) {
      this.debug(`Audit metadata: ${JSON.stringify(meta)}`, 'Audit');
    }
  }

  performance(operation: string, duration: number, meta?: any) {
    const level = duration > 1000 ? 'warn' : 'log';
    this[level](`[PERF] ${operation} took ${duration}ms`, 'Performance');
    if (meta) {
      this.debug(`Performance metadata: ${JSON.stringify(meta)}`, 'Performance');
    }
  }

  business(event: string, userId?: string, meta?: any) {
    this.log(`[BUSINESS] ${event}${userId ? ` (user: ${userId})` : ''}`, 'Business');
    if (meta) {
      this.debug(`Business metadata: ${JSON.stringify(meta)}`, 'Business');
    }
  }
}
