import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  RegionConfig, 
  RegionHealth, 
  RegionEvent,
  MultiRegionMetrics 
} from '../interfaces/multi-region.interface';
import axios from 'axios';
import * as uuid from 'uuid';

@Injectable()
export class RegionManagerService {
  private readonly logger = new Logger(RegionManagerService.name);
  private regions: Map<string, RegionConfig> = new Map();
  private healthChecks: Map<string, RegionHealth> = new Map();
  private events: RegionEvent[] = [];
  private currentRegionId: string;

  constructor(private configService: ConfigService) {
    this.currentRegionId = this.configService.get<string>('REGION_ID', 'us-east-1');
    this.initializeRegions();
    this.startHealthChecks();
  }

  private initializeRegions() {
    const defaultRegions: RegionConfig[] = [
      {
        id: 'us-east-1',
        name: 'US East (N. Virginia)',
        location: {
          country: 'United States',
          city: 'N. Virginia',
          coordinates: { latitude: 38.9072, longitude: -77.0369 }
        },
        endpoints: {
          api: 'https://api-us-east-1.example.com',
          health: 'https://api-us-east-1.example.com/health',
          replication: 'https://replication-us-east-1.example.com'
        },
        status: 'active',
        priority: 1,
        capacity: {
          maxConnections: 10000,
          currentConnections: 0,
          cpuUsage: 0,
          memoryUsage: 0
        },
        latency: {
          average: 50,
          p95: 100,
          p99: 200
        },
        lastHealthCheck: new Date(),
        features: ['api', 'database', 'cache', 'storage']
      },
      {
        id: 'us-west-2',
        name: 'US West (Oregon)',
        location: {
          country: 'United States',
          city: 'Oregon',
          coordinates: { latitude: 45.5152, longitude: -122.6784 }
        },
        endpoints: {
          api: 'https://api-us-west-2.example.com',
          health: 'https://api-us-west-2.example.com/health',
          replication: 'https://replication-us-west-2.example.com'
        },
        status: 'active',
        priority: 2,
        capacity: {
          maxConnections: 10000,
          currentConnections: 0,
          cpuUsage: 0,
          memoryUsage: 0
        },
        latency: {
          average: 60,
          p95: 120,
          p99: 250
        },
        lastHealthCheck: new Date(),
        features: ['api', 'database', 'cache', 'storage']
      },
      {
        id: 'eu-west-1',
        name: 'Europe (Ireland)',
        location: {
          country: 'Ireland',
          city: 'Dublin',
          coordinates: { latitude: 53.3498, longitude: -6.2603 }
        },
        endpoints: {
          api: 'https://api-eu-west-1.example.com',
          health: 'https://api-eu-west-1.example.com/health',
          replication: 'https://replication-eu-west-1.example.com'
        },
        status: 'active',
        priority: 3,
        capacity: {
          maxConnections: 10000,
          currentConnections: 0,
          cpuUsage: 0,
          memoryUsage: 0
        },
        latency: {
          average: 80,
          p95: 150,
          p99: 300
        },
        lastHealthCheck: new Date(),
        features: ['api', 'database', 'cache', 'storage']
      },
      {
        id: 'ap-southeast-1',
        name: 'Asia Pacific (Singapore)',
        location: {
          country: 'Singapore',
          city: 'Singapore',
          coordinates: { latitude: 1.3521, longitude: 103.8198 }
        },
        endpoints: {
          api: 'https://api-ap-southeast-1.example.com',
          health: 'https://api-ap-southeast-1.example.com/health',
          replication: 'https://replication-ap-southeast-1.example.com'
        },
        status: 'active',
        priority: 4,
        capacity: {
          maxConnections: 10000,
          currentConnections: 0,
          memoryUsage: 0,
          cpuUsage: 0
        },
        latency: {
          average: 100,
          p95: 200,
          p99: 400
        },
        lastHealthCheck: new Date(),
        features: ['api', 'database', 'cache', 'storage']
      }
    ];

    defaultRegions.forEach(region => {
      this.regions.set(region.id, region);
      this.healthChecks.set(region.id, {
        regionId: region.id,
        status: 'healthy',
        responseTime: 0,
        errorRate: 0,
        lastCheck: new Date(),
        issues: [],
        metrics: {
          cpu: 0,
          memory: 0,
          disk: 0,
          network: 0
        }
      });
    });

    this.logger.log(`Initialized ${this.regions.size} regions`);
  }

  private startHealthChecks() {
    // Run health checks every 30 seconds
    setInterval(() => {
      this.performHealthChecks();
    }, 30000);

    // Initial health check
    this.performHealthChecks();
  }

  private async performHealthChecks() {
    const promises = Array.from(this.regions.values()).map(region => 
      this.checkRegionHealth(region)
    );
    
    await Promise.allSettled(promises);
  }

  private async checkRegionHealth(region: RegionConfig): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Simulate health check (in real implementation, make actual HTTP call)
      const response = await this.simulateHealthCheck(region);
      const responseTime = Date.now() - startTime;

