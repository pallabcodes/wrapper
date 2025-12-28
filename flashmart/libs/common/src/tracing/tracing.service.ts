import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NodeSDK,
  resources,
  SemanticResourceAttributes,
} from '@opentelemetry/sdk-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

@Injectable()
export class TracingService implements OnModuleInit {
  private readonly logger = new Logger('TracingService');
  private sdk: NodeSDK;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    if (this.configService.get('TRACING_ENABLED', 'true') !== 'true') {
      this.logger.log('Distributed tracing is disabled');
      return;
    }

    await this.initializeTracing();
  }

  private async initializeTracing() {
    try {
      const serviceName = this.configService.get('SERVICE_NAME', 'flashmart-service');
      const jaegerEndpoint = this.configService.get('JAEGER_ENDPOINT', 'http://localhost:14268/api/traces');

      // Jaeger exporter
      const exporter = new JaegerExporter({
        endpoint: jaegerEndpoint,
      });

      // Resource attributes
      const resource = resources.Resource.default().merge(
        new resources.Resource({
          [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
          [SemanticResourceAttributes.SERVICE_VERSION]: this.configService.get('SERVICE_VERSION', '1.0.0'),
          [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'flashmart',
        }),
      );

      // Initialize SDK
      this.sdk = new NodeSDK({
        resource,
        traceExporter: exporter,
        instrumentations: [
          getNodeAutoInstrumentations({
            // Disable file system instrumentation for performance
            '@opentelemetry/instrumentation-fs': {
              enabled: false,
            },
            // Configure HTTP instrumentation
            '@opentelemetry/instrumentation-http': {
              enabled: true,
            },
            // Configure database instrumentations
            '@opentelemetry/instrumentation-ioredis': {
              enabled: true,
            },
            '@opentelemetry/instrumentation-pg': {
              enabled: true,
            },
            // Configure GraphQL instrumentation
            '@opentelemetry/instrumentation-graphql': {
              enabled: true,
            },
          }),
        ],
      });

      // Start SDK
      await this.sdk.start();
      this.logger.log(`OpenTelemetry tracing initialized for service: ${serviceName}`);

      // Graceful shutdown
      process.on('SIGTERM', async () => {
        try {
          await this.sdk.shutdown();
          this.logger.log('OpenTelemetry tracing shut down gracefully');
        } catch (error) {
          this.logger.error('Error shutting down tracing:', error);
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize OpenTelemetry tracing:', error);
    }
  }

  async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
    }
  }
}
