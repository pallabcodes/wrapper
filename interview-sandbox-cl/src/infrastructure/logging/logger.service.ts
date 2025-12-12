import { Injectable, LoggerService, ConsoleLogger } from '@nestjs/common';

@Injectable()
export class CustomLoggerService extends ConsoleLogger implements LoggerService {
  private readonly jsonEnabled = process.env.LOG_JSON !== 'false';

  log(message: any, context?: string, meta?: any) {
    super.log(this.format('info', message, context, meta), context);
  }

  error(message: any, trace?: string, context?: string, meta?: any) {
    super.error(this.format('error', message, context, meta), trace, context);
  }

  warn(message: any, context?: string, meta?: any) {
    super.warn(this.format('warn', message, context, meta), context);
  }

  debug(message: any, context?: string, meta?: any) {
    super.debug(this.format('debug', message, context, meta), context);
  }

  verbose(message: any, context?: string, meta?: any) {
    super.verbose(this.format('verbose', message, context, meta), context);
  }

  security(message: string, meta?: any, context?: string) {
    this.warn(`[SECURITY] ${message}`, context || 'Security', meta);
  }

  audit(action: string, userId: string, resource: string, meta?: any) {
    this.log(`[AUDIT] ${action} on ${resource} by user ${userId}`, 'Audit', meta);
  }

  performance(operation: string, duration: number, meta?: any) {
    const level = duration > 1000 ? 'warn' : 'log';
    this[level](`[PERF] ${operation} took ${duration}ms`, 'Performance', meta);
  }

  business(event: string, userId?: string, meta?: any) {
    this.log(`[BUSINESS] ${event}${userId ? ` (user: ${userId})` : ''}`, 'Business', meta);
  }

  private format(level: string, message: any, context?: string, meta?: any): string {
    const payload = {
      level,
      msg: typeof message === 'string' ? message : JSON.stringify(message),
      context,
      correlationId: meta?.correlationId || meta?.traceId,
      traceId: meta?.traceId,
      spanId: meta?.spanId,
      ...meta,
    };

    if (!this.jsonEnabled) {
      return `${payload.level} ${payload.msg} ${payload.context || ''} traceId=${payload.traceId || ''} correlationId=${payload.correlationId || ''}`.trim();
    }

    return JSON.stringify(payload);
  }
}
