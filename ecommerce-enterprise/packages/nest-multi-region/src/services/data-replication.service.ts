import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  DataReplication, 
  ReplicationConfig, 
  DataSyncStatus,
  DataConflict 
} from '../interfaces/multi-region.interface';
import { RegionManagerService } from './region-manager.service';
import * as uuid from 'uuid';
// import axios from 'axios';

@Injectable()
export class DataReplicationService {
  private readonly logger = new Logger(DataReplicationService.name);
  private replicationQueue: DataReplication[] = [];
  private syncStatus: Map<string, DataSyncStatus> = new Map();
  private conflicts: DataConflict[] = [];
  private config: ReplicationConfig;

  constructor(
    private configService: ConfigService,
    private regionManager: RegionManagerService
  ) {
    this.config = this.configService.get<ReplicationConfig>('REPLICATION_CONFIG', {
      enabled: true,
      strategy: 'master-slave',
      regions: ['us-east-1', 'us-west-2', 'eu-west-1'],
      conflictResolution: 'last-write-wins',
      syncInterval: 5000,
      batchSize: 100,
      retryAttempts: 3,
      retryDelay: 1000
    });

    this.initializeSyncStatus();
    this.startReplicationWorker();
  }

  private initializeSyncStatus() {
    const regions = this.regionManager.getRegions();
    regions.forEach(region => {
      this.syncStatus.set(region.id, {
        regionId: region.id,
        lastSync: new Date(),
        pendingOperations: 0,
        failedOperations: 0,
        syncRate: 0,
        lag: 0,
        conflicts: []
      });
    });
  }

  private startReplicationWorker() {
    if (!this.config.enabled) {
      this.logger.log('Data replication is disabled');
      return;
    }

    setInterval(() => {
      this.processReplicationQueue();
    }, this.config.syncInterval);

    this.logger.log('Data replication worker started');
  }

  async replicateData(
    dataType: string,
    dataId: string,
    operation: DataReplication['operation'],
    data: any,
    sourceRegion?: string
  ): Promise<string> {
    const replicationId = uuid.v4();
    const currentRegion = this.regionManager.getCurrentRegionId();
    const source = sourceRegion || currentRegion;

    const replication: DataReplication = {
      id: replicationId,
      sourceRegion: source,
      targetRegion: '', // Will be set when processing
      dataType,
      dataId,
      operation,
      data,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0
    };

    // Add to replication queue for all target regions
    const targetRegions = this.getTargetRegions(source);
    for (const targetRegion of targetRegions) {
      const replicationCopy = { ...replication, targetRegion };
      this.replicationQueue.push(replicationCopy);
    }

    this.logger.log(`Data replication queued: ${operation} ${dataType}/${dataId} from ${source}`);
    return replicationId;
  }

  private getTargetRegions(sourceRegion: string): string[] {
    if (this.config.strategy === 'master-slave') {
      // Master-slave: replicate to all other regions
      return this.config.regions.filter(region => region !== sourceRegion);
    } else if (this.config.strategy === 'master-master') {
      // Master-master: replicate to all regions
      return this.config.regions;
    } else {
      // Eventual consistency: replicate to all regions
      return this.config.regions;
    }
  }

  private async processReplicationQueue() {
    const batch = this.replicationQueue.splice(0, this.config.batchSize);
    
    if (batch.length === 0) {
      return;
    }

    this.logger.debug(`Processing ${batch.length} replication operations`);

    const promises = batch.map(replication => this.processReplication(replication));
    await Promise.allSettled(promises);
  }

  private async processReplication(replication: DataReplication): Promise<void> {
    try {
      replication.status = 'in-progress';
      
      // Simulate replication to target region
      const success = await this.simulateReplication(replication);
      
      if (success) {
        replication.status = 'completed';
        this.updateSyncStatus(replication.targetRegion, 'success');
        this.logger.debug(`Replication completed: ${replication.id}`);
      } else {
        throw new Error('Replication failed');
      }

    } catch (error) {
      replication.status = 'failed';
      replication.error = (error as Error).message;
      replication.retryCount++;

      this.updateSyncStatus(replication.targetRegion, 'failed');

      if (replication.retryCount < this.config.retryAttempts) {
        // Retry after delay
        setTimeout(() => {
          this.replicationQueue.push(replication);
        }, this.config.retryDelay * replication.retryCount);
      } else {
        this.logger.error(`Replication failed permanently: ${replication.id}`, error);
      }
    }
  }

