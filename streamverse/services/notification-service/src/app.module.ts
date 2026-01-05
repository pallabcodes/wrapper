import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { createClient } from 'redis';

// Domain Ports
import { NOTIFICATION_REPOSITORY } from './domain/ports/notification-repository.port';
import { EMAIL_PROVIDER } from './domain/ports/notification-providers.port';
import { SMS_PROVIDER } from './domain/ports/notification-providers.port';
import { PUSH_PROVIDER } from './domain/ports/notification-providers.port';
import { TEMPLATE_SERVICE } from './domain/ports/notification-template.port';

// Infrastructure Implementations
import { PostgresNotificationRepository } from './infrastructure/persistence/postgres-notification.repository';
import { NotificationEntity } from './infrastructure/persistence/entities/notification.entity';
import { SendGridEmailProvider } from './infrastructure/email/sendgrid-email.provider';
import { TwilioSMSProvider } from './infrastructure/sms/twilio-sms.provider';
import { FirebasePushProvider } from './infrastructure/push/firebase-push.provider';
import { NotificationTemplateService } from './infrastructure/templates/notification-template.service';
import { RedisTokenService } from './infrastructure/cache/redis-token.service';
import { EventStoreService } from './infrastructure/event-sourcing/event-store.service';
import { OutboxService } from './infrastructure/outbox/outbox.service';
import { DeadLetterQueueService } from './infrastructure/dead-letter/dead-letter-queue.service';

// Application Layer
import { SendNotificationUseCase } from './application/use-cases/send-notification.usecase';

// Presentation Layer
import { NotificationController } from './presentation/http/controllers/notification.controller';
import { HealthController } from './presentation/http/controllers/health.controller';

/**
 * App Module: Dependency Injection Container
 *
 * Wires together all components following Clean Architecture
 * Ports are connected to their infrastructure implementations
 */
// Notification Service - Consumes Kafka events from User Service
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
        entities: [NotificationEntity],
        synchronize: configService.get('NODE_ENV') !== 'production', // Auto-sync in development
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // TypeORM Entities
    TypeOrmModule.forFeature([NotificationEntity]),

    // Kafka Client for messaging
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_SERVICE_KAFKA',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: [configService.get('KAFKA_BROKERS', 'localhost:9092')],
            },
            consumer: {
              groupId: 'notification-service',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),

    // Redis for distributed locks and idempotency
  ],
  providers: [
    // Redis Client Provider (for distributed locks)
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const client = createClient({
          url: configService.get('REDIS_URL', 'redis://localhost:6379'),
        });
        client.connect().catch(console.error);
        return client;
      },
      inject: [ConfigService],
    },

    // Redis Token Service (for distributed locks)
    // Redis Token Service (for distributed locks)
    RedisTokenService,

    // Application Layer
    SendNotificationUseCase,

    // Infrastructure Layer: Port Implementations
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PostgresNotificationRepository,
    },
    {
      provide: EMAIL_PROVIDER,
      useClass: SendGridEmailProvider,
    },
    {
      provide: SMS_PROVIDER,
      useClass: TwilioSMSProvider,
    },
    {
      provide: PUSH_PROVIDER,
      useClass: FirebasePushProvider,
    },
    {
      provide: TEMPLATE_SERVICE,
      useClass: NotificationTemplateService,
    },

    // Event Sourcing for audit trail
    EventStoreService,

    // Outbox Pattern for transactional messaging
    OutboxService,

    // Dead Letter Queue for failed processing
    DeadLetterQueueService,
  ],
  controllers: [
    NotificationController,
    HealthController,
  ],
})
export class AppModule { }
