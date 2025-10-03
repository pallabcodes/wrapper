import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './server/app.module';
import { CorrelationDeserializer, CorrelationSerializer } from './server/correlation.serializer';

async function bootstrap() {
  const logger = new Logger('NestMicroservicesDemoRedis');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.REDIS,
    options: {
      url: 'redis://localhost:6379',
      serializer: new CorrelationSerializer(),
      deserializer: new CorrelationDeserializer(),
    },
  });
  await app.listen();
  logger.log('Redis microservice listening at redis://localhost:6379');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
