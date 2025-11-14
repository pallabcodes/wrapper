import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { CircuitBreakerModule } from './common/circuit-breaker/circuit-breaker.module';

/**
 * CQRS App Module
 * 
 * Demonstrates provider patterns in CQRS architecture context
 */
@Module({
  imports: [
    AuthModule,
    CircuitBreakerModule,
  ],
  providers: [
    // useClass: Command/Query handlers
    {
      provide: 'COMMAND_HANDLER_REGISTRY',
      useClass: class CommandHandlerRegistry {
        private handlers = new Map();

        register(command: string, handler: any) {
          this.handlers.set(command, handler);
        }

        get(command: string) {
          return this.handlers.get(command);
        }
      },
    },

    // useValue: CQRS configuration
    {
      provide: 'CQRS_CONFIG',
      useValue: {
        enableEventSourcing: true,
        enableProjections: true,
        readWriteSeparation: true,
        eventStore: {
          type: 'in-memory', // or 'database', 'eventstore'
        },
      },
    },

    // useFactory: Create CQRS bus based on config
    {
      provide: 'COMMAND_BUS',
      useFactory: (config: any) => {
        if (config.enableEventSourcing) {
          return {
            execute: async (command: any) => {
              console.log('Executing command with event sourcing:', command);
              // Event sourcing implementation
            },
          };
        } else {
          return {
            execute: async (command: any) => {
              console.log('Executing command:', command);
              // Standard implementation
            },
          };
        }
      },
      inject: ['CQRS_CONFIG'],
    },

    // useExisting: Alias for query bus
    {
      provide: 'QUERY_BUS',
      useExisting: 'COMMAND_BUS', // In real implementation, would be separate
    },
  ],
  exports: [
    'COMMAND_HANDLER_REGISTRY',
    'CQRS_CONFIG',
    'COMMAND_BUS',
    'QUERY_BUS',
  ],
})
export class AppModule {}

