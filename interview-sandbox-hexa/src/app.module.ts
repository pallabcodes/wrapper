import { Module, ValidationPipe, Inject } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DIModule } from './common/di/di.module';
import { WorkerThreadsModule } from './infrastructure/external/worker-threads/worker-threads.module';
import { CacheModule } from './common/configurable/configurable-cache.module';
import { ApplicationModule } from './application/application.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import authConfig from './common/config/auth.config';

/**
 * App Module
 * 
 * Demonstrates all provider registration patterns:
 * - useClass: Provide implementation class
 * - useValue: Provide a value/object directly
 * - useFactory: Create provider using factory function
 * - useExisting: Alias to existing provider
 * 
 * When to put code in AppModule:
 * - Global providers that need to be available everywhere
 * - Application-level configuration
 * - Cross-cutting concerns (logging, error handling)
 * - Root-level services
 * - Global guards, interceptors, filters
 */
@Module({
  imports: [
    // Configuration module - loads environment variables and configs
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig],
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),
    // Regular module imports
    DIModule,
    WorkerThreadsModule,
    ApplicationModule,
    
    // Configurable module with options
    CacheModule.forRoot({
      ttl: 3600,
      maxSize: 1000,
      strategy: 'lru',
      enabled: true,
    }),
  ],
  providers: [
    // Global Validation Pipe - validates all DTOs automatically
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    // Global JWT Auth Guard - protects all routes by default
    // Use @Public() decorator to make routes public
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 1. useClass - Provide implementation class
    // Use when: You want NestJS to instantiate the class
    {
      provide: 'STRING_SERVICE',
      useClass: class StringService {
        reverse(str: string): string {
          return str.split('').reverse().join('');
        }
      },
    },

    // 2. useValue - Provide a value directly
    // Use when: You have a pre-created instance or simple value
    {
      provide: 'APP_CONFIG',
      useValue: {
        name: 'Hexagonal Architecture App',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        features: {
          caching: true,
          workerThreads: true,
        },
      },
    },

    // 3. useFactory - Create provider using factory function
    // Use when: You need dynamic creation based on other dependencies
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: (config: any) => {
        // Factory can inject other providers
        console.log(`Creating database connection for ${config.environment}`);
        return {
          connect: async () => {
            console.log('Database connected');
          },
          disconnect: async () => {
            console.log('Database disconnected');
          },
          query: async (sql: string) => {
            console.log(`Executing query: ${sql}`);
            return [];
          },
        };
      },
      inject: ['APP_CONFIG'], // Inject dependencies
    },

    // 4. useExisting - Alias to existing provider
    // Use when: You want to provide the same instance under different tokens
    {
      provide: 'CONFIG',
      useExisting: 'APP_CONFIG', // Points to APP_CONFIG provider
    },

    // Example: Factory with async initialization
    {
      provide: 'ASYNC_SERVICE',
      useFactory: async (config: any) => {
        // Simulate async initialization
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
          initialized: true,
          config: config.name,
          initialize: async () => {
            console.log('Async service initialized');
          },
        };
      },
      inject: ['APP_CONFIG'],
    },

    // Example: Conditional provider based on environment
    {
      provide: 'LOGGER_IMPL',
      useFactory: (config: any) => {
        if (config.environment === 'production') {
          return {
            log: (message: string) => {
              // Production logger (e.g., Winston, Pino)
              console.log(`[PROD] ${message}`);
            },
          };
        } else {
          return {
            log: (message: string) => {
              // Development logger (verbose)
              console.log(`[DEV] ${new Date().toISOString()} - ${message}`);
            },
          };
        }
      },
      inject: ['APP_CONFIG'],
    },
  ],
  exports: [
    'STRING_SERVICE',
    'APP_CONFIG',
    'CONFIG',
    'DATABASE_CONNECTION',
    'ASYNC_SERVICE',
    'LOGGER_IMPL',
  ],
})
export class AppModule {
  /**
   * Constructor injection example
   * AppModule can inject providers to perform initialization
   */
  constructor(
    @Inject('APP_CONFIG') private readonly config: any, // Injected via useValue
    @Inject('DATABASE_CONNECTION') private readonly dbConnection: any, // Injected via useFactory
  ) {
    console.log('AppModule initialized');
    console.log('App Config:', this.config);
  }
}