  private async simulateReplication(_replication: DataReplication): Promise<boolean> {
    // Simulate network delay and potential failure
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    
    // 95% success rate
    return Math.random() > 0.05;
  }

  private updateSyncStatus(regionId: string, result: 'success' | 'failed') {
    const status = this.syncStatus.get(regionId);
    if (!status) return;

    if (result === 'success') {
      status.lastSync = new Date();
      status.pendingOperations = Math.max(0, status.pendingOperations - 1);
      status.syncRate = this.calculateSyncRate(regionId);
    } else {
      status.failedOperations++;
    }

    status.lag = Date.now() - status.lastSync.getTime();
  }

  private calculateSyncRate(regionId: string): number {
    // Calculate operations per second over last minute
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentOperations = this.replicationQueue.filter(
      r => r.targetRegion === regionId && r.timestamp > oneMinuteAgo
    );
    return recentOperations.length / 60;
  }

  async detectConflict(
    dataType: string,
    dataId: string,
    regions: string[],
    versions: { region: string; data: any; timestamp: Date }[]
  ): Promise<DataConflict | null> {
    if (versions.length <= 1) {
      return null;
    }

    // Check if there are conflicting versions
    const hasConflict = versions.some((v1, i) => 
      versions.slice(i + 1).some(v2 => 
        JSON.stringify(v1.data) !== JSON.stringify(v2.data)
      )
    );

    if (!hasConflict) {
      return null;
    }

    const conflict: DataConflict = {
      id: uuid.v4(),
      dataType,
      dataId,
      regions,
      versions
    };

    this.conflicts.push(conflict);
    this.logger.warn(`Data conflict detected: ${dataType}/${dataId}`, conflict);

    return conflict;
  }

  async resolveConflict(
    conflictId: string,
    strategy: string,
    resolvedBy: string,
    finalData: any
  ): Promise<boolean> {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) {
      return false;
    }

    conflict.resolution = {
      strategy,
      resolvedBy,
      resolvedAt: new Date(),
      finalData
    };

    // Replicate resolved data to all regions
    for (const _region of conflict.regions) {
      await this.replicateData(
        conflict.dataType,
        conflict.dataId,
        'update',
        finalData,
        this.regionManager.getCurrentRegionId()
      );
    }

    this.logger.log(`Conflict resolved: ${conflictId} using strategy ${strategy}`);
    return true;
  }

  getSyncStatus(regionId?: string): DataSyncStatus[] {
    if (regionId) {
      const status = this.syncStatus.get(regionId);
      return status ? [status] : [];
    }
    return Array.from(this.syncStatus.values());
  }

  getConflicts(): DataConflict[] {
    return this.conflicts.filter(c => !c.resolution);
  }

  getReplicationQueue(): DataReplication[] {
    return this.replicationQueue;
  }

  getReplicationStats() {
    const queue = this.replicationQueue;
    const completed = queue.filter(r => r.status === 'completed').length;
    const failed = queue.filter(r => r.status === 'failed').length;
    const pending = queue.filter(r => r.status === 'pending').length;
    const processing = queue.filter(r => r.status === 'in-progress').length;

    return {
      total: queue.length,
      pending,
      processing,
      completed,
      failed,
      successRate: completed / (completed + failed) || 0
    };
  }

  async pauseReplication(): Promise<void> {
    this.config.enabled = false;
    this.logger.log('Data replication paused');
  }

  async resumeReplication(): Promise<void> {
    this.config.enabled = true;
    this.logger.log('Data replication resumed');
  }

  updateReplicationConfig(config: Partial<ReplicationConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log('Replication configuration updated', config);
  }

  getReplicationConfig(): ReplicationConfig {
    return { ...this.config };
  }
}
