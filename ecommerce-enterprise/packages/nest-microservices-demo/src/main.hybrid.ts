import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './server/app.module';

async function bootstrap() {
  const logger = new Logger('NestMicroservicesDemoHybrid');
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 4010 },
  });

  await app.startAllMicroservices();
  await app.listen(3000);

  logger.log('HTTP listening on 3000 and TCP microservice on 4010');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
