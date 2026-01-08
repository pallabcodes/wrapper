import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaEventBusAdapter } from './infrastructure/adapters/kafka-event-bus.adapter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

// Domain Ports
import { PAYMENT_REPOSITORY } from './domain/ports/payment-repository.port';
import { PAYMENT_PROCESSOR } from './domain/ports/payment-processor.port';
import { NOTIFICATION_SERVICE } from './domain/ports/notification-service.port';

import { SUBSCRIPTION_REPOSITORY } from './domain/ports/subscription-repository.port';
import { SUBSCRIPTION_SERVICE } from './domain/ports/subscription-service.port';
import { WEBHOOK_REPOSITORY } from './domain/ports/webhook-repository.port';

// Infrastructure Implementations
import { PostgresPaymentRepository } from './infrastructure/persistence/postgres-payment.repository';
import { PaymentEntity } from './infrastructure/persistence/entities/payment.entity';
import { StripePaymentProcessor } from './infrastructure/payment/stripe-payment-processor';
import { ResilientStripePaymentProcessor } from './infrastructure/payment/resilient-stripe-payment-processor';
import { RazorpayPaymentProcessor } from './infrastructure/payment/razorpay-payment-processor';
import { PaymentProcessorOrchestrator } from './infrastructure/payment/payment-processor-orchestrator';
import { PAYMENT_PROCESSOR_ORCHESTRATOR } from './domain/ports/payment-processor-orchestrator.port';
import { KafkaNotificationService } from './infrastructure/messaging/kafka-notification.service';
import { PostgresSubscriptionRepository } from './infrastructure/persistence/postgres-subscription.repository';
import { SubscriptionEntity } from './infrastructure/persistence/entities/subscription.entity';

import { StripeSubscriptionService } from './infrastructure/services/stripe-subscription.service';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { WebhookEventEntity } from './infrastructure/persistence/entities/webhook-event.entity';
import { PostgresWebhookRepository } from './infrastructure/persistence/postgres-webhook.repository';

// Application Layer
import { CreatePaymentUseCase } from './application/use-cases/create-payment.usecase';
import { ProcessPaymentUseCase } from './application/use-cases/process-payment.usecase';
import { GetPaymentUseCase } from './application/use-cases/get-payment.usecase';
import { ProcessStripeWebhookUseCase } from './application/use-cases/process-stripe-webhook.usecase';
import { RefundPaymentUseCase } from './application/use-cases/refund-payment.usecase';
import { CreateSubscriptionUseCase } from './application/use-cases/create-subscription.usecase';
import { CancelSubscriptionUseCase } from './application/use-cases/cancel-subscription.usecase';
import { GetUserPaymentsUseCase } from './application/use-cases/get-user-payments.usecase';
import { GetUserSubscriptionUseCase } from './application/use-cases/get-user-subscription.usecase';

// Presentation Layer
import { PaymentController } from './presentation/http/controllers/payment.controller';
import { HealthController } from './presentation/http/controllers/health.controller';
import { MetricsController } from './presentation/http/controllers/metrics.controller';
import { MetricsService } from '@streamverse/common';

/**
 * App Module: Dependency Injection Container
 *
 * Wires together all components following Clean Architecture
 * Ports are connected to their infrastructure implementations
 */
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Rate Limiting - Google-grade protection against abuse
    // Tiered limits: default (100/min), short (20/min for mutations), strict (5/min for refunds)
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute (general)
      },
      {
        name: 'short',
        ttl: 60000,
        limit: 20, // 20 requests per minute (payment creation)
      },
      {
        name: 'strict',
        ttl: 60000,
        limit: 5, // 5 requests per minute (refunds, sensitive ops)
      },
    ]),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'streamverse'),
        entities: [PaymentEntity, SubscriptionEntity, WebhookEventEntity],
        synchronize: configService.get('NODE_ENV') !== 'production', // Auto-sync in development
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // TypeORM Entities
    TypeOrmModule.forFeature([PaymentEntity, SubscriptionEntity, WebhookEventEntity]),

    // Kafka Client for messaging
    ClientsModule.registerAsync([
      {
        name: 'PAYMENT_SERVICE_KAFKA',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: [configService.get('KAFKA_BROKERS', 'localhost:9092')],
            },
            consumer: {
              groupId: 'payment-service',
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'KAFKA_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'payment-service-producer',
              brokers: [configService.get('KAFKA_BROKERS', 'localhost:9092')],
            },
            consumer: {
              groupId: 'payment-service-producer-group',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),

    // Authentication
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],

  controllers: [
    PaymentController,
    HealthController,
    MetricsController,
  ],

  providers: [
    {
      provide: 'EVENT_BUS',
      useClass: KafkaEventBusAdapter,
    },
    KafkaEventBusAdapter,

    // Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Application Layer
    CreatePaymentUseCase,
    ProcessPaymentUseCase,
    GetPaymentUseCase,
    ProcessStripeWebhookUseCase,
    RefundPaymentUseCase,
    CreateSubscriptionUseCase,
    CancelSubscriptionUseCase,
    GetUserPaymentsUseCase,
    GetUserSubscriptionUseCase,

    // Infrastructure Layer: Port Implementations
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PostgresPaymentRepository,
    },
    {
      provide: PAYMENT_PROCESSOR,
      useClass: ResilientStripePaymentProcessor,
    },
    // Base Stripe processor (injected into ResilientStripePaymentProcessor)
    StripePaymentProcessor,
    // Razorpay processor for Multi-PSP failover
    RazorpayPaymentProcessor,
    // Multi-PSP Orchestrator
    {
      provide: PAYMENT_PROCESSOR_ORCHESTRATOR,
      useClass: PaymentProcessorOrchestrator,
    },
    PaymentProcessorOrchestrator,
    {
      provide: NOTIFICATION_SERVICE,
      useClass: KafkaNotificationService,
    },
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useClass: PostgresSubscriptionRepository,
    },
    {
      provide: SUBSCRIPTION_SERVICE,
      useClass: StripeSubscriptionService,
    },
    {
      provide: WEBHOOK_REPOSITORY,
      useClass: PostgresWebhookRepository,
    },
    // Authentication Strategy
    JwtStrategy,
    // Observability
    MetricsService,
  ],
})
export class AppModule { }