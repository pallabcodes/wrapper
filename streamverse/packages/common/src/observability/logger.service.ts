import pino from 'pino';
import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Correlation context for request tracing
 */
export interface CorrelationContext {
    correlationId: string;
    requestId?: string;
    userId?: string;
    traceId?: string;
    spanId?: string;
}

/**
 * AsyncLocalStorage for correlation context propagation
 */
export const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

/**
 * Get current correlation context
 */
export function getCorrelationContext(): CorrelationContext | undefined {
    return correlationStorage.getStore();
}

/**
 * Create Pino logger instance with environment-based configuration
 */
export function createPinoLogger(serviceName: string) {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    return pino({
        name: serviceName,
        level: process.env.LOG_LEVEL || 'info',
        ...(isDevelopment && {
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            },
        }),
        formatters: {
            level: (label) => ({ level: label }),
        },
        mixin: () => {
            const context = getCorrelationContext();
            return context
                ? {
                    correlationId: context.correlationId,
                    traceId: context.traceId,
                    spanId: context.spanId,
                    userId: context.userId,
                }
                : {};
        },
    });
}

/**
 * NestJS-compatible Pino Logger Service
 * Injects correlation IDs automatically into all log messages
 */
@Injectable({ scope: Scope.TRANSIENT })
export class PinoLoggerService implements LoggerService {
    private logger: pino.Logger;
    private context?: string;

    constructor(serviceName: string = 'streamverse') {
        this.logger = createPinoLogger(serviceName);
    }

    setContext(context: string) {
        this.context = context;
    }

    log(message: any, ...optionalParams: any[]) {
        this.logger.info({ context: this.context, ...this.extractMeta(optionalParams) }, message);
    }

    error(message: any, ...optionalParams: any[]) {
        const { trace, ...meta } = this.extractMeta(optionalParams);
        this.logger.error({ context: this.context, err: trace, ...meta }, message);
    }

    warn(message: any, ...optionalParams: any[]) {
        this.logger.warn({ context: this.context, ...this.extractMeta(optionalParams) }, message);
    }

    debug(message: any, ...optionalParams: any[]) {
        this.logger.debug({ context: this.context, ...this.extractMeta(optionalParams) }, message);
    }

    verbose(message: any, ...optionalParams: any[]) {
        this.logger.trace({ context: this.context, ...this.extractMeta(optionalParams) }, message);
    }

    private extractMeta(params: any[]): Record<string, any> {
        if (params.length === 0) return {};
        if (params.length === 1) {
            if (typeof params[0] === 'string') {
                return { context: params[0] };
            }
            return params[0];
        }
        return { args: params };
    }
}

/**
 * Create a child logger with additional context
 */
export function createChildLogger(parent: pino.Logger, bindings: Record<string, any>) {
    return parent.child(bindings);
}
