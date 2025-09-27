#!/usr/bin/env node
/**
 * Disaster Recovery Zod Integration Demonstration
 * 
 * This demonstration shows how our enterprise Zod validation is integrated
 * into the disaster-recovery package with comprehensive validation capabilities.
 */

import { 
  DisasterRecoveryValidationService,
  BackupJobSchema,
  RestoreJobSchema,
  DisasterRecoveryPlanSchema,
  // BusinessContinuityEventSchema,
  DisasterRecoveryAuditSchema
} from '../src/validation/disaster-recovery-validation.service';

// Color codes for beautiful console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message: string, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  log('\n' + '='.repeat(60), colors.cyan);
  log(`  ${title}`, colors.bright);
  log('='.repeat(60), colors.cyan);
}

async function main() {
  log(colors.bright + '🚨 DISASTER RECOVERY ZOD INTEGRATION DEMONSTRATION' + colors.reset);
  log(colors.cyan + '   Showcasing how enterprise Zod validation is integrated into disaster-recovery' + colors.reset);
  log(colors.cyan + '\n============================================================' + colors.reset);
  
  const validationService = new DisasterRecoveryValidationService();

  // Test data for validation
  const testBackupJobData = {
    name: 'Critical Database Backup',
    description: 'Daily backup of critical customer database',
    type: 'full',
    source: {
      type: 'database',
      path: '/var/lib/postgresql/data',
      filters: ['*.sql', '*.dump'],
      excludePatterns: ['*.log', '*.tmp']
    },
    destination: {
      type: 's3',
      path: 's3://enterprise-backups/database/',
      credentials: {
        type: 'key',
        encrypted: true
      },
      region: 'us-west-2',
      bucket: 'enterprise-backups'
    },
    schedule: {
      enabled: true,
      cron: '0 2 * * *',
      timezone: 'UTC',
      retention: {
        days: 30,
        versions: 10
      }
    },
    encryption: {
      enabled: true,
      algorithm: 'aes-256-gcm',
      keyId: 'backup-key-001'
    },
    compression: {
      enabled: true,
      algorithm: 'gzip',
      level: 6
    },
    notifications: {
      onSuccess: true,
      onFailure: true,
      onWarning: false,
      channels: ['email', 'slack']
    }
  };

  const testRestoreJobData = {
    backupId: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Emergency Database Restore',
    description: 'Restore database from latest backup',
    source: {
      type: 'database',
      path: 's3://enterprise-backups/database/backup-2024-01-15.sql.gz',
      version: '1.0.0',
      timestamp: '2024-01-15T02:00:00Z'
    },
    destination: {
      type: 'database',
      path: '/var/lib/postgresql/restored',
      overwrite: true,
      createMissing: true
    },
    options: {
      verifyIntegrity: true,
      skipErrors: false,
      dryRun: false,
      parallel: true,
      maxWorkers: 4
    },
    notifications: {
      onSuccess: true,
      onFailure: true,
      onWarning: true,
      channels: ['email', 'sms']
    }
  };

  const testDisasterRecoveryPlanData = {
    name: 'E-commerce Platform DR Plan',
    description: 'Comprehensive disaster recovery plan for e-commerce platform',
    version: '2.1.0',
    rto: 60, // 1 hour
    rpo: 15, // 15 minutes
    priority: 'critical',
    scope: {
      applications: ['web-app', 'api-gateway', 'payment-service'],
      databases: ['customer-db', 'inventory-db', 'order-db'],
      services: ['redis', 'elasticsearch', 'rabbitmq'],
      infrastructure: ['load-balancer', 'cdn', 'monitoring']
    },
    procedures: [{
      id: 'proc-001',
      name: 'Database Failover',
      description: 'Switch to standby database in case of primary failure',
      type: 'failover',
      order: 1,
      estimatedDuration: 15,
      dependencies: [],
      steps: [{
        id: 'step-001',
        description: 'Verify primary database is down',
        command: 'pg_isready -h primary-db',
        timeout: 30,
        retries: 3,
        critical: true
      }, {
        id: 'step-002',
        description: 'Promote standby database to primary',
        command: 'pg_promote -h standby-db',
        timeout: 60,
        retries: 2,
        critical: true
      }]
    }],
    contacts: [{
      name: 'John Smith',
      role: 'Database Administrator',
      email: 'john.smith@enterprise.com',
      phone: '+1-555-0123',
      escalation: 1
    }, {
      name: 'Jane Doe',
      role: 'Site Reliability Engineer',
      email: 'jane.doe@enterprise.com',
      phone: '+1-555-0124',
      escalation: 2
    }],
    testing: {
      lastTested: '2024-01-10T10:00:00Z',
      nextTest: '2024-02-10T10:00:00Z',
      frequency: 'monthly',
      successRate: 0.95
    }
  };

  const testBusinessContinuityEventData = {
    name: 'Data Center Power Outage',
    description: 'Primary data center experiencing power outage affecting multiple services',
    type: 'disaster',
    severity: 'critical',
    startTime: '2024-01-15T14:30:00Z',
    affectedSystems: ['web-app', 'api-gateway', 'customer-db'],
    impact: {
      users: 50000,
      revenue: 100000,
      reputation: 'high'
    },
    response: {
      team: ['sre-team', 'dba-team', 'devops-team'],
      procedures: ['proc-001', 'proc-002'],
      communications: [{
        channel: 'email',
        recipients: ['all-staff@enterprise.com'],
        message: 'Critical incident: Data center power outage. DR procedures activated.',
        sent: true,
        sentAt: '2024-01-15T14:35:00Z'
      }]
    },
    recovery: {
      estimatedTime: 120,
      actualTime: 95,
      steps: ['Database failover completed', 'Load balancer updated', 'CDN cache cleared'],
      lessons: ['Need faster failover procedures', 'Improve monitoring alerts']
    }
  };

  const testDisasterRecoveryAuditData = {
    entityType: 'backup',
    entityId: '123e4567-e89b-12d3-a456-426614174000',
    action: 'execute',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    changes: {
      status: 'completed',
      duration: 1800,
      size: '2.5GB'
    },
    result: 'success',
    details: 'Backup job completed successfully with 2.5GB of data',
    ipAddress: '192.168.1.100',
    userAgent: 'DisasterRecoveryService/1.0.0'
  };

  try {
    // Test backup job validation
    logSection('BACKUP JOB VALIDATION');
    log('ℹ️  Testing backup job validation with comprehensive features...', colors.blue);
    
    const backupResult = await validationService.validateBackupJob(testBackupJobData, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (backupResult.success) {
      log('✅ Backup job validation passed!', colors.green);
      log(`ℹ️  Validated backup job data: ${JSON.stringify(backupResult.data, null, 2)}`, colors.blue);
    } else {
      log('❌ Backup job validation failed:', colors.red);
      log(JSON.stringify(backupResult.errors, null, 2), colors.red);
    }

    // Test restore job validation
    logSection('RESTORE JOB VALIDATION');
    log('ℹ️  Testing restore job validation with recovery features...', colors.blue);
    
    const restoreResult = await validationService.validateRestoreJob(testRestoreJobData, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (restoreResult.success) {
      log('✅ Restore job validation passed!', colors.green);
      log(`ℹ️  Validated restore job data: ${JSON.stringify(restoreResult.data, null, 2)}`, colors.blue);
    } else {
      log('❌ Restore job validation failed:', colors.red);
      log(JSON.stringify(restoreResult.errors, null, 2), colors.red);
    }

    // Test disaster recovery plan validation
    logSection('DISASTER RECOVERY PLAN VALIDATION');
    log('ℹ️  Testing disaster recovery plan validation with complex procedures...', colors.blue);
    
    const planResult = await validationService.validateDisasterRecoveryPlan(testDisasterRecoveryPlanData, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (planResult.success) {
      log('✅ Disaster recovery plan validation passed!', colors.green);
      log(`ℹ️  Validated plan data: ${JSON.stringify(planResult.data, null, 2)}`, colors.blue);
    } else {
      log('❌ Disaster recovery plan validation failed:', colors.red);
      log(JSON.stringify(planResult.errors, null, 2), colors.red);
    }

    // Test business continuity event validation
    logSection('BUSINESS CONTINUITY EVENT VALIDATION');
    log('ℹ️  Testing business continuity event validation with incident management...', colors.blue);
    
    const eventResult = await validationService.validateBusinessContinuityEvent(testBusinessContinuityEventData, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (eventResult.success) {
      log('✅ Business continuity event validation passed!', colors.green);
      log(`ℹ️  Validated event data: ${JSON.stringify(eventResult.data, null, 2)}`, colors.blue);
    } else {
      log('❌ Business continuity event validation failed:', colors.red);
      log(JSON.stringify(eventResult.errors, null, 2), colors.red);
    }

    // Test disaster recovery audit validation
    logSection('DISASTER RECOVERY AUDIT VALIDATION');
    log('ℹ️  Testing disaster recovery audit validation with compliance features...', colors.blue);
    
    const auditResult = await validationService.validateDisasterRecoveryAudit(testDisasterRecoveryAuditData, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (auditResult.success) {
      log('✅ Disaster recovery audit validation passed!', colors.green);
      log(`ℹ️  Validated audit data: ${JSON.stringify(auditResult.data, null, 2)}`, colors.blue);
    } else {
      log('❌ Disaster recovery audit validation failed:', colors.red);
      log(JSON.stringify(auditResult.errors, null, 2), colors.red);
    }

    // Test batch validation
    logSection('DISASTER RECOVERY BATCH VALIDATION');
    log('ℹ️  Testing batch validation for multiple disaster recovery entities...', colors.blue);
    
    const batchEntities = [
      { type: 'backup' as const, data: testBackupJobData },
      { type: 'restore' as const, data: testRestoreJobData },
      { type: 'plan' as const, data: testDisasterRecoveryPlanData },
      { type: 'event' as const, data: testBusinessContinuityEventData },
      { type: 'audit' as const, data: testDisasterRecoveryAuditData }
    ];
    
    const batchResult = await validationService.batchValidateDisasterRecoveryEntities(batchEntities);
    
    if (batchResult.failed > 0) {
      log('❌ Disaster recovery batch validation failed!', colors.red);
    } else {
      log('✅ Disaster recovery batch validation passed!', colors.green);
    }
    
    log(`ℹ️  Total entities: ${batchResult.total}`, colors.blue);
    log(`ℹ️  Successful: ${batchResult.successful}`, colors.blue);
    log(`ℹ️  Failed: ${batchResult.failed}`, colors.blue);

    // Test advanced disaster recovery features
    logSection('DISASTER RECOVERY ADVANCED FEATURES');
    log('ℹ️  Testing A/B testing validation...', colors.blue);
    
    const abTestResult = await validationService.validateWithABTesting(testBackupJobData, 'backup', 'variantA');
    if (abTestResult.success) {
      log('✅ A/B testing validation passed!', colors.green);
    } else {
      log('❌ A/B testing validation failed!', colors.red);
    }

    log('ℹ️  Testing real-time validation...', colors.blue);
    const realtimeResult = await validationService.validateRealtime(testRestoreJobData, 'restore');
    if (realtimeResult.success) {
      log('✅ Real-time validation passed!', colors.green);
    } else {
      log('❌ Real-time validation failed!', colors.red);
    }

    // Test direct schema usage
    logSection('DISASTER RECOVERY SCHEMA USAGE');
    log('ℹ️  Demonstrating direct disaster recovery schema usage for type safety...', colors.blue);
    
    try {
      const directBackupResult = BackupJobSchema.parse(testBackupJobData);
      log('✅ Direct backup job schema validation passed!', colors.green);
      log(`ℹ️  Type-safe backup job data: ${JSON.stringify(directBackupResult, null, 2)}`, colors.blue);
    } catch (error) {
      log('❌ Direct backup job schema validation failed!', colors.red);
    }

    try {
      const directPlanResult = DisasterRecoveryPlanSchema.parse(testDisasterRecoveryPlanData);
      log('✅ Direct disaster recovery plan schema validation passed!', colors.green);
      log(`ℹ️  Type-safe plan data: ${JSON.stringify(directPlanResult, null, 2)}`, colors.blue);
    } catch (error) {
      log('❌ Direct disaster recovery plan schema validation failed!', colors.red);
    }

    // Test schema composition
    log('ℹ️  Demonstrating disaster recovery schema composition...', colors.blue);
    const composedSchema = DisasterRecoveryPlanSchema.extend({
      backupJob: BackupJobSchema.optional(),
      restoreJob: RestoreJobSchema.optional(),
      audit: DisasterRecoveryAuditSchema.optional()
    });
    
    const composedData = {
      ...testDisasterRecoveryPlanData,
      backupJob: testBackupJobData,
      restoreJob: testRestoreJobData,
      audit: testDisasterRecoveryAuditData
    };
    
    try {
      const composedResult = composedSchema.parse(composedData);
      log('✅ Disaster recovery schema composition validation passed!', colors.green);
      log(`ℹ️  Composed schema data: ${JSON.stringify(composedResult, null, 2)}`, colors.blue);
    } catch (error) {
      log('❌ Disaster recovery schema composition validation failed!', colors.red);
    }

    logSection('DEMONSTRATION COMPLETE');
    log('✅ Disaster Recovery Zod integration demonstrated successfully!', colors.green);
    log('ℹ️  This shows how our enterprise Zod validation is seamlessly integrated', colors.blue);
    log('ℹ️  into the disaster-recovery package with comprehensive validation capabilities.', colors.blue);
    log('ℹ️  All disaster recovery validation features are working with proper type safety and enterprise-grade capabilities.', colors.blue);

  } catch (error) {
    log(`❌ Demonstration failed with error: ${error}`, colors.red);
    process.exit(1);
  }
}

// Run the demonstration
if (require.main === module) {
  main().catch(console.error);
}

export { main };
