import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { EnterpriseZodValidationService } from '@ecommerce-enterprise/nest-zod';

// Enterprise Integration Schemas
export const SalesforceConnectionSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
  username: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  securityToken: z.string().optional(),
  sandbox: z.boolean().default(false),
  apiVersion: z.string().regex(/^\d+\.\d+$/, 'Invalid API version format').default('58.0'),
  timeout: z.number().min(1000).max(300000).default(30000),
  retryAttempts: z.number().min(0).max(10).default(3),
  retryDelay: z.number().min(100).max(10000).default(1000),
  customDomain: z.string().url('Invalid custom domain URL').optional(),
  instanceUrl: z.string().url('Invalid instance URL').optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const SAPConnectionSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1).max(65535, 'Invalid port number'),
  client: z.string().min(3, 'Client must be at least 3 characters'),
  user: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  language: z.string().length(2, 'Language must be 2 characters').default('EN'),
  systemNumber: z.string().min(1, 'System number is required'),
  applicationServer: z.string().optional(),
  messageServer: z.string().optional(),
  group: z.string().optional(),
  r3name: z.string().optional(),
  mshost: z.string().optional(),
  msserv: z.string().optional(),
  sysid: z.string().optional(),
  trace: z.boolean().default(false),
  lcheck: z.boolean().default(true),
  luw: z.boolean().default(false),
  pool: z.boolean().default(false),
  sso2_ticket: z.string().optional(),
  sso2_ticketx: z.string().optional(),
  x509cert: z.string().optional(),
  sapsso2: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const IntegrationJobSchema = z.object({
  id: z.string().uuid('Invalid job ID format'),
  name: z.string().min(1, 'Job name is required'),
  description: z.string().optional(),
  type: z.enum(['sync', 'async', 'batch', 'realtime', 'scheduled'], {
    errorMap: () => ({ message: 'Invalid job type' })
  }),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled', 'paused'], {
    errorMap: () => ({ message: 'Invalid job status' })
  }),
  priority: z.enum(['low', 'normal', 'high', 'critical'], {
    errorMap: () => ({ message: 'Invalid priority level' })
  }),
  source: z.object({
    system: z.string().min(1, 'Source system is required'),
    endpoint: z.string().url('Invalid source endpoint'),
    credentials: z.object({
      type: z.enum(['oauth2', 'basic', 'api_key', 'certificate'], {
        errorMap: () => ({ message: 'Invalid credential type' })
      }),
      config: z.record(z.any()),
    }),
    filters: z.object({
      dateRange: z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
      }).optional(),
      fields: z.array(z.string()).optional(),
      conditions: z.array(z.object({
        field: z.string(),
        operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains', 'startsWith', 'endsWith']),
        value: z.any(),
      })).optional(),
    }).optional(),
  }),
  destination: z.object({
    system: z.string().min(1, 'Destination system is required'),
    endpoint: z.string().url('Invalid destination endpoint'),
    credentials: z.object({
      type: z.enum(['oauth2', 'basic', 'api_key', 'certificate'], {
        errorMap: () => ({ message: 'Invalid credential type' })
      }),
      config: z.record(z.any()),
    }),
    mapping: z.object({
      fieldMappings: z.array(z.object({
        source: z.string(),
        destination: z.string(),
        transform: z.string().optional(),
        required: z.boolean().default(false),
      })),
      transformations: z.array(z.object({
        field: z.string(),
        type: z.enum(['format', 'calculate', 'lookup', 'validate'], {
          errorMap: () => ({ message: 'Invalid transformation type' })
        }),
        config: z.record(z.any()),
      })).optional(),
    }),
  }),
  schedule: z.object({
    enabled: z.boolean().default(false),
    cron: z.string().optional(),
    timezone: z.string().default('UTC'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    maxRuns: z.number().min(1).optional(),
    retryPolicy: z.object({
      maxAttempts: z.number().min(0).max(10).default(3),
      backoffMultiplier: z.number().min(1).max(10).default(2),
      maxDelay: z.number().min(1000).max(3600000).default(300000),
    }).optional(),
  }).optional(),
  monitoring: z.object({
    enabled: z.boolean().default(true),
    alerts: z.array(z.object({
      type: z.enum(['email', 'sms', 'webhook', 'slack'], {
        errorMap: () => ({ message: 'Invalid alert type' })
      }),
      config: z.record(z.any()),
      conditions: z.array(z.object({
        metric: z.string(),
        operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'ne']),
        value: z.number(),
      })),
    })).optional(),
    metrics: z.array(z.enum(['duration', 'records_processed', 'error_rate', 'throughput'])).optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid('Invalid creator ID format'),
  updatedBy: z.string().uuid('Invalid updater ID format'),
});

