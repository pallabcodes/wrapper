import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { EnterpriseZodValidationService } from '@ecommerce-enterprise/nest-zod';
import { ErrorMaps } from '@ecommerce-enterprise/nest-zod';

// Disaster Recovery-specific Zod Schemas
export const BackupJobSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['full', 'incremental', 'differential', 'snapshot']),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).default('pending'),
  source: z.object({
    type: z.enum(['database', 'filesystem', 'application', 'configuration']),
    path: z.string().min(1),
    filters: z.array(z.string()).optional(),
    excludePatterns: z.array(z.string()).optional(),
  }),
  destination: z.object({
    type: z.enum(['local', 's3', 'azure', 'gcp', 'ftp', 'nfs']),
    path: z.string().min(1),
    credentials: z.object({
      type: z.enum(['none', 'key', 'oauth', 'certificate']),
      encrypted: z.boolean().default(true),
    }),
    region: z.string().optional(),
    bucket: z.string().optional(),
  }),
  schedule: z.object({
    enabled: z.boolean().default(true),
    cron: z.string().optional(),
    timezone: z.string().default('UTC'),
    retention: z.object({
      days: z.number().int().min(1).max(3650),
      versions: z.number().int().min(1).max(100).optional(),
    }),
  }),
  encryption: z.object({
    enabled: z.boolean().default(true),
    algorithm: z.enum(['aes-256-gcm', 'aes-256-cbc', 'chacha20-poly1305']).default('aes-256-gcm'),
    keyId: z.string().optional(),
  }),
  compression: z.object({
    enabled: z.boolean().default(true),
    algorithm: z.enum(['gzip', 'bzip2', 'lz4', 'zstd']).default('gzip'),
    level: z.number().int().min(1).max(9).default(6),
  }),
  notifications: z.object({
    onSuccess: z.boolean().default(true),
    onFailure: z.boolean().default(true),
    onWarning: z.boolean().default(false),
    channels: z.array(z.enum(['email', 'sms', 'webhook', 'slack'])).optional(),
  }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime().default(new Date().toISOString()),
  updatedAt: z.string().datetime().default(new Date().toISOString()),
});

export const RestoreJobSchema = z.object({
  id: z.string().uuid().optional(),
  backupId: z.string().uuid(),
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).default('pending'),
  source: z.object({
    type: z.enum(['database', 'filesystem', 'application', 'configuration']),
    path: z.string().min(1),
    version: z.string().optional(),
    timestamp: z.string().datetime().optional(),
  }),
  destination: z.object({
    type: z.enum(['database', 'filesystem', 'application', 'configuration']),
    path: z.string().min(1),
    overwrite: z.boolean().default(false),
    createMissing: z.boolean().default(true),
  }),
  options: z.object({
    verifyIntegrity: z.boolean().default(true),
    skipErrors: z.boolean().default(false),
    dryRun: z.boolean().default(false),
    parallel: z.boolean().default(true),
    maxWorkers: z.number().int().min(1).max(16).default(4),
  }),
  notifications: z.object({
    onSuccess: z.boolean().default(true),
    onFailure: z.boolean().default(true),
    onWarning: z.boolean().default(false),
    channels: z.array(z.enum(['email', 'sms', 'webhook', 'slack'])).optional(),
  }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime().default(new Date().toISOString()),
  updatedAt: z.string().datetime().default(new Date().toISOString()),
});

export const DisasterRecoveryPlanSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  status: z.enum(['draft', 'active', 'deprecated', 'testing']).default('draft'),
  rto: z.number().positive(), // Recovery Time Objective in minutes
  rpo: z.number().min(0), // Recovery Point Objective in minutes
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  scope: z.object({
    applications: z.array(z.string()).min(1),
    databases: z.array(z.string()).optional(),
    services: z.array(z.string()).optional(),
    infrastructure: z.array(z.string()).optional(),
  }),
  procedures: z.array(z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    type: z.enum(['backup', 'restore', 'failover', 'failback', 'validation', 'notification']),
    order: z.number().int().min(1),
    estimatedDuration: z.number().positive(), // in minutes
    dependencies: z.array(z.string()).optional(),
    steps: z.array(z.object({
      id: z.string().uuid().optional(),
      description: z.string().min(10).max(500),
      command: z.string().optional(),
      script: z.string().optional(),
      timeout: z.number().positive().default(300), // in seconds
      retries: z.number().int().min(0).max(5).default(3),
      critical: z.boolean().default(false),
    })),
  })),
  contacts: z.array(z.object({
    name: z.string().min(2).max(100),
    role: z.string().min(2).max(50),
    email: z.string().email(),
    phone: z.string().optional(),
    escalation: z.number().int().min(1).max(5).default(1),
  })),
  testing: z.object({
    lastTested: z.string().datetime().optional(),
    nextTest: z.string().datetime().optional(),
    frequency: z.enum(['weekly', 'monthly', 'quarterly', 'annually']).default('quarterly'),
    successRate: z.number().min(0).max(1).optional(),
  }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime().default(new Date().toISOString()),
  updatedAt: z.string().datetime().default(new Date().toISOString()),
});