      const health: RegionHealth = {
        regionId: region.id,
        status: response.healthy ? 'healthy' : 'unhealthy',
        responseTime,
        errorRate: response.errorRate || 0,
        lastCheck: new Date(),
        issues: response.issues || [],
        metrics: {
          cpu: response.metrics?.cpu || 0,
          memory: response.metrics?.memory || 0,
          disk: response.metrics?.disk || 0,
          network: response.metrics?.network || 0
        }
      };

      this.healthChecks.set(region.id, health);

      // Update region status based on health
      const previousStatus = region.status;
      if (health.status === 'unhealthy' && region.status === 'active') {
        region.status = 'failed';
        this.emitEvent('region-down', region.id, { health });
      } else if (health.status === 'healthy' && region.status === 'failed') {
        region.status = 'active';
        this.emitEvent('region-up', region.id, { health });
      }

      // Update region capacity metrics
      region.capacity.cpuUsage = health.metrics.cpu;
      region.capacity.memoryUsage = health.metrics.memory;
      region.latency.average = responseTime;

    } catch (error) {
      this.logger.error(`Health check failed for region ${region.id}: ${error.message}`);
      
      const health: RegionHealth = {
        regionId: region.id,
        status: 'unhealthy',
        responseTime: -1,
        errorRate: 1,
        lastCheck: new Date(),
        issues: [`Health check failed: ${error.message}`],
        metrics: {
          cpu: 0,
          memory: 0,
          disk: 0,
          network: 0
        }
      };

      this.healthChecks.set(region.id, health);
      region.status = 'failed';
      this.emitEvent('region-down', region.id, { error: error.message });
    }
  }

  private async simulateHealthCheck(region: RegionConfig): Promise<any> {
    // Simulate health check response
    const isHealthy = Math.random() > 0.1; // 90% chance of being healthy
    
    return {
      healthy: isHealthy,
      errorRate: isHealthy ? Math.random() * 0.05 : Math.random() * 0.2,
      issues: isHealthy ? [] : ['High CPU usage', 'Memory pressure'],
      metrics: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 100
      }
    };
  }

  getRegions(): RegionConfig[] {
    return Array.from(this.regions.values());
  }

  getRegion(regionId: string): RegionConfig | undefined {
    return this.regions.get(regionId);
  }

  getActiveRegions(): RegionConfig[] {
    return this.getRegions().filter(region => region.status === 'active');
  }

  getRegionHealth(regionId: string): RegionHealth | undefined {
    return this.healthChecks.get(regionId);
  }

  getAllRegionHealth(): RegionHealth[] {
    return Array.from(this.healthChecks.values());
  }

  getCurrentRegion(): RegionConfig | undefined {
    return this.getRegion(this.currentRegionId);
  }

  getCurrentRegionId(): string {
    return this.currentRegionId;
  }

  getMetrics(): MultiRegionMetrics {
    const regions = this.getRegions();
    const activeRegions = this.getActiveRegions();
    const healthChecks = this.getAllRegionHealth();

    const totalRequests = regions.reduce((sum, region) => sum + region.capacity.currentConnections, 0);
    const averageLatency = healthChecks.reduce((sum, health) => sum + health.responseTime, 0) / healthChecks.length;
    const errorRate = healthChecks.reduce((sum, health) => sum + health.errorRate, 0) / healthChecks.length;

    return {
      totalRegions: regions.length,
      activeRegions: activeRegions.length,
      totalRequests,
      averageLatency: averageLatency || 0,
      errorRate: errorRate || 0,
      dataSyncStatus: [], // Will be populated by data sync service
      regionHealth: healthChecks,
      replicationQueue: {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      }
    };
  }

  getEvents(limit: number = 100): RegionEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  private emitEvent(type: RegionEvent['type'], regionId: string, data: any): void {
    const event: RegionEvent = {
      id: uuid.v4(),
      type,
      regionId,
      timestamp: new Date(),
      data,
      severity: this.getEventSeverity(type)
    };

    this.events.unshift(event);
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(0, 1000);
    }

    this.logger.log(`Region event: ${type} for region ${regionId}`, data);
  }

  private getEventSeverity(type: RegionEvent['type']): RegionEvent['severity'] {
    switch (type) {
      case 'region-down':
      case 'failover':
        return 'critical';
      case 'region-maintenance':
        return 'warning';
      case 'region-up':
      case 'data-sync':
        return 'info';
      case 'conflict-detected':
        return 'error';
      default:
        return 'info';
    }
  }

  updateRegionStatus(regionId: string, status: RegionConfig['status']): boolean {
    const region = this.regions.get(regionId);
    if (!region) {
      return false;
    }

    const previousStatus = region.status;
    region.status = status;
    region.lastHealthCheck = new Date();

    this.emitEvent('region-maintenance', regionId, { 
      previousStatus, 
      newStatus: status 
    });

    return true;
  }

  getRegionByLocation(latitude: number, longitude: number): RegionConfig | undefined {
    let closestRegion: RegionConfig | undefined;
    let minDistance = Infinity;

    for (const region of this.regions.values()) {
      if (region.status !== 'active') continue;

      const distance = this.calculateDistance(
        latitude,
        longitude,
        region.location.coordinates.latitude,
        region.location.coordinates.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestRegion = region;
      }
    }

    return closestRegion;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
