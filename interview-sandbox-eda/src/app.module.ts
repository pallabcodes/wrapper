import { Module } from '@nestjs/common';
import { EventEmitterModule } from './event-bus/event-emitter.module';
import { LazyLoadingModule } from './common/lazy-loading/lazy-loading.module';
import { NotificationLazyModule } from './modules/notification/notification-lazy.module';

/**
 * Event-Driven Architecture App Module
 * 
 * Demonstrates provider patterns in EDA context
 */
@Module({
  imports: [
    EventEmitterModule,
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
    // useClass: Event handler registry
    {
      provide: 'EVENT_HANDLER_REGISTRY',
      useClass: class EventHandlerRegistry {
        private handlers = new Map();

        register(event: string, handler: any) {
          this.handlers.set(event, handler);
        }

        get(event: string) {
          return this.handlers.get(event);
        }

        getAll() {
          return Array.from(this.handlers.entries());
        }
      },
    },

    // useValue: Event bus configuration
    {
      provide: 'EVENT_BUS_CONFIG',
      useValue: {
        maxListeners: 100,
        wildcard: true,
        delimiter: '.',
        newListener: false,
        removeListener: false,
      },
    },

    // useFactory: Create event bus with configuration
    {
      provide: 'CUSTOM_EVENT_BUS',
      useFactory: (config: any) => {
        return {
          emit: (event: string, data: any) => {
            console.log(`[EventBus] Emitting ${event}:`, data);
          },
          on: (event: string, handler: Function) => {
            console.log(`[EventBus] Registered listener for ${event}`);
          },
          config,
        };
      },
      inject: ['EVENT_BUS_CONFIG'],
    },

    // useExisting: Alias for event handler registry
    {
      provide: 'HANDLER_REGISTRY',
      useExisting: 'EVENT_HANDLER_REGISTRY',
    },
  ],
  exports: [
    'EVENT_HANDLER_REGISTRY',
    'HANDLER_REGISTRY',
    'EVENT_BUS_CONFIG',
    'CUSTOM_EVENT_BUS',
  ],
})
export class AppModule {}

