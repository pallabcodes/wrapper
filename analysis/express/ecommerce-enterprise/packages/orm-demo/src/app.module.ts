import { Module } from '@nestjs/common';
import { NestOrmModule } from '@ecommerce-enterprise/nest-orm';
import { OrmDemoController } from './orm-demo.controller';
import { OrmDemoService } from './orm-demo.service';

@Module({
  imports: [
    NestOrmModule.forRoot({
      primary: 'prisma',
      fallbacks: ['drizzle', 'typeorm'],
      connections: {
        prisma: {
          url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ecommerce'
        },
        drizzle: {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_DATABASE || 'ecommerce',
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'password'
        },
        typeorm: {
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_DATABASE || 'ecommerce',
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'password'
        }
      },
      optimization: {
        caching: true,
        cacheTtl: 3600,
        batching: true,
        batchSize: 100,
        analysis: true
      },
      monitoring: {
        performanceTracking: true,
        slowQueryThreshold: 1000,
        queryLogging: true
      },
      transactions: {
        timeout: 10000,
        retryOnDeadlock: true,
        maxRetries: 3
      }
    })
  ],
  controllers: [OrmDemoController],
  providers: [OrmDemoService]
})
export class AppModule {}
