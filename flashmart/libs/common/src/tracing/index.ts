import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Distributed Tracing - Production-grade tracing for microservices
 * 
 * Implements W3C Trace Context standard:
 * - traceparent: version-trace_id-span_id-flags
 * - tracestate: vendor-specific data
 * 
 * Compatible with:
 * - AWS X-Ray
 * - OpenTelemetry
 * - Jaeger
 * - Zipkin
 */

export interface TraceContext {
    traceId: string;        // 32 hex chars - unique per distributed transaction
    spanId: string;         // 16 hex chars - unique per service call
    parentSpanId?: string;  // Parent span for call hierarchy
    sampled: boolean;       // Whether to record this trace
    baggage: Map<string, string>;  // Cross-service context
}

export interface Span {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    operationName: string;
    serviceName: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    status: 'ok' | 'error';
    tags: Map<string, string>;
    logs: Array<{ timestamp: Date; message: string; level: string }>;
}

/**
 * Tracer - Creates and manages spans
 */
@Injectable()
export class Tracer {
    private readonly logger = new Logger('Tracer');
    private readonly serviceName: string;
    private readonly spans = new Map<string, Span>();

    // In production: send to collector
    private readonly spanExporter: (span: Span) => void = (span) => {
        this.logger.debug(`[Span] ${span.operationName} - ${span.duration}ms`, {
            traceId: span.traceId,
            spanId: span.spanId,
            status: span.status,
        });
    };

    constructor() {
        this.serviceName = process.env.SERVICE_NAME || 'flashmart';
    }

    // Create a new trace (root span)
    startTrace(operationName: string): Span {
        const traceId = this.generateTraceId();
        const spanId = this.generateSpanId();

        const span: Span = {
            traceId,
            spanId,
            operationName,
            serviceName: this.serviceName,
            startTime: new Date(),
            status: 'ok',
            tags: new Map(),
            logs: [],
        };

        this.spans.set(spanId, span);
        return span;
    }

    // Create a child span
    startSpan(operationName: string, parentContext: TraceContext): Span {
        const spanId = this.generateSpanId();

        const span: Span = {
            traceId: parentContext.traceId,
            spanId,
            parentSpanId: parentContext.spanId,
            operationName,
            serviceName: this.serviceName,
            startTime: new Date(),
            status: 'ok',
            tags: new Map(),
            logs: [],
        };

        this.spans.set(spanId, span);
        return span;
    }

    // End a span
    endSpan(span: Span, status: 'ok' | 'error' = 'ok'): void {
        span.endTime = new Date();
        span.duration = span.endTime.getTime() - span.startTime.getTime();
        span.status = status;

        this.spanExporter(span);
        this.spans.delete(span.spanId);
    }

    // Add tag to span
    setTag(span: Span, key: string, value: string): void {
        span.tags.set(key, value);
    }

    // Add log entry
    log(span: Span, message: string, level = 'info'): void {
        span.logs.push({
            timestamp: new Date(),
            message,
            level,
        });
    }

    // Parse W3C traceparent header
    parseTraceParent(header: string): TraceContext | null {
        // Format: 00-traceId-spanId-flags
        const match = header.match(/^00-([a-f0-9]{32})-([a-f0-9]{16})-([a-f0-9]{2})$/);

        if (!match) return null;

        return {
            traceId: match[1],
            spanId: match[2],
            sampled: (parseInt(match[3], 16) & 0x01) === 1,
            baggage: new Map(),
        };
    }

    // Create W3C traceparent header
    createTraceParent(context: TraceContext): string {
        const flags = context.sampled ? '01' : '00';
        return `00-${context.traceId}-${context.spanId}-${flags}`;
    }

    // Extract context from request headers
    extractContext(headers: Record<string, string | string[] | undefined>): TraceContext | null {
        const traceparent = headers['traceparent'] as string;

        // Try W3C format first
        if (traceparent) {
            return this.parseTraceParent(traceparent);
        }

        // Try AWS X-Ray format
        const xrayHeader = headers['x-amzn-trace-id'] as string;
        if (xrayHeader) {
            return this.parseXRayHeader(xrayHeader);
        }

        return null;
    }

    // Parse AWS X-Ray trace header
    private parseXRayHeader(header: string): TraceContext | null {
        const parts = header.split(';').reduce((acc, part) => {
            const [key, value] = part.split('=');
            acc[key] = value;
            return acc;
        }, {} as Record<string, string>);

        if (!parts.Root) return null;

        return {
            traceId: parts.Root.replace(/-/g, '').slice(-32),
            spanId: parts.Parent || this.generateSpanId(),
            sampled: parts.Sampled === '1',
            baggage: new Map(),
        };
    }

    private generateTraceId(): string {
        return Array.from({ length: 32 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    private generateSpanId(): string {
        return Array.from({ length: 16 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }
}

/**
 * Tracing Middleware - Automatically creates spans for requests
 */
@Injectable()
export class TracingMiddleware implements NestMiddleware {
    constructor(private readonly tracer: Tracer) { }

    use(req: Request, res: Response, next: NextFunction) {
        // Extract or create context
        const parentContext = this.tracer.extractContext(req.headers as any);

        const span = parentContext
            ? this.tracer.startSpan(`${req.method} ${req.path}`, parentContext)
            : this.tracer.startTrace(`${req.method} ${req.path}`);

        // Add request metadata
        this.tracer.setTag(span, 'http.method', req.method);
        this.tracer.setTag(span, 'http.url', req.url);
        this.tracer.setTag(span, 'http.user_agent', req.headers['user-agent'] || '');

        // Attach to request for downstream use
        (req as any).span = span;
        (req as any).traceContext = {
            traceId: span.traceId,
            spanId: span.spanId,
            sampled: true,
            baggage: new Map(),
        };

        // Add trace headers to response
        res.setHeader('X-Trace-ID', span.traceId);
        res.setHeader('X-Span-ID', span.spanId);

        // End span on response finish
        res.on('finish', () => {
            this.tracer.setTag(span, 'http.status_code', res.statusCode.toString());
            this.tracer.endSpan(span, res.statusCode >= 400 ? 'error' : 'ok');
        });

        next();
    }
}

/**
 * Span Decorator - For method-level tracing
 */
export function Traced(operationName?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const original = descriptor.value;
        const name = operationName || `${target.constructor.name}.${propertyKey}`;

        descriptor.value = async function (...args: any[]) {
            // Get tracer from DI (simplified - in production use proper DI)
            const tracer = (global as any).__tracer || new Tracer();
            const span = tracer.startTrace(name);

            try {
                const result = await original.apply(this, args);
                tracer.endSpan(span, 'ok');
                return result;
            } catch (error) {
                tracer.log(span, `Error: ${error.message}`, 'error');
                tracer.endSpan(span, 'error');
                throw error;
            }
        };

        return descriptor;
    };
}
