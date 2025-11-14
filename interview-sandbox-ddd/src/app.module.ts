import { Module } from '@nestjs/common';
import { BootstrapModule } from './common/bootstrap/bootstrap.module';
import { ScopedServicesModule } from './common/scopes/scoped-services.module';

/**
 * DDD App Module
 * 
 * Demonstrates provider patterns in Domain-Driven Design context
 */
@Module({
  imports: [
    BootstrapModule,
    ScopedServicesModule,
  ],
  providers: [
    // useClass: Domain service
    {
      provide: 'DOMAIN_SERVICE',
      useClass: class DomainService {
        validateBusinessRule(data: any): boolean {
          // Domain validation logic
          return true;
        }
      },
    },

    // useValue: Bounded context configuration
    {
      provide: 'BOUNDED_CONTEXT_CONFIG',
      useValue: {
        contexts: ['auth', 'user', 'payment', 'notification'],
        eventDriven: true,
        sharedKernel: true,
      },
    },

    // useFactory: Create aggregate repository based on context
    {
      provide: 'AGGREGATE_REPOSITORY_FACTORY',
      useFactory: (config: any) => {
        return {
          create: (context: string, aggregateType: string) => {
            console.log(`Creating repository for ${aggregateType} in ${context} context`);
            return {
              save: async (aggregate: any) => {
                console.log(`Saving ${aggregateType} aggregate`);
              },
              findById: async (id: string) => {
                console.log(`Finding ${aggregateType} by id: ${id}`);
                return null;
              },
            };
          },
        };
      },
      inject: ['BOUNDED_CONTEXT_CONFIG'],
    },

    // useExisting: Alias for domain service
    {
      provide: 'BUSINESS_RULE_VALIDATOR',
      useExisting: 'DOMAIN_SERVICE',
    },
  ],
  exports: [
    'DOMAIN_SERVICE',
    'BUSINESS_RULE_VALIDATOR',
    'BOUNDED_CONTEXT_CONFIG',
    'AGGREGATE_REPOSITORY_FACTORY',
  ],
})
export class AppModule {}

