/**
 * Application Module
 * 
 * Wires together all layers:
 * - Domain: Entities, Ports
 * - Application: Services, DTOs
 * - Infrastructure: Adapters (Repository, Event Publisher)
 * - Presentation: Handlers (Lambda handlers)
 * 
 * This is the "Module" in Hexagonal Architecture
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './application/services/auth.service';
import { UserService } from './application/services/user.service';
import { PaymentService } from './application/services/payment.service';
import { DynamoDBUserRepositoryAdapter } from './infrastructure/persistence/dynamodb.user.repository.adapter';
import { DynamoDBPaymentRepositoryAdapter } from './infrastructure/persistence/dynamodb.payment.repository.adapter';
import { SQSEventPublisherAdapter } from './infrastructure/messaging/sqs.event.publisher.adapter';
import { UserRepositoryPort, USER_REPOSITORY_PORT } from './domain/ports/user.repository.port';
import { PaymentRepositoryPort, PAYMENT_REPOSITORY_PORT } from './domain/ports/payment.repository.port';
import { EventPublisherPort, EVENT_PUBLISHER_PORT } from './domain/ports/event.publisher.port';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  providers: [
    // Application Services
    AuthService,
    UserService,
    PaymentService,
    // Wire Ports to Adapters (Dependency Inversion)
    {
      provide: USER_REPOSITORY_PORT,
      useClass: DynamoDBUserRepositoryAdapter,
    },
    {
      provide: PAYMENT_REPOSITORY_PORT,
      useClass: DynamoDBPaymentRepositoryAdapter,
    },
    {
      provide: EVENT_PUBLISHER_PORT,
      useClass: SQSEventPublisherAdapter,
    },
  ],
  exports: [
    AuthService,
    UserService,
    PaymentService,
  ],
})
export class AppModule {}