export const DataMappingSchema = z.object({
  id: z.string().uuid('Invalid mapping ID format'),
  name: z.string().min(1, 'Mapping name is required'),
  description: z.string().optional(),
  sourceSchema: z.object({
    system: z.string().min(1, 'Source system is required'),
    version: z.string().min(1, 'Schema version is required'),
    fields: z.array(z.object({
      name: z.string().min(1, 'Field name is required'),
      type: z.enum(['string', 'number', 'boolean', 'date', 'object', 'array'], {
        errorMap: () => ({ message: 'Invalid field type' })
      }),
      required: z.boolean().default(false),
      nullable: z.boolean().default(true),
      description: z.string().optional(),
      constraints: z.record(z.any()).optional(),
    })),
  }),
  targetSchema: z.object({
    system: z.string().min(1, 'Target system is required'),
    version: z.string().min(1, 'Schema version is required'),
    fields: z.array(z.object({
      name: z.string().min(1, 'Field name is required'),
      type: z.enum(['string', 'number', 'boolean', 'date', 'object', 'array'], {
        errorMap: () => ({ message: 'Invalid field type' })
      }),
      required: z.boolean().default(false),
      nullable: z.boolean().default(true),
      description: z.string().optional(),
      constraints: z.record(z.any()).optional(),
    })),
  }),
  mappings: z.array(z.object({
    sourceField: z.string().min(1, 'Source field is required'),
    targetField: z.string().min(1, 'Target field is required'),
    transformation: z.object({
      type: z.enum(['direct', 'format', 'calculate', 'lookup', 'conditional', 'custom'], {
        errorMap: () => ({ message: 'Invalid transformation type' })
      }),
      config: z.record(z.any()).optional(),
      script: z.string().optional(),
    }).optional(),
    validation: z.object({
      required: z.boolean().default(false),
      rules: z.array(z.object({
        type: z.enum(['min', 'max', 'pattern', 'custom'], {
          errorMap: () => ({ message: 'Invalid validation rule type' })
        }),
        value: z.any(),
        message: z.string().optional(),
      })).optional(),
    }).optional(),
  })),
  version: z.string().min(1, 'Mapping version is required'),
  status: z.enum(['draft', 'active', 'deprecated', 'archived'], {
    errorMap: () => ({ message: 'Invalid mapping status' })
  }),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid('Invalid creator ID format'),
  updatedBy: z.string().uuid('Invalid updater ID format'),
});

export const IntegrationAuditSchema = z.object({
  id: z.string().uuid('Invalid audit ID format'),
  jobId: z.string().uuid('Invalid job ID format'),
  action: z.enum(['create', 'update', 'delete', 'execute', 'pause', 'resume', 'cancel'], {
    errorMap: () => ({ message: 'Invalid audit action' })
  }),
  status: z.enum(['success', 'failure', 'warning'], {
    errorMap: () => ({ message: 'Invalid audit status' })
  }),
  details: z.object({
    message: z.string().min(1, 'Audit message is required'),
    duration: z.number().min(0).optional(),
    recordsProcessed: z.number().min(0).optional(),
    recordsFailed: z.number().min(0).optional(),
    errorRate: z.number().min(0).max(1).optional(),
    throughput: z.number().min(0).optional(),
    errors: z.array(z.object({
      code: z.string(),
      message: z.string(),
      field: z.string().optional(),
      value: z.any().optional(),
    })).optional(),
    warnings: z.array(z.object({
      code: z.string(),
      message: z.string(),
      field: z.string().optional(),
      value: z.any().optional(),
    })).optional(),
  }),
  metadata: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
  userId: z.string().uuid('Invalid user ID format'),
  ipAddress: z.string().ip('Invalid IP address format'),
  userAgent: z.string().optional(),
});

@Injectable()
export class EnterpriseIntegrationValidationService {
  constructor(
    private readonly enterpriseService: EnterpriseZodValidationService,
  ) {}

