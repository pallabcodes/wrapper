import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  MultiRegionMetrics,
  RegionConfig,
  RegionHealth,
  DataSyncStatus,
  DataConflict,
  RegionEvent
} from '../interfaces/multi-region.interface';
import { RegionManagerService } from './region-manager.service';
import { DataReplicationService } from './data-replication.service';
import { LoadBalancerService } from './load-balancer.service';

@Injectable()
export class MultiRegionService {
  private readonly logger = new Logger(MultiRegionService.name);

  constructor(
    private configService: ConfigService,
    private regionManager: RegionManagerService,
    private dataReplication: DataReplicationService,
    private loadBalancer: LoadBalancerService
  ) {
    this.logger.log('MultiRegionService initialized');
  }

  async getGlobalMetrics(): Promise<MultiRegionMetrics> {
    const regionMetrics = this.regionManager.getMetrics();
    const replicationStats = this.dataReplication.getReplicationStats();
    const syncStatus = this.dataReplication.getSyncStatus();

    return {
      ...regionMetrics,
      dataSyncStatus: syncStatus,
      replicationQueue: {
        pending: replicationStats.pending,
        processing: replicationStats.processing,
        completed: replicationStats.completed,
        failed: replicationStats.failed
      }
    };
  }

  async getRegions(): Promise<RegionConfig[]> {
    return this.regionManager.getRegions();
  }

  async getActiveRegions(): Promise<RegionConfig[]> {
    return this.regionManager.getActiveRegions();
  }

  async getRegion(regionId: string): Promise<RegionConfig | undefined> {
    return this.regionManager.getRegion(regionId);
  }

  async getRegionHealth(regionId?: string): Promise<RegionHealth[]> {
    if (regionId) {
      const health = this.regionManager.getRegionHealth(regionId);
      return health ? [health] : [];
    }
    return this.regionManager.getAllRegionHealth();
  }

  async getCurrentRegion(): Promise<RegionConfig | undefined> {
    return this.regionManager.getCurrentRegion();
  }

  async getCurrentRegionId(): Promise<string> {
    return this.regionManager.getCurrentRegionId();
  }

  async selectOptimalRegion(request: {
    path: string;
    method: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    clientLocation?: { latitude: number; longitude: number };
  }): Promise<RegionConfig | null> {
    return this.loadBalancer.selectRegion(request);
  }

  async replicateData(
    dataType: string,
    dataId: string,
    operation: 'create' | 'update' | 'delete',
    data: any,
    sourceRegion?: string
  ): Promise<string> {
    return this.dataReplication.replicateData(dataType, dataId, operation, data, sourceRegion);
  }

  async getDataSyncStatus(regionId?: string): Promise<DataSyncStatus[]> {
    return this.dataReplication.getSyncStatus(regionId);
  }

  async getDataConflicts(): Promise<DataConflict[]> {
    return this.dataReplication.getConflicts();
  }

  async resolveDataConflict(
    conflictId: string,
    strategy: string,
    resolvedBy: string,
    finalData: any
  ): Promise<boolean> {
    return this.dataReplication.resolveConflict(conflictId, strategy, resolvedBy, finalData);
  }

  async getReplicationQueue(): Promise<any[]> {
    return this.dataReplication.getReplicationQueue();
  }

  async getReplicationStats(): Promise<any> {
    return this.dataReplication.getReplicationStats();
  }

  async getLoadBalancerStats(): Promise<any> {
    return this.loadBalancer.getRequestStats();
  }

  async getRegionEvents(limit: number = 100): Promise<RegionEvent[]> {
    return this.regionManager.getEvents(limit);
  }

  async updateRegionStatus(regionId: string, status: 'active' | 'inactive' | 'maintenance' | 'failed'): Promise<boolean> {
    return this.regionManager.updateRegionStatus(regionId, status);
  }

  async getRegionByLocation(latitude: number, longitude: number): Promise<RegionConfig | undefined> {
    return this.regionManager.getRegionByLocation(latitude, longitude);
  }

  async pauseReplication(): Promise<void> {
    await this.dataReplication.pauseReplication();
  }

  async resumeReplication(): Promise<void> {
    await this.dataReplication.resumeReplication();
  }

