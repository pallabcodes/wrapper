import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  LoadBalancerConfig, 
  GlobalLoadBalancer, 
  RegionConfig,
  RoutingRule,
  // FailoverConfig 
} from '../interfaces/multi-region.interface';
import { RegionManagerService } from './region-manager.service';
import * as uuid from 'uuid';

@Injectable()
export class LoadBalancerService {
  private readonly logger = new Logger(LoadBalancerService.name);
  private config: LoadBalancerConfig;
  private globalLoadBalancer!: GlobalLoadBalancer;
  private requestCounts: Map<string, number> = new Map();
  private lastRequestTimes: Map<string, Date> = new Map();

  constructor(
    private configService: ConfigService,
    private regionManager: RegionManagerService
  ) {
    this.config = this.configService.get<LoadBalancerConfig>('LOAD_BALANCER_CONFIG') || {
      strategy: 'latency',
      healthCheck: {
        enabled: true,
        interval: 30000,
        timeout: 5000,
        path: '/health'
      },
      failover: {
        enabled: true,
        threshold: 3,
        cooldown: 60000
      },
      stickySessions: false,
      maxRetries: 3
    };

    this.initializeGlobalLoadBalancer();
    this.startHealthChecks();
  }

  private initializeGlobalLoadBalancer() {
    const regions = this.regionManager.getRegions();
    const healthChecks = this.regionManager.getAllRegionHealth();

    this.globalLoadBalancer = {
      id: 'global-lb-001',
      name: 'Global Load Balancer',
      strategy: 'latency',
      regions,
      healthChecks,
      routingRules: this.createDefaultRoutingRules(),
      failoverConfig: {
        enabled: true,
        primaryRegion: 'us-east-1',
        secondaryRegions: ['us-west-2', 'eu-west-1'],
        healthCheckThreshold: 3,
        failoverDelay: 5000,
        recoveryDelay: 30000,
        autoRecovery: true
      }
    };

    this.logger.log('Global load balancer initialized');
  }

  private createDefaultRoutingRules(): RoutingRule[] {
    return [
      {
        id: 'rule-001',
        condition: {
          path: '/api/users/*',
          method: 'GET'
        },
        target: {
          regionId: 'us-east-1',
          weight: 100
        },
        priority: 1
      },
      {
        id: 'rule-002',
        condition: {
          path: '/api/orders/*',
          method: 'POST'
        },
        target: {
          regionId: 'us-west-2',
          weight: 100
        },
        priority: 1
      },
      {
        id: 'rule-003',
        condition: {
          path: '/api/*'
        },
        target: {
          regionId: 'us-east-1',
          weight: 50
        },
        priority: 10
      }
    ];
  }

  private startHealthChecks() {
    if (!this.config.healthCheck.enabled) {
      return;
    }

    setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheck.interval);

