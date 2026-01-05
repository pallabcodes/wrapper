import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';

// Domain Ports
import { PAYMENT_REPOSITORY } from './domain/ports/payment-repository.port';
import { PAYMENT_PROCESSOR } from './domain/ports/payment-processor.port';
import { NOTIFICATION_SERVICE } from './domain/ports/notification-service.port';
import { SUBSCRIPTION_REPOSITORY } from './domain/ports/subscription-repository.port';
import { SUBSCRIPTION_SERVICE } from './domain/ports/subscription-service.port';

// Infrastructure Implementations
import { PostgresPaymentRepository } from './infrastructure/persistence/postgres-payment.repository';
import { PaymentEntity } from './infrastructure/persistence/entities/payment.entity';
import { StripePaymentProcessor } from './infrastructure/payment/stripe-payment-processor';
import { KafkaNotificationService } from './infrastructure/messaging/kafka-notification.service';
import { PostgresSubscriptionRepository } from './infrastructure/persistence/postgres-subscription.repository';
import { SubscriptionEntity } from './infrastructure/persistence/entities/subscription.entity';
import { StripeSubscriptionService } from './infrastructure/services/stripe-subscription.service';

// Application Layer
import { CreatePaymentUseCase } from './application/use-cases/create-payment.usecase';
import { ProcessPaymentUseCase } from './application/use-cases/process-payment.usecase';
import { ProcessStripeWebhookUseCase } from './application/use-cases/process-stripe-webhook.usecase';
import { RefundPaymentUseCase } from './application/use-cases/refund-payment.usecase';
import { CreateSubscriptionUseCase } from './application/use-cases/create-subscription.usecase';
import { CancelSubscriptionUseCase } from './application/use-cases/cancel-subscription.usecase';

// Presentation Layer
import { PaymentController } from './presentation/http/controllers/payment.controller';
import { HealthController } from './presentation/http/controllers/health.controller';

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
        entities: [PaymentEntity, SubscriptionEntity],
        synchronize: configService.get('NODE_ENV') !== 'production', // Auto-sync in development
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // TypeORM Entities
    TypeOrmModule.forFeature([PaymentEntity, SubscriptionEntity]),

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
    ]),
  ],

  controllers: [
    PaymentController,
    HealthController,
  ],

  providers: [
    // Application Layer
    CreatePaymentUseCase,
    ProcessPaymentUseCase,
    ProcessStripeWebhookUseCase,
    RefundPaymentUseCase,
    CreateSubscriptionUseCase,
    CancelSubscriptionUseCase,

    // Infrastructure Layer: Port Implementations
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PostgresPaymentRepository,
    },
    {
      provide: PAYMENT_PROCESSOR,
      useClass: StripePaymentProcessor,
    },
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
  ],
})
export class AppModule {}
