import { trace } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ObservabilityConfig } from '../config/observability.config';

let sdk: NodeSDK | null = null;

export async function startTracing(config: ObservabilityConfig['tracing']): Promise<void> {
  if (!config.enabled || sdk) {
    return;
  }

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    }),
    traceExporter: new OTLPTraceExporter({
      url: config.otlpEndpoint,
      headers: config.otlpHeaders,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  await sdk.start();
}

export async function stopTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}

export function getTracer() {
  return trace.getTracer('interview-sandbox');
}