  async getReplicationConfig(): Promise<any> {
    return this.dataReplication.getReplicationConfig();
  }

  async updateReplicationConfig(config: any): Promise<void> {
    this.dataReplication.updateReplicationConfig(config);
  }

  async getLoadBalancerConfig(): Promise<any> {
    return this.loadBalancer.getLoadBalancerConfig();
  }

  async updateLoadBalancerConfig(config: any): Promise<void> {
    this.loadBalancer.updateLoadBalancerConfig(config);
  }

  async addRoutingRule(rule: {
    condition: {
      path?: string;
      method?: string;
      headers?: Record<string, string>;
      query?: Record<string, string>;
    };
    target: {
      regionId: string;
      weight: number;
    };
    priority: number;
  }): Promise<string> {
    return this.loadBalancer.addRoutingRule(rule);
  }

  async removeRoutingRule(ruleId: string): Promise<boolean> {
    return this.loadBalancer.removeRoutingRule(ruleId);
  }

  async getGlobalLoadBalancer(): Promise<any> {
    return this.loadBalancer.getGlobalLoadBalancer();
  }

  async resetLoadBalancerStats(): Promise<void> {
    this.loadBalancer.resetStats();
  }

  async simulateRegionFailure(regionId: string): Promise<boolean> {
    const region = this.regionManager.getRegion(regionId);
    if (!region) {
      return false;
    }

    this.logger.warn(`Simulating failure for region ${regionId}`);
    return this.regionManager.updateRegionStatus(regionId, 'failed');
  }

  async simulateRegionRecovery(regionId: string): Promise<boolean> {
    const region = this.regionManager.getRegion(regionId);
    if (!region) {
      return false;
    }

    this.logger.log(`Simulating recovery for region ${regionId}`);
    return this.regionManager.updateRegionStatus(regionId, 'active');
  }

  async simulateDataConflict(
    dataType: string,
    dataId: string,
    regions: string[],
    versions: { region: string; data: any; timestamp: Date }[]
  ): Promise<DataConflict | null> {
    return this.dataReplication.detectConflict(dataType, dataId, regions, versions);
  }

  async getHealthSummary(): Promise<{
    totalRegions: number;
    healthyRegions: number;
    unhealthyRegions: number;
    maintenanceRegions: number;
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    const regions = this.regionManager.getRegions();
    const healthChecks = this.regionManager.getAllRegionHealth();

    const healthyRegions = healthChecks.filter(h => h.status === 'healthy').length;
    const unhealthyRegions = healthChecks.filter(h => h.status === 'unhealthy').length;
    const maintenanceRegions = regions.filter(r => r.status === 'maintenance').length;

    let overallHealth: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyRegions === 0) {
      overallHealth = 'healthy';
    } else if (unhealthyRegions < regions.length / 2) {
      overallHealth = 'degraded';
    } else {
      overallHealth = 'unhealthy';
    }

    return {
      totalRegions: regions.length,
      healthyRegions,
      unhealthyRegions,
      maintenanceRegions,
      overallHealth
    };
  }

  async getPerformanceMetrics(): Promise<{
    averageLatency: number;
    totalRequests: number;
    errorRate: number;
    throughput: number;
    regionPerformance: Array<{
      regionId: string;
      latency: number;
      requests: number;
      errorRate: number;
    }>;
  }> {
    const metrics = this.regionManager.getMetrics();
    const loadBalancerStats = this.loadBalancer.getRequestStats();
    const healthChecks = this.regionManager.getAllRegionHealth();

    const regionPerformance = healthChecks.map(health => {
      const region = this.regionManager.getRegion(health.regionId);
      const requestCount = loadBalancerStats.regionStats.find(
        stat => stat.regionId === health.regionId
      )?.requestCount || 0;

      return {
        regionId: health.regionId,
        latency: health.responseTime,
        requests: requestCount,
        errorRate: health.errorRate
      };
    });

    return {
      averageLatency: metrics.averageLatency,
      totalRequests: metrics.totalRequests,
      errorRate: metrics.errorRate,
      throughput: loadBalancerStats.totalRequests,
      regionPerformance
    };
  }
}
