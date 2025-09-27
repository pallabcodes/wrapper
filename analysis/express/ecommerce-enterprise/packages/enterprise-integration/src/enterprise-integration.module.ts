import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnterpriseIntegrationOptions } from './interfaces/enterprise-options.interface';
import { EnterpriseIntegrationService } from './services/enterprise-integration.service';
import { SAPService } from './services/sap.service';
import { SalesforceService } from './services/salesforce.service';
import { CacheService } from './services/cache.service';
import { RetryService } from './services/retry.service';
import { EnterpriseIntegrationValidationModule } from './modules/enterprise-integration-validation.module';

@Module({})
export class EnterpriseIntegrationModule {
  static forRoot(options: EnterpriseIntegrationOptions = {}): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'ENTERPRISE_INTEGRATION_OPTIONS',
        useValue: options,
      },
      CacheService,
      RetryService,
      SAPService,
      SalesforceService,
      EnterpriseIntegrationService,
    ];

    return {
      module: EnterpriseIntegrationModule,
      imports: [ConfigModule, EnterpriseIntegrationValidationModule],
      providers,
      exports: [
        EnterpriseIntegrationService,
        SAPService,
        SalesforceService,
        CacheService,
        RetryService,
      ],
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<EnterpriseIntegrationOptions> | EnterpriseIntegrationOptions;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'ENTERPRISE_INTEGRATION_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      CacheService,
      RetryService,
      SAPService,
      SalesforceService,
      EnterpriseIntegrationService,
    ];

    return {
      module: EnterpriseIntegrationModule,
      imports: [ConfigModule, EnterpriseIntegrationValidationModule, ...(options.imports || [])],
      providers,
      exports: [
        EnterpriseIntegrationService,
        SAPService,
        SalesforceService,
        CacheService,
        RetryService,
      ],
    };
  }
}
