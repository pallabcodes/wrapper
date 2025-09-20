import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for demo purposes
  app.enableCors();
  
  const port = process.env.PORT || 3006;
  await app.listen(port);
  
  console.log(`🚀 ORM Demo Service running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/orm-demo/health`);
  console.log(`🔍 Available endpoints:`);
  console.log(`  GET  /orm-demo/users - Basic query with auto provider selection`);
  console.log(`  GET  /orm-demo/users/prisma - Query with Prisma provider`);
  console.log(`  GET  /orm-demo/report - Complex raw SQL with Drizzle`);
  console.log(`  POST /orm-demo/users/batch - Batch insert with TypeORM`);
  console.log(`  POST /orm-demo/users/with-profile - Transaction example`);
  console.log(`  GET  /orm-demo/analysis - Query performance analysis`);
  console.log(`  GET  /orm-demo/metrics - Performance metrics`);
  console.log(`  GET  /orm-demo/cache-demo - Caching demonstration`);
  console.log(`  GET  /orm-demo/error-handling - Error handling demo`);
  console.log(`  GET  /orm-demo/multi-tenant/:tenantId - Multi-tenancy demo`);
}

bootstrap().catch(console.error);
