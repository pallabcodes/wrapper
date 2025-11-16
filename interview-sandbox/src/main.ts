import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AppBootstrapService } from '@common/bootstrap/app-bootstrap.service';
import { AppShutdownHandler } from '@common/bootstrap/app-shutdown.handler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configure application (prefix, CORS, pipes, filters, interceptors, Swagger)
  const bootstrapService = AppBootstrapService.create(app, configService);
  bootstrapService.configure();

  // Start server
  const port = bootstrapService.getPort();
  await app.listen(port);

  // Log startup information
  bootstrapService.logStartupInfo(port);

  // Setup graceful shutdown handlers
  AppShutdownHandler.handle(app);
}

void bootstrap();
