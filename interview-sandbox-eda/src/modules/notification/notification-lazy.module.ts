import { DynamicModule, Module } from '@nestjs/common';

/**
 * Lazy Notification Module
 * 
 * Demonstrates module that can be loaded lazily
 * This module is only loaded when needed (e.g., when notification feature is enabled)
 */
@Module({})
export class NotificationLazyModule {
  /**
   * Static method for dynamic module registration
   * This allows the module to be registered conditionally
   */
  static forRoot(options?: { enabled: boolean }): DynamicModule {
    if (options && !options.enabled) {
      // Return empty module if disabled
      return {
        module: NotificationLazyModule,
        providers: [],
        exports: [],
      };
    }

    return {
      module: NotificationLazyModule,
      providers: [
        {
          provide: 'NOTIFICATION_SERVICE',
          useFactory: () => ({
            send: async (message: string) => {
              console.log(`Notification sent: ${message}`);
            },
          }),
        },
      ],
      exports: ['NOTIFICATION_SERVICE'],
    };
  }

  /**
   * Async registration with factory
   */
  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<{ enabled: boolean }> | { enabled: boolean };
    inject?: any[];
  }): DynamicModule {
    return {
      module: NotificationLazyModule,
      providers: [
        {
          provide: 'NOTIFICATION_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: 'NOTIFICATION_SERVICE',
          useFactory: async (config: { enabled: boolean }) => {
            if (!config.enabled) {
              return null;
            }
            return {
              send: async (message: string) => {
                console.log(`Notification sent: ${message}`);
              },
            };
          },
          inject: ['NOTIFICATION_CONFIG'],
        },
      ],
      exports: ['NOTIFICATION_SERVICE'],
    };
  }
}

