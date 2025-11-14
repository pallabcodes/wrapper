import { Module } from '@nestjs/common';
import { LOGGER_TOKEN, CACHE_TOKEN, EMAIL_TOKEN } from './tokens';
import { LoggerService, UserService } from '../../infrastructure/external/logger.service';

/**
 * Dependency Injection Module
 * 
 * Demonstrates registering providers using Symbol tokens
 * This pattern prevents token collision and provides better type safety
 */
@Module({
  providers: [
    // Using Symbol token with useClass
    {
      provide: LOGGER_TOKEN,
      useClass: LoggerService,
    },
    // Using Symbol token with useValue (for mock/test implementations)
    {
      provide: CACHE_TOKEN,
      useValue: {
        get: async (key: string) => null,
        set: async (key: string, value: any) => {},
        delete: async (key: string) => {},
      },
    },
    // Using Symbol token with useFactory (for dynamic creation)
    {
      provide: EMAIL_TOKEN,
      useFactory: () => {
        return {
          send: async (to: string, subject: string, body: string) => {
            console.log(`Sending email to ${to}: ${subject}`);
          },
        };
      },
    },
    // Regular service that depends on Symbol-injected service
    UserService,
  ],
  exports: [LOGGER_TOKEN, CACHE_TOKEN, EMAIL_TOKEN, UserService],
})
export class DIModule {}

