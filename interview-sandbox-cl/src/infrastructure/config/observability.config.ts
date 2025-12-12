export type ObservabilityConfig = {
  metrics: {
    enabled: boolean;
    bucketsMs: number[];
  };
  tracing: {
    enabled: boolean;
    serviceName: string;
    otlpEndpoint: string;
    otlpHeaders: Record<string, string>;
  };
  logging: {
    jsonEnabled: boolean;
  };
};

function parseBuckets(value: string | undefined): number[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((v) => !Number.isNaN(v) && v > 0);
}

function parseHeaders(value: string | undefined): Record<string, string> {
  if (!value) {
    return {};
  }
  return value.split(',').reduce<Record<string, string>>((headers, pair) => {
    const [key, ...rest] = pair.split('=');
    if (key && rest.length > 0) {
      headers[key.trim()] = rest.join('=').trim();
    }
    return headers;
  }, {});
}

export function createObservabilityConfig(): ObservabilityConfig {
  const bucketOverride = parseBuckets(process.env.METRICS_BUCKETS_MS);
  return {
    metrics: {
      enabled: process.env.METRICS_ENABLED !== 'false',
      bucketsMs: bucketOverride.length > 0 ? bucketOverride : [5, 10, 50, 100, 250, 500, 1000, 2000],
    },
    tracing: {
      enabled: process.env.TRACING_ENABLED === 'true',
      serviceName: process.env.TRACING_SERVICE_NAME || 'interview-sandbox-cl',
      otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
      otlpHeaders: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    },
    logging: {
      jsonEnabled: process.env.LOG_JSON !== 'false',
    },
  };
}
