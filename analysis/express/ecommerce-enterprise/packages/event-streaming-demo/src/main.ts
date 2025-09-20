import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = 3016;
  
  await app.listen(port);
  
  const logger = new Logger('EventStreamingDemo');
  logger.log(`🚀 Event Streaming Demo Service running on http://localhost:${port}`);
  logger.log(`📊 Health check: http://localhost:${port}/event-streaming-demo/health`);
  logger.log(`🔍 Available endpoints:`);
  logger.log(`  GET  /event-streaming-demo/health - Event streaming health status`);
  logger.log(`  GET  /event-streaming-demo/metrics - Event streaming metrics`);
  logger.log(`  POST /event-streaming-demo/users - Demonstrate user events`);
  logger.log(`  POST /event-streaming-demo/orders - Demonstrate order events`);
  logger.log(`  POST /event-streaming-demo/payments - Demonstrate payment events`);
  logger.log(`  POST /event-streaming-demo/inventory - Demonstrate inventory events`);
  logger.log(`  POST /event-streaming-demo/batch - Demonstrate batch publishing`);
  logger.log(`  POST /event-streaming-demo/multi-topic - Demonstrate multi-topic publishing`);
  logger.log(`  POST /event-streaming-demo/load-test - Simulate event processing load`);
}

bootstrap();
