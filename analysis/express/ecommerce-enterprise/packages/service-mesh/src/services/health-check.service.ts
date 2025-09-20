import { Injectable, Logger } from '@nestjs/common';
import { ServiceInstance } from '../interfaces/service-mesh-options.interface';
import { HealthMonitor } from '../utils/health-monitor';
import { ServiceRegistry } from '../utils/service-registry';

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);

  constructor(
    private readonly healthMonitor: HealthMonitor,
    private readonly serviceRegistry: ServiceRegistry,
  ) {}

  async checkInstanceHealth(instance: ServiceInstance): Promise<boolean> {
    return this.healthMonitor.checkHealth(instance);
  }

  async checkServiceHealth(serviceName: string): Promise<{
    total: number;
    healthy: number;
    unhealthy: number;
    instances: ServiceInstance[];
  }> {
    const instances = await this.serviceRegistry.getServiceInstances(serviceName);
    const healthResults = await this.healthMonitor.checkServiceHealth(serviceName, instances);
    
    const healthy = healthResults.filter(instance => instance.health === 'healthy');
    const unhealthy = healthResults.filter(instance => instance.health === 'unhealthy');
    
    return {
      total: instances.length,
      healthy: healthy.length,
      unhealthy: unhealthy.length,
      instances: healthResults,
    };
  }

  async checkAllServicesHealth(): Promise<Record<string, {
    total: number;
    healthy: number;
    unhealthy: number;
    instances: ServiceInstance[];
  }>> {
    const allServices = await this.serviceRegistry.getAllServices();
    const results: Record<string, any> = {};
    
    for (const [serviceName] of Object.entries(allServices)) {
      results[serviceName] = await this.checkServiceHealth(serviceName);
    }
    
    return results;
  }

  async getHealthyInstances(serviceName: string): Promise<ServiceInstance[]> {
    const instances = await this.serviceRegistry.getServiceInstances(serviceName);
    return this.healthMonitor.getHealthyInstances(instances);
  }

  async getUnhealthyInstances(serviceName: string): Promise<ServiceInstance[]> {
    const instances = await this.serviceRegistry.getServiceInstances(serviceName);
    return this.healthMonitor.getUnhealthyInstances(instances);
  }

  async updateInstanceHealth(instance: ServiceInstance, isHealthy: boolean): Promise<void> {
    instance.health = isHealthy ? 'healthy' : 'unhealthy';
    instance.lastSeen = new Date();
    await this.serviceRegistry.updateServiceInstance(instance);
  }
}