import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  EnterpriseIntegrationOptions, 
  EnterpriseData, 
  SyncResult, 
  ConflictResolution 
} from '../interfaces/enterprise-options.interface';
import { SAPService } from './sap.service';
import { SalesforceService } from './salesforce.service';
import { CacheService } from './cache.service';
import { RetryService } from './retry.service';

@Injectable()
export class EnterpriseIntegrationService {
  private readonly logger = new Logger(EnterpriseIntegrationService.name);
  private options!: EnterpriseIntegrationOptions;

  constructor(
    private readonly configService: ConfigService,
    private readonly sapService: SAPService,
    private readonly salesforceService: SalesforceService,
    private readonly cacheService: CacheService,
    private readonly retryService: RetryService,
  ) {
    this.initializeIntegration();
  }

  private initializeIntegration() {
    this.options = this.configService.get<EnterpriseIntegrationOptions>('ENTERPRISE_INTEGRATION_CONFIG', {
      sap: { enabled: false, connection: {} as any },
      salesforce: { enabled: false, connection: {} as any },
      cache: { enabled: false, ttl: 300, maxSize: 1000, provider: 'memory' },
      retry: { enabled: true, maxAttempts: 3, delay: 1000, backoffMultiplier: 2, maxDelay: 30000 },
      monitoring: { enabled: true, metrics: true, logging: true, tracing: false },
    });
  }

  async isHealthy(): Promise<{ healthy: boolean; services: any }> {
    const services = {
      sap: await this.sapService.isHealthy(),
      salesforce: await this.salesforceService.isHealthy(),
      cache: await this.cacheService.isHealthy(),
    };

    const healthy = Object.values(services).every(status => status === true);

    return { healthy, services };
  }

