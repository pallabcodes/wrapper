import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule, RateLimitService, AuditService } from '@flashmart/common';

// Middleware
import { AuthMiddleware } from './middleware/auth.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { VersioningMiddleware } from './middleware/versioning.middleware';
import { RequestTransformMiddleware } from './middleware/transform.middleware';
import { LoggingMiddleware } from './middleware/logging.middleware';

// Services & Controllers
import { CircuitBreakerService } from './resilience/circuit-breaker.service';
import { HealthController } from './controllers/health.controller';

// Custom data source with circuit breaker
class ResilientDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: any) {
    // Forward headers from client
    if (context.req) {
      request.http.headers.set('x-request-id', context.req.headers['x-request-id']);
      request.http.headers.set('x-user-id', context.req.user?.sub);
      request.http.headers.set('x-api-version', context.req.apiVersion);
    }
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule.forRootAsync(),
    GraphQLModule.forRootAsync<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        gateway: {
          supergraphSdl: new IntrospectAndCompose({
            subgraphs: [
              { name: 'users', url: config.get('USER_SERVICE_URL', 'http://localhost:3001/graphql') },
              { name: 'payments', url: config.get('PAYMENT_SERVICE_URL', 'http://localhost:3002/graphql') },
              { name: 'catalog', url: config.get('CATALOG_SERVICE_URL', 'http://localhost:3003/graphql') },
              { name: 'orders', url: config.get('ORDER_SERVICE_URL', 'http://localhost:3004/graphql') },
              { name: 'inventory', url: config.get('INVENTORY_SERVICE_URL', 'http://localhost:3005/graphql') },
              { name: 'video', url: config.get('VIDEO_SERVICE_URL', 'http://localhost:3006/graphql') },
            ],
          }),
          buildService({ url }) {
            return new ResilientDataSource({ url });
          },
        },
        context: ({ req }) => ({ req }),
      }),
    }),
  ],
  controllers: [HealthController],
  providers: [CircuitBreakerService, AuthMiddleware, RateLimitMiddleware, RateLimitService, AuditService],
})
export class GatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      // Order matters! Apply in this sequence:
      .apply(LoggingMiddleware)        // 1. Log all requests
      .forRoutes('*')
      .apply(VersioningMiddleware)     // 2. Extract API version
      .forRoutes('*')
      .apply(RequestTransformMiddleware) // 3. Transform request
      .forRoutes('*')
      .apply(AuthMiddleware)           // 4. Authenticate (skips public paths)
      .exclude('health', 'ready', 'metrics', '.well-known/(.*)')
      .forRoutes('*')
      .apply(RateLimitMiddleware)      // 5. Rate limit (after auth for user-based limits)
      .forRoutes('*');
  }
}