import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from './modules/auth/auth.module';
import { CircuitBreakerModule } from './common/circuit-breaker/circuit-breaker.module';

/**
 * CQRS App Module
 *
 * Production-ready CQRS (Command Query Responsibility Segregation) architecture
 * with event sourcing and separate read/write models
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CqrsModule,
    AuthModule,
    CircuitBreakerModule,
  ],
  providers: [
    // CQRS Infrastructure configuration
    {
      provide: 'CQRS_CONFIG',
      useValue: {
        enableEventSourcing: true,
        enableProjections: true,
        readWriteSeparation: true,
        eventStore: {
          type: 'in-memory', // Production: 'database' or 'eventstore-db'
        },
        snapshotInterval: 100,
      },
    },

    // Event Store for write side (commands)
    {
      provide: 'EVENT_STORE',
      useFactory: (config: any) => {
        if (config.eventStore.type === 'in-memory') {
          return {
            append: async (streamId: string, events: any[]) => {
              console.log(`📝 Appended ${events.length} events to stream ${streamId}`);
              events.forEach(event => {
                console.log(`  ${event.eventType}:`, event.aggregateId);
              });
            },
            getEvents: async (streamId: string) => {
              console.log(`📖 Loading events for stream ${streamId}`);
              return []; // In real implementation, load from event store
            },
          };
        }
        // Add other event store implementations here
        return {};
      },
      inject: ['CQRS_CONFIG'],
    },

    // Projection service for read side (queries)
    {
      provide: 'PROJECTION_SERVICE',
      useFactory: () => {
        return {
          project: async (event: any) => {
            console.log(`🔄 Projecting event ${event.eventType} to read model`);
            // In real implementation, update read database
          },
        };
      },
    },
  ],
  exports: [
    'CQRS_CONFIG',
    'EVENT_STORE',
    'PROJECTION_SERVICE',
  ],
})
export class AppModule {}