  // Salesforce Connection Validation
  async validateSalesforceConnection(data: unknown, options?: {
    locale?: string;
    audit?: boolean;
    metrics?: boolean;
    cache?: boolean;
  }) {
    return await this.enterpriseService.validate(data, {
      schema: SalesforceConnectionSchema,
      audit: options?.audit || true,
      metrics: options?.metrics || true,
      cache: options?.cache || true,
    });
  }

  // SAP Connection Validation
  async validateSAPConnection(data: unknown, options?: {
    locale?: string;
    audit?: boolean;
    metrics?: boolean;
    cache?: boolean;
  }) {
    return await this.enterpriseService.validate(data, {
      schema: SAPConnectionSchema,
      audit: options?.audit || true,
      metrics: options?.metrics || true,
      cache: options?.cache || true,
    });
  }

  // Integration Job Validation
  async validateIntegrationJob(data: unknown, options?: {
    locale?: string;
    audit?: boolean;
    metrics?: boolean;
    cache?: boolean;
  }) {
    return await this.enterpriseService.validate(data, {
      schema: IntegrationJobSchema,
      audit: options?.audit || true,
      metrics: options?.metrics || true,
      cache: options?.cache || true,
    });
  }

  // Data Mapping Validation
  async validateDataMapping(data: unknown, options?: {
    locale?: string;
    audit?: boolean;
    metrics?: boolean;
    cache?: boolean;
  }) {
    return await this.enterpriseService.validate(data, {
      schema: DataMappingSchema,
      audit: options?.audit || true,
      metrics: options?.metrics || true,
      cache: options?.cache || true,
    });
  }

  // Integration Audit Validation
  async validateIntegrationAudit(data: unknown, options?: {
    locale?: string;
    audit?: boolean;
    metrics?: boolean;
    cache?: boolean;
  }) {
    return await this.enterpriseService.validate(data, {
      schema: IntegrationAuditSchema,
      audit: options?.audit || true,
      metrics: options?.metrics || true,
      cache: options?.cache || true,
    });
  }

  // Batch Validation
  async validateBatch(validations: Array<{
    type: 'salesforce' | 'sap' | 'job' | 'mapping' | 'audit';
    data: unknown;
    options?: {
      locale?: string;
      audit?: boolean;
      metrics?: boolean;
      cache?: boolean;
    };
  }>) {
    const results = await Promise.allSettled(
      validations.map(async (validation) => {
        const schema = this.getSchemaForType(validation.type);
        return await this.enterpriseService.validate(validation.data, {
          schema,
          audit: validation.options?.audit || true,
          metrics: validation.options?.metrics || true,
          cache: validation.options?.cache || true,
        });
      })
    );

    return {
      total: validations.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results: results.map((result, index) => ({
        index,
        type: validations[index]?.type || 'unknown',
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null,
      })),
    };
  }

  // A/B Testing Validation
  async validateWithABTesting(data: unknown, options?: {
    locale?: string;
    audit?: boolean;
    metrics?: boolean;
  }) {
    const baseSchema = IntegrationJobSchema;
    
    return await this.enterpriseService.validate(data, {
      schema: baseSchema,
      abTest: {
        schemas: {
          'control': baseSchema,
          'variantA': baseSchema.extend({ 
            newField: z.string().optional(),
            experimentalFeatures: z.array(z.string()).optional(),
          }),
        },
        defaultVariant: 'control',
        userSegmentField: 'createdBy'
      },
      audit: options?.audit || true,
      metrics: options?.metrics || true,
    });
  }

  // Real-time Validation
  async validateRealtime(data: unknown, options?: {
    locale?: string;
    audit?: boolean;
    metrics?: boolean;
  }) {
    const baseSchema = IntegrationJobSchema;
    
    return await this.enterpriseService.validate(data, {
      schema: baseSchema,
      realtime: {
        broadcastErrors: true,
        validationChannel: 'enterprise-integration-validation'
      },
      audit: options?.audit || true,
      metrics: options?.metrics || true,
    });
  }

  private getSchemaForType(type: string) {
    switch (type) {
      case 'salesforce':
        return SalesforceConnectionSchema;
      case 'sap':
        return SAPConnectionSchema;
      case 'job':
        return IntegrationJobSchema;
      case 'mapping':
        return DataMappingSchema;
      case 'audit':
        return IntegrationAuditSchema;
      default:
        throw new Error(`Unknown validation type: ${type}`);
    }
  }
}
