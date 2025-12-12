import { NestFactory } from '@nestjs/core';
import { ValidationPipe, NestInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { RateLimitingInterceptor } from './infrastructure/security/rate-limiting.interceptor';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { TracingInterceptor } from './common/interceptors/tracing.interceptor';
import { SanitizationMiddleware } from './infrastructure/security/sanitization.middleware';
import { getSecurityConfig } from './infrastructure/security/security.config';
import { CustomLoggerService } from './infrastructure/logging/logger.service';
import { MetricsService } from './infrastructure/monitoring/metrics.service';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { createObservabilityConfig } from './infrastructure/config/observability.config';
import { startTracing } from './infrastructure/observability/tracing';

async function bootstrap() {
  const customLogger = new CustomLoggerService();
  const security = getSecurityConfig();
  const observability = createObservabilityConfig();

  if (observability.tracing.enabled) {
    await startTracing(observability.tracing);
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      trustProxy: true,
    }),
  );
  const metrics = app.get(MetricsService);

  app.useLogger(customLogger);
  app.use(new RequestLoggingMiddleware(customLogger).use);

  await app.register(helmet, security.helmet);
  app.use(new SanitizationMiddleware().use);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  const timeoutMs = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);
  const interceptors: NestInterceptor[] = [
    new TimeoutInterceptor(timeoutMs),
    new RateLimitingInterceptor(security.rateLimit),
    new MetricsInterceptor(metrics),
  ];
  if (observability.tracing.enabled) {
    interceptors.push(new TracingInterceptor());
  }
  app.useGlobalInterceptors(...interceptors);

  const config = new DocumentBuilder()
    .setTitle('Interview Sandbox - Clean Architecture API')
    .setDescription('Production-ready Clean Architecture NestJS API with comprehensive security')
    .setVersion('1.0.0')
    .addTag('Authentication', 'User authentication endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addServer('http://localhost:3000', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.enableCors(security.cors);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  customLogger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
  customLogger.log(`Swagger documentation: http://localhost:${port}/api-docs`, 'Bootstrap');
  customLogger.log(`Security enabled: Helmet, Rate Limiting, Input Sanitization`, 'Bootstrap');
}

bootstrap();
