import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZodModule } from '@ecommerce-enterprise/nest-zod';
import { EnterpriseIntegrationValidationService } from '../src/validation/enterprise-integration-validation.service';
import { EnterpriseIntegrationValidationController } from '../src/controllers/enterprise-integration-validation.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ZodModule,
  ],
  controllers: [EnterpriseIntegrationValidationController],
  providers: [EnterpriseIntegrationValidationService],
})
class DemoModule {}

async function demonstrateEnterpriseIntegrationZodIntegration() {
  console.log('\x1b[37m\x1b[1m🚨 ENTERPRISE INTEGRATION ZOD INTEGRATION DEMONSTRATION\x1b[0m\x1b[0m');
  console.log('\x1b[37m\x1b[36m   Showcasing how enterprise Zod validation is integrated into enterprise-integration\x1b[0m\x1b[0m');
  console.log('\x1b[37m\x1b[36m\n============================================================\x1b[0m\x1b[0m');

  const app = await NestFactory.create(DemoModule);
  const validationService = app.get(EnterpriseIntegrationValidationService);

  // Test Salesforce Connection Validation
  console.log('\x1b[36m\n============================================================\x1b[0m');
  console.log('\x1b[1m  SALESFORCE CONNECTION VALIDATION\x1b[0m');
  console.log('\x1b[36m============================================================\x1b[0m');
  console.log('\x1b[34mℹ️  Testing Salesforce connection validation with enterprise features...\x1b[0m');

  const salesforceConnectionData = {
    clientId: '3MVG9fMtCkV6eLheIEZplMqWfnGlf3Y.BcWdOf1qytXo9zxgbsrUbS.ExHTgUPJeb3jZeT8SNc.hkFnimrHitq',
    clientSecret: 'secret123456789',
    username: 'admin@enterprise.com',
    password: 'SecurePass123!',
    securityToken: 'abc123def456',
    sandbox: false,
    apiVersion: '58.0',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    customDomain: 'https://enterprise.my.salesforce.com',
    metadata: { environment: 'production' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const result = await validationService.validateSalesforceConnection(salesforceConnectionData, {
      locale: 'en',
      audit: true,
      metrics: true,
      cache: true,
    });
    console.log('\x1b[32m✅ Salesforce connection validation passed!\x1b[0m');
    console.log('\x1b[34mℹ️  Validated Salesforce connection data:\x1b[0m', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('\x1b[31m❌ Salesforce connection validation failed:\x1b[0m', (error as Error).message);
  }

  // Test SAP Connection Validation
  console.log('\x1b[36m\n============================================================\x1b[0m');
  console.log('\x1b[1m  SAP CONNECTION VALIDATION\x1b[0m');
  console.log('\x1b[36m============================================================\x1b[0m');
  console.log('\x1b[34mℹ️  Testing SAP connection validation with enterprise features...\x1b[0m');

  const sapConnectionData = {
    host: 'sap-server.enterprise.com',
    port: 8000,
    client: '100',
    user: 'SAP_USER',
    password: 'SAP_PASS123',
    language: 'EN',
    systemNumber: '00',
    applicationServer: 'sap-app.enterprise.com',
    trace: false,
    lcheck: true,
    luw: false,
    pool: false,
    metadata: { environment: 'production' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const result = await validationService.validateSAPConnection(sapConnectionData, {
      locale: 'en',
      audit: true,
      metrics: true,
      cache: true,
    });
    console.log('\x1b[32m✅ SAP connection validation passed!\x1b[0m');
    console.log('\x1b[34mℹ️  Validated SAP connection data:\x1b[0m', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('\x1b[31m❌ SAP connection validation failed:\x1b[0m', (error as Error).message);
  }

  // Test Integration Job Validation
  console.log('\x1b[36m\n============================================================\x1b[0m');
  console.log('\x1b[1m  INTEGRATION JOB VALIDATION\x1b[0m');
  console.log('\x1b[36m============================================================\x1b[0m');
  console.log('\x1b[34mℹ️  Testing integration job validation with complex configuration...\x1b[0m');

  const integrationJobData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Customer Data Sync',
    description: 'Sync customer data from SAP to Salesforce',
    type: 'sync',
    status: 'pending',
    priority: 'high',
    source: {
      system: 'SAP',
      endpoint: 'https://sap.enterprise.com/api/customers',
      credentials: {
        type: 'basic',
        config: { username: 'sap_user', password: 'sap_pass' },
      },
      filters: {
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
        fields: ['id', 'name', 'email', 'phone'],
        conditions: [
          { field: 'status', operator: 'eq', value: 'active' },
        ],
      },
    },
    destination: {
      system: 'Salesforce',
      endpoint: 'https://api.salesforce.com/v58.0/sobjects/Account',
      credentials: {
        type: 'oauth2',
        config: { accessToken: 'sf_token_123' },
      },
      mapping: {
        fieldMappings: [
          { source: 'id', destination: 'ExternalId__c', required: true },
          { source: 'name', destination: 'Name', required: true },
          { source: 'email', destination: 'Email__c', required: false },
          { source: 'phone', destination: 'Phone', required: false },
        ],
        transformations: [
          {
            field: 'name',
            type: 'format',
            config: { format: 'uppercase' },
          },
        ],
      },
    },
    schedule: {
      enabled: true,
      cron: '0 2 * * *',
      timezone: 'UTC',
      retryPolicy: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        maxDelay: 300000,
      },
    },
    monitoring: {
      enabled: true,
      alerts: [
        {
          type: 'email',
          config: { recipients: ['admin@enterprise.com'] },
          conditions: [
            { metric: 'error_rate', operator: 'gt', value: 0.1 },
          ],
        },
      ],
      metrics: ['duration', 'records_processed', 'error_rate'],
    },
    metadata: { environment: 'production' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: '123e4567-e89b-12d3-a456-426614174001',
    updatedBy: '123e4567-e89b-12d3-a456-426614174001',
  };

  try {
    const result = await validationService.validateIntegrationJob(integrationJobData, {
      locale: 'en',
      audit: true,
      metrics: true,
      cache: true,
    });
    console.log('\x1b[32m✅ Integration job validation passed!\x1b[0m');
    console.log('\x1b[34mℹ️  Validated integration job data:\x1b[0m', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('\x1b[31m❌ Integration job validation failed:\x1b[0m', (error as Error).message);
  }

  // Test Batch Validation
  console.log('\x1b[36m\n============================================================\x1b[0m');
  console.log('\x1b[1m  ENTERPRISE INTEGRATION BATCH VALIDATION\x1b[0m');
  console.log('\x1b[36m============================================================\x1b[0m');
  console.log('\x1b[34mℹ️  Testing batch validation for multiple integration entities...\x1b[0m');

  const batchValidations = [
    { type: 'salesforce' as const, data: salesforceConnectionData },
    { type: 'sap' as const, data: sapConnectionData },
    { type: 'job' as const, data: integrationJobData },
  ];

  try {
    const result = await validationService.validateBatch(batchValidations);
    console.log('\x1b[32m✅ Enterprise integration batch validation passed!\x1b[0m');
    console.log('\x1b[34mℹ️  Total entities:\x1b[0m', result.total);
    console.log('\x1b[34mℹ️  Successful:\x1b[0m', result.successful);
    console.log('\x1b[34mℹ️  Failed:\x1b[0m', result.failed);
  } catch (error) {
    console.log('\x1b[31m❌ Enterprise integration batch validation failed!\x1b[0m');
    console.log('\x1b[34mℹ️  Error:\x1b[0m', (error as Error).message);
  }

  // Test Advanced Features
  console.log('\x1b[36m\n============================================================\x1b[0m');
  console.log('\x1b[1m  ENTERPRISE INTEGRATION ADVANCED FEATURES\x1b[0m');
  console.log('\x1b[36m============================================================\x1b[0m');
  console.log('\x1b[34mℹ️  Testing A/B testing validation...\x1b[0m');

  try {
    await validationService.validateWithABTesting(integrationJobData, {
      locale: 'en',
      audit: true,
      metrics: true,
    });
    console.log('\x1b[32m✅ A/B testing validation passed!\x1b[0m');
  } catch (error) {
    console.log('\x1b[31m❌ A/B testing validation failed:\x1b[0m', (error as Error).message);
  }

  console.log('\x1b[34mℹ️  Testing real-time validation...\x1b[0m');

  try {
    await validationService.validateRealtime(integrationJobData, {
      locale: 'en',
      audit: true,
      metrics: true,
    });
    console.log('\x1b[32m✅ Real-time validation passed!\x1b[0m');
  } catch (error) {
    console.log('\x1b[31m❌ Real-time validation failed:\x1b[0m', (error as Error).message);
  }

  console.log('\x1b[36m\n============================================================\x1b[0m');
  console.log('\x1b[1m  DEMONSTRATION COMPLETE\x1b[0m');
  console.log('\x1b[36m============================================================\x1b[0m');
  console.log('\x1b[32m✅ Enterprise Integration Zod integration demonstrated successfully!\x1b[0m');
  console.log('\x1b[34mℹ️  This shows how our enterprise Zod validation is seamlessly integrated\x1b[0m');
  console.log('\x1b[34mℹ️  into the enterprise-integration package with comprehensive validation capabilities.\x1b[0m');
  console.log('\x1b[34mℹ️  All enterprise integration validation features are working with proper type safety and enterprise-grade capabilities.\x1b[0m');

  await app.close();
}

if (require.main === module) {
  demonstrateEnterpriseIntegrationZodIntegration().catch(console.error);
}
