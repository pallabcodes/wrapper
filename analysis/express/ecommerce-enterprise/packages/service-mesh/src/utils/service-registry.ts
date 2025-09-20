import { Injectable, Logger } from '@nestjs/common';
import { ServiceInstance } from '../interfaces/service-mesh-options.interface';

@Injectable()
export class ServiceRegistry {
  private readonly logger = new Logger(ServiceRegistry.name);
  private readonly services = new Map<string, ServiceInstance[]>();

  async registerService(serviceName: string, instances: ServiceInstance[]): Promise<void> {
    this.services.set(serviceName, instances);
    this.logger.log(`Registered service: ${serviceName} with ${instances.length} instances`);
  }

  async deregisterService(serviceName: string, instanceId: string): Promise<void> {
    const instances = this.services.get(serviceName) || [];
    const filteredInstances = instances.filter(instance => instance.id !== instanceId);
    this.services.set(serviceName, filteredInstances);
    this.logger.log(`Deregistered instance: ${instanceId} from service: ${serviceName}`);
  }

  async getServiceInstances(serviceName: string): Promise<ServiceInstance[]> {
    return this.services.get(serviceName) || [];
  }

  async updateServiceInstance(instance: ServiceInstance): Promise<void> {
    const instances = this.services.get(instance.name) || [];
    const index = instances.findIndex(i => i.id === instance.id);
    if (index >= 0) {
      instances[index] = instance;
      this.services.set(instance.name, instances);
    }
  }

  async getAllServices(): Promise<Record<string, ServiceInstance[]>> {
    const result: Record<string, ServiceInstance[]> = {};
    for (const [serviceName, instances] of this.services.entries()) {
      result[serviceName] = instances;
    }
    return result;
  }

  async clear(): Promise<void> {
    this.services.clear();
    this.logger.log('Cleared all service registrations');
  }
}