export const BusinessContinuityEventSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  type: z.enum(['disaster', 'incident', 'maintenance', 'test', 'drill']),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']).default('medium'),
  status: z.enum(['active', 'resolved', 'cancelled', 'monitoring']).default('active'),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  affectedSystems: z.array(z.string()).min(1),
  impact: z.object({
    users: z.number().int().min(0).optional(),
    revenue: z.number().min(0).optional(),
    reputation: z.enum(['none', 'low', 'medium', 'high', 'critical']).optional(),
  }),
  response: z.object({
    team: z.array(z.string()).min(1),
    procedures: z.array(z.string()).optional(),
    communications: z.array(z.object({
      channel: z.enum(['email', 'sms', 'phone', 'webhook', 'slack']),
      recipients: z.array(z.string()).min(1),
      message: z.string().min(10).max(1000),
      sent: z.boolean().default(false),
      sentAt: z.string().datetime().optional(),
    })),
  }),
  recovery: z.object({
    estimatedTime: z.number().positive().optional(), // in minutes
    actualTime: z.number().positive().optional(), // in minutes
    steps: z.array(z.string()).optional(),
    lessons: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime().default(new Date().toISOString()),
  updatedAt: z.string().datetime().default(new Date().toISOString()),
});

export const DisasterRecoveryAuditSchema = z.object({
  id: z.string().uuid().optional(),
  entityType: z.enum(['backup', 'restore', 'plan', 'event', 'test']),
  entityId: z.string().uuid(),
  action: z.enum(['create', 'update', 'delete', 'execute', 'test', 'validate', 'approve', 'reject']),
  userId: z.string().uuid().optional(),
  changes: z.record(z.string(), z.unknown()).optional(),
  result: z.enum(['success', 'failure', 'warning', 'info']).optional(),
  details: z.string().max(1000).optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  timestamp: z.string().datetime().default(new Date().toISOString()),
});

@Injectable()
export class DisasterRecoveryValidationService {
  // private readonly logger = new Logger(DisasterRecoveryValidationService.name);
  // private validationService: ZodValidationService;
  private enterpriseService: EnterpriseZodValidationService;

  constructor() {
    // this.validationService = new ZodValidationService();
    this.enterpriseService = new EnterpriseZodValidationService();
  }

  async validateBackupJob(backupData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.enterpriseService.validate(backupData, {
      schema: BackupJobSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true,
    });
  }

  async validateRestoreJob(restoreData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.enterpriseService.validate(restoreData, {
      schema: RestoreJobSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true,
    });
  }

  async validateDisasterRecoveryPlan(planData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.enterpriseService.validate(planData, {
      schema: DisasterRecoveryPlanSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true,
    });
  }

  async validateBusinessContinuityEvent(eventData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.enterpriseService.validate(eventData, {
      schema: BusinessContinuityEventSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true,
    });
  }

  async validateDisasterRecoveryAudit(auditData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.enterpriseService.validate(auditData, {
      schema: DisasterRecoveryAuditSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true,
    });
  }

  async batchValidateDisasterRecoveryEntities(entities: { 
    type: 'backup' | 'restore' | 'plan' | 'event' | 'audit'; 
    data: unknown 
  }[]) {
    const results = await Promise.all(entities.map(async (entity) => {
      let schema: z.ZodSchema;
      switch (entity.type) {
        case 'backup': schema = BackupJobSchema; break;
        case 'restore': schema = RestoreJobSchema; break;
        case 'plan': schema = DisasterRecoveryPlanSchema; break;
        case 'event': schema = BusinessContinuityEventSchema; break;
        case 'audit': schema = DisasterRecoveryAuditSchema; break;
        default: throw new Error(`Unknown entity type: ${entity.type}`);
      }
      const result = await this.enterpriseService.validate(entity.data, { 
        schema, 
        audit: true, 
        metrics: true 
      });
      return { type: entity.type, result };
    }));

    return {
      total: results.length,
      successful: results.filter(r => r.result.success).length,
      failed: results.filter(r => !r.result.success).length,
    };
  }

  // Advanced disaster recovery validation with A/B testing
  async validateWithABTesting(data: unknown, entityType: 'backup' | 'restore' | 'plan', _variant: string) {
    const baseSchema = entityType === 'backup' ? BackupJobSchema :
                      entityType === 'restore' ? RestoreJobSchema :
                      DisasterRecoveryPlanSchema;

    return await this.enterpriseService.validate(data, {
      schema: baseSchema,
      abTest: {
        schemas: {
          'control': baseSchema,
          'variantA': baseSchema.extend({ newField: z.string().optional() }),
        },
        defaultVariant: 'control',
        userSegmentField: 'userId'
      },
      audit: true,
      metrics: true
    });
  }

  // Real-time validation with custom business logic
  async validateRealtime(data: unknown, entityType: 'backup' | 'restore' | 'plan') {
    const baseSchema = entityType === 'backup' ? BackupJobSchema :
                      entityType === 'restore' ? RestoreJobSchema :
                      DisasterRecoveryPlanSchema;

    return await this.enterpriseService.validate(data, {
      schema: baseSchema,
      realtime: {
        broadcastErrors: true,
        validationChannel: 'disaster-recovery-validation'
      },
      audit: true,
      metrics: true
    });
  }
}
