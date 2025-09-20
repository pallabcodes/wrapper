import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { SchemaRegistry } from './schemas/schema-registry';
import { ValidationCache } from './utils/validation-cache';
import { ValidationOptions } from './interfaces/validation-options.interface';

@Module({})
export class ValidationModule {
  static forRoot(options: ValidationOptions = {}): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'VALIDATION_OPTIONS',
        useValue: options,
      },
      ValidationService,
      SchemaRegistry,
      ValidationCache,
    ];

    return {
      module: ValidationModule,
      providers,
      exports: [ValidationService, SchemaRegistry, ValidationCache],
      global: options.global || false,
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<ValidationOptions> | ValidationOptions;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'VALIDATION_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      ValidationService,
      SchemaRegistry,
      ValidationCache,
    ];

    return {
      module: ValidationModule,
      providers,
      exports: [ValidationService, SchemaRegistry, ValidationCache],
      global: false,
    };
  }
}