  async syncDataBetweenSystems(
    sourceSystem: 'sap' | 'salesforce' | 'internal',
    targetSystem: 'sap' | 'salesforce' | 'internal',
    data: EnterpriseData[],
    conflictResolution?: ConflictResolution
  ): Promise<SyncResult> {
    const startTime = Date.now();
    this.logger.log(`Starting data sync from ${sourceSystem} to ${targetSystem} (${data.length} records)`);

    const result: SyncResult = {
      success: true,
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      errors: [],
      duration: 0,
    };

    try {
      for (const record of data) {
        result.recordsProcessed++;

        try {
          await this.syncRecord(record, sourceSystem, targetSystem, conflictResolution);
          result.recordsSucceeded++;
        } catch (error) {
          result.recordsFailed++;
          result.errors.push({
            recordId: record.id,
            error: (error as Error).message,
            code: 'SYNC_ERROR',
            timestamp: new Date(),
          });
        }
      }

      result.duration = Date.now() - startTime;
      result.success = result.recordsFailed === 0;

      this.logger.log(
        `Data sync completed: ${result.recordsSucceeded}/${result.recordsProcessed} records succeeded in ${result.duration}ms`
      );

      return result;
    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      this.logger.error(`Data sync failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  private async syncRecord(
    record: EnterpriseData,
    _sourceSystem: string,
    targetSystem: string,
    conflictResolution?: ConflictResolution
  ): Promise<void> {
    // Check for conflicts if both systems have the record
    if (conflictResolution && conflictResolution.strategy !== 'source_wins') {
      const existingRecord = await this.getExistingRecord(record, targetSystem);
      if (existingRecord) {
        const conflict = await this.detectConflict(record, existingRecord);
        if (conflict) {
          await this.resolveConflict(record, existingRecord, conflictResolution);
          return;
        }
      }
    }

    // Sync the record to target system
    switch (targetSystem) {
      case 'sap':
        await this.sapService.syncData([record]);
        break;
      case 'salesforce':
        await this.salesforceService.syncData([record]);
        break;
      case 'internal':
        await this.syncToInternalSystem(record);
        break;
      default:
        throw new Error(`Unknown target system: ${targetSystem}`);
    }
  }

  private async getExistingRecord(record: EnterpriseData, system: string): Promise<EnterpriseData | null> {
    try {
      switch (system) {
        case 'sap':
          // Query SAP for existing record
          const sapResults = await this.sapService.queryOData(
            this.getEntitySetForType(record.type),
            { id: record.id }
          );
          return sapResults.length > 0 ? this.mapSAPToEnterpriseData(sapResults[0], record.type) : null;
        
        case 'salesforce':
          // Query Salesforce for existing record
          const sfResults = await this.salesforceService.queryRecords(
            this.getObjectTypeForType(record.type),
            `SELECT Id FROM ${this.getObjectTypeForType(record.type)} WHERE External_Id__c = '${record.id}'`
          );
          return sfResults.length > 0 ? this.mapSalesforceToEnterpriseData(sfResults[0], record.type) : null;
        
        default:
          return null;
      }
    } catch (error) {
      this.logger.warn(`Failed to get existing record: ${(error as Error).message}`);
      return null;
    }
  }

  private async detectConflict(sourceRecord: EnterpriseData, targetRecord: EnterpriseData): Promise<boolean> {
    // Simple conflict detection based on timestamp
    return sourceRecord.metadata.timestamp < targetRecord.metadata.timestamp;
  }

  private async resolveConflict(
    sourceRecord: EnterpriseData,
    targetRecord: EnterpriseData,
    conflictResolution: ConflictResolution
  ): Promise<void> {
    switch (conflictResolution.strategy) {
      case 'source_wins':
        // Source record overwrites target
        await this.syncRecord(sourceRecord, 'internal', 'sap');
        break;
      case 'target_wins':
        // Target record is kept, source is ignored
        this.logger.log(`Conflict resolved: target wins for record ${sourceRecord.id}`);
        break;
      case 'merge':
        // Merge records based on rules
        const mergedRecord = await this.mergeRecords(sourceRecord, targetRecord, conflictResolution);
        await this.syncRecord(mergedRecord, 'internal', 'sap');
        break;
      case 'manual':
        // Log conflict for manual resolution
        this.logger.warn(`Manual conflict resolution required for record ${sourceRecord.id}`);
        break;
    }
  }

  private async mergeRecords(
    sourceRecord: EnterpriseData,
    targetRecord: EnterpriseData,
    conflictResolution: ConflictResolution
  ): Promise<EnterpriseData> {
    const mergedData = { ...targetRecord.data };

    for (const rule of conflictResolution.rules) {
      if (this.evaluateRule(rule, sourceRecord, targetRecord)) {
        switch (rule.action) {
          case 'source':
            mergedData[rule.field] = sourceRecord.data[rule.field];
            break;
          case 'target':
            mergedData[rule.field] = targetRecord.data[rule.field];
            break;
          case 'merge':
            // Custom merge logic based on field type
            mergedData[rule.field] = this.mergeFieldValues(
              sourceRecord.data[rule.field],
              targetRecord.data[rule.field],
              rule.field
            );
            break;
        }
      }
    }

    return {
      ...sourceRecord,
      data: mergedData,
      metadata: {
        ...sourceRecord.metadata,
        timestamp: new Date(),
        syncStatus: 'synced',
      },
    };
  }

  private evaluateRule(_rule: any, _sourceRecord: EnterpriseData, _targetRecord: EnterpriseData): boolean {
    // Simple rule evaluation - in a real implementation, this would be more sophisticated
    return true;
  }

  private mergeFieldValues(sourceValue: any, targetValue: any, _field: string): any {
    // Custom merge logic based on field type
    if (typeof sourceValue === 'string' && typeof targetValue === 'string') {
      return sourceValue.length > targetValue.length ? sourceValue : targetValue;
    }
    if (typeof sourceValue === 'number' && typeof targetValue === 'number') {
      return Math.max(sourceValue, targetValue);
    }
    return sourceValue || targetValue;
  }

  private async syncToInternalSystem(record: EnterpriseData): Promise<void> {
    // Mock internal system sync
    this.logger.log(`Syncing record ${record.id} to internal system`);
  }

  private getEntitySetForType(type: string): string {
    const entitySets: Record<string, string> = {
      customer: 'CustomerSet',
      product: 'ProductSet',
      order: 'OrderSet',
    };
    return entitySets[type] || 'GenericSet';
  }

  private getObjectTypeForType(type: string): string {
    const objectTypes: Record<string, string> = {
      customer: 'Account',
      product: 'Product2',
      order: 'Opportunity',
      lead: 'Lead',
      opportunity: 'Opportunity',
    };
    return objectTypes[type] || 'Generic__c';
  }

  private mapSAPToEnterpriseData(sapData: any, type: string): EnterpriseData {
    return {
      id: sapData.id || sapData.KUNNR || sapData.MATNR || sapData.VBELN,
      source: 'sap',
      type,
      data: sapData,
      metadata: {
        timestamp: new Date(sapData.CreatedDate || sapData.ERDAT || Date.now()),
        version: '1.0',
        checksum: this.calculateChecksum(sapData),
        syncStatus: 'synced',
      },
    };
  }

  private mapSalesforceToEnterpriseData(sfData: any, type: string): EnterpriseData {
    return {
      id: sfData.Id,
      source: 'salesforce',
      type,
      data: sfData,
      metadata: {
        timestamp: new Date(sfData.CreatedDate || Date.now()),
        version: '1.0',
        checksum: this.calculateChecksum(sfData),
        syncStatus: 'synced',
      },
    };
  }

  private calculateChecksum(data: any): string {
    // Simple checksum calculation
    return Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16);
  }

  async getIntegrationStats(): Promise<any> {
    const health = await this.isHealthy();
    const cacheStats = await this.cacheService.getStats();
    const retryStats = this.retryService.getRetryStats();

    return {
      health,
      cache: cacheStats,
      retry: retryStats,
      options: this.options,
      timestamp: new Date().toISOString(),
    };
  }

  async clearCache(): Promise<void> {
    await this.cacheService.clear();
    this.logger.log('Integration cache cleared');
  }

  async resetCircuitBreakers(): Promise<void> {
    // Reset all circuit breakers
    (global as any).circuitBreakerStates = {};
    this.logger.log('Circuit breakers reset');
  }
}
