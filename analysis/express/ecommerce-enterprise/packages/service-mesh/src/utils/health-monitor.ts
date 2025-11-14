import { Injectable, Logger } from '@nestjs/common';
import { ServiceInstance } from '../interfaces/service-mesh-options.interface';
import axios from 'axios';

@Injectable()
export class HealthMonitor {
  private readonly logger = new Logger(HealthMonitor.name);

  async checkHealth(instance: ServiceInstance): Promise<boolean> {
    try {
      const healthUrl = `${instance.protocol}://${instance.host}:${instance.port}/health`;
      const response = await axios.get(healthUrl, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      this.logger.warn(`Health check failed for ${instance.id}: ${error}`);
      return false;
    }
  }

  async checkServiceHealth(_serviceName: string, instances: ServiceInstance[]): Promise<ServiceInstance[]> {
    const healthChecks = instances.map(async (instance) => {
      const isHealthy = await this.checkHealth(instance);
      return { ...instance, health: isHealthy ? 'healthy' as const : 'unhealthy' as const };
    });

    return Promise.all(healthChecks);
  }

  async getHealthyInstances(instances: ServiceInstance[]): Promise<ServiceInstance[]> {
    const healthChecks = await this.checkServiceHealth('', instances);
    return healthChecks.filter(instance => instance.health === 'healthy');
  }

  async getUnhealthyInstances(instances: ServiceInstance[]): Promise<ServiceInstance[]> {
    const healthChecks = await this.checkServiceHealth('', instances);
    return healthChecks.filter(instance => instance.health === 'unhealthy');
  }
}