import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from './modules/auth/auth.module';

/**
 * Event Sourcing App Module
 *
 * Demonstrates provider patterns in Event Sourcing context
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CqrsModule,
    AuthModule,
  ],
  providers: [
    // useClass: Event store implementation
    {
      provide: 'EVENT_STORE',
      useClass: class EventStore {
        private events: any[] = [];

        async append(streamId: string, events: any[]) {
          this.events.push(...events.map((e) => ({ ...e, streamId, timestamp: new Date() })));
          console.log(`Appended ${events.length} events to stream ${streamId}`);
        }

        async getEvents(streamId: string) {
          return this.events.filter((e) => e.streamId === streamId);
        }
      },
    },

    // useValue: Event sourcing configuration
    {
      provide: 'EVENT_SOURCING_CONFIG',
      useValue: {
        snapshotInterval: 100, // Create snapshot every N events
        enableSnapshots: true,
        eventStoreType: 'in-memory', // or 'database', 'eventstore-db'
      },
    },

    // useFactory: Create snapshot service based on config
    {
      provide: 'SNAPSHOT_SERVICE',
      useFactory: (config: any) => {
        if (config.enableSnapshots) {
          return {
            createSnapshot: async (aggregateId: string, state: any) => {
              console.log(`Creating snapshot for ${aggregateId} at event ${config.snapshotInterval}`);
              return { aggregateId, state, version: config.snapshotInterval };
            },
            getSnapshot: async (aggregateId: string) => {
              console.log(`Getting snapshot for ${aggregateId}`);
              return null;
            },
          };
        } else {
          return {
            createSnapshot: async () => {},
            getSnapshot: async () => null,
          };
        }
      },
      inject: ['EVENT_SOURCING_CONFIG'],
    },

    // useExisting: Alias for event store
    {
      provide: 'STORE',
      useExisting: 'EVENT_STORE',
    },
  ],
  exports: [
    'EVENT_STORE',
    'STORE',
    'EVENT_SOURCING_CONFIG',
    'SNAPSHOT_SERVICE',
  ],
})
export class AppModule {}

