import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './server/app.module';

async function bootstrap() {
  const logger = new Logger('NestMicroservicesDemoKafka');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'demo-client',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'demo-group',
      },
    },
  });
  await app.listen();
  logger.log('Kafka microservice connected to localhost:9092');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
