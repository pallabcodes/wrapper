import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
// import { SqsClient } from '@aws-sdk/client-sqs'; // TODO: Install when implementing AWS SQS

// Domain Ports
import { USER_REPOSITORY } from './domain/ports/user-repository.port';
import { AUTH_SERVICE } from './domain/ports/auth-service.port';
import { NOTIFICATION_SERVICE } from './domain/ports/notification-service.port';

// Infrastructure Implementations
import { PostgresUserRepository } from './infrastructure/persistence/postgres-user.repository';
import { UserEntity } from './infrastructure/persistence/entities/user.entity';
import { JwtAuthService } from './infrastructure/auth/jwt-auth.service';
import { GoogleOAuthStrategy } from './infrastructure/auth/google-oauth.strategy';
import { RedisTokenService } from './infrastructure/cache/redis-token.service';
import { RateLimitGuard } from './infrastructure/security/rate-limit.guard';
import { MessageQueueNotificationService } from './infrastructure/messaging/notification.service';
import { AWSService } from './infrastructure/aws/aws.service';

// Application Layer
import { RegisterUserUseCase } from './application/use-cases/register-user.usecase';
import { LoginUserUseCase } from './application/use-cases/login-user.usecase';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.usecase';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.usecase';
import { GoogleLoginUseCase } from './application/use-cases/google-login.usecase';
import { RequestMagicLinkUseCase } from './application/use-cases/request-magic-link.usecase';
import { VerifyMagicLinkUseCase } from './application/use-cases/verify-magic-link.usecase';
import { RequestOtpUseCase } from './application/use-cases/request-otp.usecase';
import { VerifyOtpUseCase } from './application/use-cases/verify-otp.usecase';

// Presentation Layer
import { UserController } from './presentation/http/controllers/user.controller';
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
      envFilePath: process.env.NODE_ENV === 'production' ? undefined : ['.env.local', '.env'],
      cache: true, // Cache environment variables for better performance
      expandVariables: true, // Allow interpolation like ${PORT}
    }),

    // Database - Support both local PostgreSQL and AWS RDS
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const useAWSServices = configService.get('USE_AWS_SERVICES') === 'true';
        const isProduction = configService.get('NODE_ENV') === 'production';

        const baseConfig = {
          type: 'postgres' as const,
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get('DB_PORT', 5432) as number,
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'password'),
          database: configService.get('DB_NAME', 'streamverse'),
          entities: [UserEntity],
          synchronize: !isProduction, // Never auto-sync in production
          logging: configService.get('NODE_ENV') === 'development',
        };

        if (useAWSServices && isProduction) {
          // AWS RDS specific configuration
          console.log('🗄️ Using AWS RDS PostgreSQL');
          return {
            ...baseConfig,
            ssl: {
              rejectUnauthorized: false, // AWS RDS requires SSL
            },
            extra: {
              // AWS RDS specific connection options
              connectionTimeoutMillis: 2000,
              query_timeout: 10000,
              statement_timeout: 60000,
            },
          };
        } else {
          // Local PostgreSQL configuration
          console.log('🗄️ Using local PostgreSQL');
          return baseConfig;
        }
      },
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([UserEntity]),

    // Passport for OAuth strategies
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT Authentication - registerAsync: access ConfigModule env vars for JWT secret
    // Conditional config: stricter settings in production (15m expiry) vs dev (1h expiry)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'fallback-secret'),
        signOptions: {
          expiresIn: configService.get('NODE_ENV') === 'production' ? '15m' : '1h',
          // issuer: 'streamverse-api',
          // audience: configService.get('NODE_ENV') === 'production'
          //   ? ['streamverse-api']
          //   : ['streamverse-api', 'streamverse-dev'],
        },
      }),
      inject: [ConfigService],
    }),

    // Message Queue (Kafka locally, SQS on AWS)
    // Microservices Communication - Async config: access ConfigModule for broker URLs
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_SERVICE', // Token for dependency injection (used in MessageQueueNotificationService)
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const isProduction = configService.get('NODE_ENV') === 'production';


          // Choose transport based on environment and configuration
          const useAWSServices = configService.get('USE_AWS_SERVICES') === 'true';

          if (isProduction && useAWSServices) {
            // Production on AWS: Use SQS for messaging
            // TODO: Install @aws-sdk/client-sqs and implement SQS transport
            console.log('🚀 Using AWS SQS for messaging (production AWS deployment)');
            throw new Error('AWS SQS transport not yet implemented - install @aws-sdk/client-sqs');
            // return {
            //   transport: Transport.SQS,
            //   options: {
            //     client: new SqsClient({
            //       region: configService.get('AWS_REGION'),
            //       credentials: { /* AWS credentials */ }
            //     }),
            //     queueUrl: configService.get('NOTIFICATION_QUEUE_URL'),
            //   },
            // };
          } else {
            // Development or non-AWS production: Use Kafka
            console.log('📨 Using Kafka for messaging');
            return {
              transport: Transport.KAFKA,
              options: {
                client: {
                  brokers: [configService.get('KAFKA_BROKERS', 'localhost:9092')],
                },
                consumer: {
                  groupId: isProduction ? 'user-service-notifications-prod' : 'user-service',
                },
              },
            };
          }
        },
        inject: [ConfigService],
      },
    ]),
  ],

  controllers: [
    UserController,   // HTTP REST API
    HealthController, // Health checks
  ],

  providers: [
    // Application Layer
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokenUseCase,
    VerifyEmailUseCase,
    GoogleLoginUseCase,
    RequestMagicLinkUseCase,
    VerifyMagicLinkUseCase,
    RequestOtpUseCase,
    VerifyOtpUseCase,

    // Infrastructure Layer: Port Implementations (adapters)
    {
      provide: USER_REPOSITORY,
      useClass: PostgresUserRepository,
    },
    {
      provide: AUTH_SERVICE,
      useClass: JwtAuthService,
    },
    {
      provide: NOTIFICATION_SERVICE,
      useClass: MessageQueueNotificationService,
    },

    RedisTokenService,
    RateLimitGuard,
    AWSService,
    GoogleOAuthStrategy, // Passport strategy for Google OAuth
  ],
})
export class AppModule { }