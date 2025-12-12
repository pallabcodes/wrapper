import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_FILTER } from '@nestjs/core';
import { AuthController } from './presentation/controllers/auth.controller';
import { HealthController } from './presentation/controllers/health.controller';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { UserRepositoryPort, USER_REPOSITORY_PORT } from './domain/ports/output/user.repository.port';
import { SequelizeUserRepositoryAdapter } from './infrastructure/persistence/adapters/user.repository.adapter';
import { UserModel } from './infrastructure/persistence/models/user.model';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { JwtService } from './infrastructure/auth/jwt.service';
import { AUTH_CONFIG_TOKEN, createAuthConfig } from './infrastructure/config/auth.config';
import { HealthService } from './infrastructure/monitoring/health.service';
import { CacheService } from './infrastructure/cache/cache.service';
import { CustomLoggerService } from './infrastructure/logging/logger.service';
import { MetricsService } from './infrastructure/monitoring/metrics.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'interview_db_cl',

      // Connection Pool Configuration
      pool: {
        max: parseInt(process.env.DB_POOL_MAX || '10'), // Maximum connections
        min: parseInt(process.env.DB_POOL_MIN || '2'),  // Minimum connections
        acquire: 60000, // Maximum time to get connection (ms)
        idle: 10000,    // Maximum idle time (ms)
      },

      // Performance & Reliability
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      benchmark: process.env.NODE_ENV === 'development',
      dialectOptions: {
        charset: 'utf8mb4',
        supportBigNumbers: true,
        bigNumberStrings: true,
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000,
      },

      // Model Loading
      autoLoadModels: true,
      synchronize: process.env.NODE_ENV !== 'production',

      // Additional options
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
    }),
    SequelizeModule.forFeature([UserModel]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const auth = createAuthConfig(configService);
        return {
          secret: auth.JWT.SECRET,
          signOptions: { expiresIn: auth.JWT.ACCESS_TOKEN_EXPIRATION as any },
        };
      },
    }),
  ],
  controllers: [AuthController, HealthController],
  providers: [
    // Application Layer: Use Cases
    RegisterUserUseCase,
    LoginUserUseCase,

    // Infrastructure Layer: Adapters
    SequelizeUserRepositoryAdapter,
    JwtStrategy,
    JwtService,
    HealthService,
    MetricsService,
    CacheService,
    CustomLoggerService,

    // Auth config
    {
      provide: AUTH_CONFIG_TOKEN,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => createAuthConfig(configService),
    },

    // Dependency Inversion: Wire Ports to Adapters
    {
      provide: USER_REPOSITORY_PORT,
      useClass: SequelizeUserRepositoryAdapter,
    },

    // Exception Filters
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}

