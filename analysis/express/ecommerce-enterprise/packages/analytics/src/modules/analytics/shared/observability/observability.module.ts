import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

@Global()
@Module({
  providers: [ConfigService],
  exports: [],
})
export class ObservabilityModule implements OnModuleInit {
  private sdk?: NodeSDK;
  constructor(private readonly cfg: ConfigService) {}

  async onModuleInit() {
    const otlpUrl = this.cfg.get<string>('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT');
    if (!otlpUrl) return; // tracing disabled by default

    const serviceName = this.cfg.get<string>('SERVICE_NAME') || 'analytics';
    this.sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter({ url: otlpUrl }),
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.cfg.get<string>('NODE_ENV') || 'development',
      }),
    });
    await this.sdk.start();
  }
}


