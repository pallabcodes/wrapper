import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventStreamingService } from './services/event-streaming.service';
import { KafkaService } from './services/kafka.service';
import { RabbitMQService } from './services/rabbitmq.service';
import { RedisService } from './services/redis.service';
import { EventStreamingGuard } from './guards/event-streaming.guard';
import { EventStreamingInterceptor } from './interceptors/event-streaming.interceptor';
import { EventStreamingConfig, EventStreamingOptions } from './interfaces/event-streaming.interface';

export interface EventStreamingModuleOptions {
  config: EventStreamingConfig;
  options?: EventStreamingOptions;
  global?: boolean;
}

@Module({})
export class EventStreamingModule {
  static forRoot(options: EventStreamingModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'EVENT_STREAMING_CONFIG',
        useValue: options.config,
      },
      {
        provide: 'EVENT_STREAMING_OPTIONS',
        useValue: options.options || {},
      },
    ];

    // Add provider-specific services based on configuration
    switch (options.config.provider) {
      case 'kafka':
        providers.push(KafkaService);
        break;
      case 'rabbitmq':
        providers.push(RabbitMQService);
        break;
      case 'redis':
        providers.push(RedisService);
        break;
      default:
        throw new Error(`Unsupported event streaming provider: ${options.config.provider}`);
    }

    // Add all services as optional providers
    providers.push(
      { provide: KafkaService, useClass: KafkaService },
      { provide: RabbitMQService, useClass: RabbitMQService },
      { provide: RedisService, useClass: RedisService },
    );

    providers.push(
      EventStreamingService,
      EventStreamingGuard,
      EventStreamingInterceptor,
    );

    return {
      module: EventStreamingModule,
      imports: [
        ConfigModule,
        EventEmitterModule.forRoot(),
      ],
      providers,
      exports: [
        EventStreamingService,
        EventStreamingGuard,
        EventStreamingInterceptor,
      ],
      global: options.global || false,
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<EventStreamingModuleOptions> | EventStreamingModuleOptions;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'EVENT_STREAMING_CONFIG',
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args);
          return config.config;
        },
        inject: options.inject || [],
      },
      {
        provide: 'EVENT_STREAMING_OPTIONS',
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args);
          return config.options || {};
        },
        inject: options.inject || [],
      },
    ];

    // Add provider-specific services based on configuration
    providers.push(
      {
        provide: 'EVENT_STREAMING_PROVIDER',
        useFactory: (configService: ConfigService) => {
          const config = configService.get<EventStreamingConfig>('EVENT_STREAMING_CONFIG');
          switch (config?.provider) {
            case 'kafka':
              return KafkaService;
            case 'rabbitmq':
              return RabbitMQService;
            case 'redis':
              return RedisService;
            default:
              throw new Error(`Unsupported event streaming provider: ${config?.provider}`);
          }
        },
        inject: [ConfigService],
      },
      EventStreamingService,
      EventStreamingGuard,
      EventStreamingInterceptor,
    );

    return {
      module: EventStreamingModule,
      imports: [
        ConfigModule,
        EventEmitterModule.forRoot(),
        ...(options.imports || []),
      ],
      providers,
      exports: [
        EventStreamingService,
        EventStreamingGuard,
        EventStreamingInterceptor,
      ],
    };
  }
}
