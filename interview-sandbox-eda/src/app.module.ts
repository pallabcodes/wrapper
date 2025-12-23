import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './modules/auth/auth.module';
import { LazyLoadingModule } from './common/lazy-loading/lazy-loading.module';
import { NotificationLazyModule } from './modules/notification/notification-lazy.module';

/**
 * Event-Driven Architecture App Module
 *
 * Production-ready EDA (Event-Driven Architecture) application
 * with domain events, event handlers, and asynchronous processing
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Event Emitter for domain events
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
    }),
    AuthModule,
    LazyLoadingModule,

    // Lazy module loaded conditionally
    NotificationLazyModule.forRootAsync({
      useFactory: async () => {
        // Check if notifications are enabled
        const enabled = process.env.NOTIFICATIONS_ENABLED === 'true';
        return { enabled };
      },
    }),
  ],
  providers: [
    // Event-Driven Architecture Infrastructure

    // Event Handler Registry - manages event subscriptions
    {
      provide: 'EVENT_HANDLER_REGISTRY',
      useClass: class EventHandlerRegistry {
        private handlers = new Map<string, ((...args: any[]) => any)[]>();

        register(eventType: string, handler: (...args: any[]) => any): void {
          if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
          }
          this.handlers.get(eventType)!.push(handler);
          console.log(`📝 Registered handler for event: ${eventType}`);
        }

        getHandlers(eventType: string): ((...args: any[]) => any)[] {
          return this.handlers.get(eventType) || [];
        }

        getAllHandlers(): Map<string, ((...args: any[]) => any)[]> {
          return new Map(this.handlers);
        }
      },
    },

    // Event Bus Configuration
    {
      provide: 'EVENT_BUS_CONFIG',
      useValue: {
        maxListeners: 100,
        wildcard: true,
        delimiter: '.',
        newListener: false,
        removeListener: false,
        verbose: process.env.NODE_ENV === 'development',
      },
    },

    // Domain Event Publisher
    {
      provide: 'DOMAIN_EVENT_PUBLISHER',
      useFactory: (eventEmitter: any, _config: any) => {
        const publish = async (event: any) => {
          console.log(`📡 Publishing domain event: ${event.eventType}`, {
            aggregateId: event.aggregateId,
            timestamp: event.timestamp,
          });

          // Publish to event emitter
          eventEmitter.emit(event.eventType, event);
        };

        return {
          publish,
          publishAll: async (events: any[]) => {
            for (const event of events) {
              await publish(event);
            }
          },
        };
      },
      inject: ['CUSTOM_EVENT_BUS', 'EVENT_BUS_CONFIG'],
    },

    // Custom Event Bus Implementation
    {
      provide: 'CUSTOM_EVENT_BUS',
      useFactory: (config: any) => {
        return {
          emit: (event: string, data: any) => {
            if (config.verbose) {
              console.log(`[EventBus] Emitting ${event}:`, data);
            }
          },
          on: (event: string, _handler: (...args: any[]) => any) => {
            if (config.verbose) {
              console.log(`[EventBus] Registered listener for ${event}`);
            }
          },
          config,
        };
      },
      inject: ['EVENT_BUS_CONFIG'],
    },

    // Event Store (for event sourcing if needed)
    {
      provide: 'EVENT_STORE',
      useFactory: () => {
        const events: any[] = [];
        return {
          append: async (streamId: string, eventData: any[]) => {
            const eventsWithMetadata = eventData.map(event => ({
              ...event,
              streamId,
              storedAt: new Date(),
              sequenceNumber: events.length + 1,
            }));
            events.push(...eventsWithMetadata);
            console.log(`💾 Stored ${eventData.length} events for stream: ${streamId}`);
          },
          getEvents: async (streamId: string) => {
            return events.filter(e => e.streamId === streamId);
          },
          getAllEvents: () => events,
        };
      },
    },
  ],
  exports: [
    'EVENT_HANDLER_REGISTRY',
    'DOMAIN_EVENT_PUBLISHER',
    'EVENT_BUS_CONFIG',
    'CUSTOM_EVENT_BUS',
    'EVENT_STORE',
  ],
})
export class AppModule { }

