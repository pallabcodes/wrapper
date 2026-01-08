import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace, SpanStatusCode, Span, context } from '@opentelemetry/api';

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry tracing
 * MUST be called before any other imports in main.ts
 */
export function initTracing(serviceName: string): void {
    const jaegerEndpoint =
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';

    const exporter = new OTLPTraceExporter({
        url: jaegerEndpoint,
    });

    sdk = new NodeSDK({
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
            [SemanticResourceAttributes.SERVICE_VERSION]:
                process.env.npm_package_version || '1.0.0',
            [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
                process.env.NODE_ENV || 'development',
        }),
        traceExporter: exporter,
        instrumentations: [
            getNodeAutoInstrumentations({
                // Disable fs instrumentation to reduce noise
                '@opentelemetry/instrumentation-fs': { enabled: false },
                // Configure HTTP instrumentation
                '@opentelemetry/instrumentation-http': {
                    ignoreIncomingRequestHook: (request) => {
                        // Ignore health check endpoints
                        return request.url?.includes('/health') || request.url?.includes('/metrics');
                    },
                },
            }),
        ],
    });

    sdk.start();

    // Graceful shutdown
    process.on('SIGTERM', () => {
        sdk
            ?.shutdown()
            .then(() => console.log('Tracing terminated'))
            .catch((error) => console.error('Error terminating tracing', error))
            .finally(() => process.exit(0));
    });

    console.log(`🔭 OpenTelemetry tracing initialized for ${serviceName}`);
}

/**
 * Get the current tracer instance
 */
export function getTracer(name: string = 'default') {
    return trace.getTracer(name);
}

/**
 * Create a custom span for manual instrumentation
 */
export async function withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, string | number | boolean>,
): Promise<T> {
    const tracer = getTracer();
    return tracer.startActiveSpan(name, async (span) => {
        try {
            if (attributes) {
                span.setAttributes(attributes);
            }
            const result = await fn(span);
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
        } catch (error) {
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
            span.recordException(error as Error);
            throw error;
        } finally {
            span.end();
        }
    });
}

/**
 * Get the current span from context
 */
export function getCurrentSpan(): Span | undefined {
    return trace.getActiveSpan();
}

/**
 * Add attributes to the current span
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
    const span = getCurrentSpan();
    if (span) {
        span.setAttributes(attributes);
    }
}

/**
 * Record an error on the current span
 */
export function recordSpanError(error: Error): void {
    const span = getCurrentSpan();
    if (span) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    }
}