    this.logger.log('Load balancer health checks started');
  }

  private async performHealthChecks() {
    const regions = this.regionManager.getActiveRegions();
    
    for (const region of regions) {
      try {
        const startTime = Date.now();
        
        // Simulate health check
        const isHealthy = await this.checkRegionHealth(region);
        const responseTime = Date.now() - startTime;

        if (!isHealthy) {
          this.logger.warn(`Region ${region.id} failed health check`);
          this.handleRegionFailure(region.id);
        } else {
          this.logger.debug(`Region ${region.id} health check passed (${responseTime}ms)`);
        }

      } catch (error) {
        this.logger.error(`Health check failed for region ${region.id}: ${(error as Error).message}`);
        this.handleRegionFailure(region.id);
      }
    }
  }

  private async checkRegionHealth(_region: RegionConfig): Promise<boolean> {
    // Simulate health check (in real implementation, make actual HTTP call)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    // 95% success rate
    return Math.random() > 0.05;
  }

  private handleRegionFailure(regionId: string) {
    const region = this.regionManager.getRegion(regionId);
    if (!region) return;

    region.status = 'failed';
    this.logger.warn(`Region ${regionId} marked as failed`);

    // Trigger failover if enabled
    if (this.config.failover.enabled) {
      this.triggerFailover(regionId);
    }
  }

  private triggerFailover(regionId: string) {
    const failoverConfig = this.globalLoadBalancer.failoverConfig;
    
    if (regionId === failoverConfig.primaryRegion) {
      this.logger.warn(`Primary region ${regionId} failed, triggering failover`);
      
      // Select new primary region
      const secondaryRegions = this.regionManager.getActiveRegions()
        .filter(r => failoverConfig.secondaryRegions.includes(r.id));
      
      if (secondaryRegions.length > 0) {
        const newPrimary = secondaryRegions[0];
        if (newPrimary) {
          failoverConfig.primaryRegion = newPrimary.id;
          this.logger.log(`Failover completed: new primary region is ${newPrimary.id}`);
        }
      }
    }
  }

  selectRegion(
    request: {
      path: string;
      method: string;
      headers?: Record<string, string>;
      query?: Record<string, string>;
      clientLocation?: { latitude: number; longitude: number };
    }
  ): RegionConfig | null {
    // First, try to match routing rules
    const matchedRule = this.matchRoutingRule(request);
    if (matchedRule) {
      const region = this.regionManager.getRegion(matchedRule.target.regionId);
      if (region && region.status === 'active') {
        return region;
      }
    }

    // Fall back to load balancing strategy
    return this.selectRegionByStrategy(request);
  }

  private matchRoutingRule(request: {
    path: string;
    method: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
  }): RoutingRule | null {
    const rules = this.globalLoadBalancer.routingRules
      .sort((a, b) => a.priority - b.priority);

    for (const rule of rules) {
      if (this.matchesRule(request, rule.condition)) {
        return rule;
      }
    }

    return null;
  }

  private matchesRule(
    request: { path: string; method: string; headers?: Record<string, string>; query?: Record<string, string> },
    condition: RoutingRule['condition']
  ): boolean {
    if (condition.path && !this.matchesPath(request.path, condition.path)) {
      return false;
    }

    if (condition.method && request.method !== condition.method) {
      return false;
    }

    if (condition.headers) {
      for (const [key, value] of Object.entries(condition.headers)) {
        if (request.headers?.[key] !== value) {
          return false;
        }
      }
    }

    if (condition.query) {
      for (const [key, value] of Object.entries(condition.query)) {
        if (request.query?.[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  private matchesPath(requestPath: string, rulePath: string): boolean {
    // Simple wildcard matching (in real implementation, use proper path matching)
    if (rulePath.endsWith('*')) {
      const prefix = rulePath.slice(0, -1);
      return requestPath.startsWith(prefix);
    }
    return requestPath === rulePath;
  }

  private selectRegionByStrategy(request: {
    path: string;
    method: string;
    clientLocation?: { latitude: number; longitude: number };
  }): RegionConfig | null {
    const activeRegions = this.regionManager.getActiveRegions();
    
    if (activeRegions.length === 0) {
      return null;
    }

    switch (this.config.strategy) {
      case 'round-robin':
        return this.selectRoundRobin(activeRegions);
      
      case 'least-connections':
        return this.selectLeastConnections(activeRegions);
      
      case 'latency':
        return this.selectLatencyBased(activeRegions);
      
      case 'geographic':
        return this.selectGeographic(activeRegions, request.clientLocation);
      
      default:
        return activeRegions[0] || null;
    }
  }

  private selectRoundRobin(regions: RegionConfig[]): RegionConfig {
    if (regions.length === 0) {
      throw new Error('No regions available');
    }
    
    const regionIds = regions.map(r => r.id);
    const counts = regionIds.map(id => this.requestCounts.get(id) || 0);
    const minCount = Math.min(...counts);
    const minIndex = counts.indexOf(minCount);
    
    const selectedRegion = regions[minIndex];
    if (!selectedRegion) {
      throw new Error('No region selected');
    }
    
    this.requestCounts.set(selectedRegion.id, (this.requestCounts.get(selectedRegion.id) || 0) + 1);
    
    return selectedRegion;
  }

  private selectLeastConnections(regions: RegionConfig[]): RegionConfig {
    if (regions.length === 0) {
      throw new Error('No regions available');
    }
    return regions.reduce((min, region) => 
      region.capacity.currentConnections < min.capacity.currentConnections ? region : min
    );
  }

  private selectLatencyBased(regions: RegionConfig[]): RegionConfig {
    if (regions.length === 0) {
      throw new Error('No regions available');
    }
    return regions.reduce((min, region) => 
      region.latency.average < min.latency.average ? region : min
    );
  }

  private selectGeographic(regions: RegionConfig[], clientLocation?: { latitude: number; longitude: number }): RegionConfig {
    if (!clientLocation) {
      return this.selectLatencyBased(regions);
    }

    const region = this.regionManager.getRegionByLocation(
      clientLocation.latitude,
      clientLocation.longitude
    );
    return region || regions[0] || (() => { throw new Error('No regions available'); })();
  }

  getLoadBalancerConfig(): LoadBalancerConfig {
    return { ...this.config };
  }

  getGlobalLoadBalancer(): GlobalLoadBalancer {
    return { ...this.globalLoadBalancer };
  }

  updateLoadBalancerConfig(config: Partial<LoadBalancerConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log('Load balancer configuration updated', config);
  }

  addRoutingRule(rule: Omit<RoutingRule, 'id'>): string {
    const newRule: RoutingRule = {
      ...rule,
      id: uuid.v4()
    };

    this.globalLoadBalancer.routingRules.push(newRule);
    this.logger.log('Routing rule added', newRule);
    
    return newRule.id;
  }

  removeRoutingRule(ruleId: string): boolean {
    const index = this.globalLoadBalancer.routingRules.findIndex(r => r.id === ruleId);
    if (index === -1) {
      return false;
    }

    this.globalLoadBalancer.routingRules.splice(index, 1);
    this.logger.log(`Routing rule ${ruleId} removed`);
    
    return true;
  }

  getRequestStats() {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((sum, count) => sum + count, 0);
    const regionStats = Array.from(this.requestCounts.entries()).map(([regionId, count]) => ({
      regionId,
      requestCount: count,
      percentage: totalRequests > 0 ? (count / totalRequests) * 100 : 0
    }));

    return {
      totalRequests,
      regionStats
    };
  }

  resetStats(): void {
    this.requestCounts.clear();
    this.lastRequestTimes.clear();
    this.logger.log('Load balancer stats reset');
  }
}
