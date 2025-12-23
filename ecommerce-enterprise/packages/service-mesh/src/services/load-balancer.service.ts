import { Injectable, Logger } from '@nestjs/common';
import { ServiceInstance } from '../interfaces/service-mesh-options.interface';
import { ServiceRegistry } from '../utils/service-registry';
import { LoadBalancerOptions } from '../interfaces/load-balancer-options.interface';

@Injectable()
export class LoadBalancerService {
  private readonly logger = new Logger(LoadBalancerService.name);
  private readonly connectionCounts = new Map<string, number>();
  private currentIndex = 0;

  constructor(private readonly serviceRegistry: ServiceRegistry) {}

  async selectInstance(
    serviceName: string,
    options?: LoadBalancerOptions,
  ): Promise<ServiceInstance | null> {
    const instances = await this.serviceRegistry.getServiceInstances(serviceName);
    
    if (instances.length === 0) {
      this.logger.warn(`No instances available for service: ${serviceName}`);
      return null;
    }

    // Filter healthy instances
    const healthyInstances = instances.filter(instance => instance.health === 'healthy');
    
    if (healthyInstances.length === 0) {
      this.logger.warn(`No healthy instances available for service: ${serviceName}`);
      return null;
    }

    const algorithm = options?.algorithm || 'round-robin';
    
    switch (algorithm) {
      case 'round-robin':
        return this.roundRobin(healthyInstances);
      case 'least-connections':
        return this.leastConnections(healthyInstances);
      case 'weighted':
        return this.weighted(healthyInstances);
      case 'ip-hash':
        return this.ipHash(healthyInstances, options?.clientIp);
      case 'random':
        return this.random(healthyInstances);
      default:
        return this.roundRobin(healthyInstances);
    }
  }

  private roundRobin(instances: ServiceInstance[]): ServiceInstance {
    if (instances.length === 0) {
      throw new Error('No instances available');
    }
    const instance = instances[this.currentIndex % instances.length];
    if (!instance) {
      throw new Error('No instance found at index');
    }
    this.currentIndex = (this.currentIndex + 1) % instances.length;
    return instance;
  }

  private leastConnections(instances: ServiceInstance[]): ServiceInstance {
    if (instances.length === 0) {
      throw new Error("No instances available");
    }
    let selectedInstance = instances[0];
    if (!selectedInstance) {
      throw new Error("No instance found");
    }
    let minConnections = this.connectionCounts.get(selectedInstance.id) || 0;

    for (const instance of instances) {
      const connections = this.connectionCounts.get(instance.id) || 0;
      if (connections < minConnections) {
        minConnections = connections;
        selectedInstance = instance;
      }
    }

    // Increment connection count
    const currentCount = this.connectionCounts.get(selectedInstance.id) || 0;
    this.connectionCounts.set(selectedInstance.id, currentCount + 1);

    return selectedInstance;
  }

  private weighted(instances: ServiceInstance[]): ServiceInstance {
    if (instances.length === 0) {
      throw new Error("No instances available");
    }
    // Calculate total weight
    const totalWeight = instances.reduce((sum, instance) => sum + (instance.weight || 1), 0);
    
    // Generate random number between 0 and totalWeight
    let random = Math.random() * totalWeight;
    
    // Select instance based on weight
    for (const instance of instances) {
      random -= instance.weight || 1;
      if (random <= 0) {
        return instance;
      }
    }

    // Fallback to first instance
    const fallback = instances[0];
    if (!fallback) {
      throw new Error("No instance found");
    }
    return fallback;
  }

  private ipHash(instances: ServiceInstance[], clientIp?: string): ServiceInstance {
    if (instances.length === 0) {
      throw new Error("No instances available");
    }
    if (!clientIp) {
      // Fallback to round-robin if no client IP
      return this.roundRobin(instances);
    }

    // Simple hash function for IP
    let hash = 0;
    for (let i = 0; i < clientIp.length; i++) {
      const char = clientIp.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    const index = Math.abs(hash) % instances.length;
    const instance = instances[index];
    if (!instance) {
      throw new Error("No instance found at index");
    }
    return instance;
  }

  private random(instances: ServiceInstance[]): ServiceInstance {
    if (instances.length === 0) {
      throw new Error("No instances available");
    }
    const index = Math.floor(Math.random() * instances.length);
    const instance = instances[index];
    if (!instance) {
      throw new Error("No instance found at index");
    }
    return instance;
  }

  async releaseConnection(instanceId: string): Promise<void> {
    const currentCount = this.connectionCounts.get(instanceId) || 0;
    if (currentCount > 0) {
      this.connectionCounts.set(instanceId, currentCount - 1);
    }
  }

  async getConnectionCount(instanceId: string): Promise<number> {
    return this.connectionCounts.get(instanceId) || 0;
  }

  async getConnectionCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const [instanceId, count] of this.connectionCounts.entries()) {
      counts[instanceId] = count;
    }
    return counts;
  }

  async resetConnectionCounts(): Promise<void> {
    this.connectionCounts.clear();
  }

  async getLoadBalancerStats(): Promise<{
    totalConnections: number;
    instanceCounts: Record<string, number>;
    algorithm: string;
  }> {
    const totalConnections = Array.from(this.connectionCounts.values()).reduce((sum, count) => sum + count, 0);
    const instanceCounts = await this.getConnectionCounts();

    return {
      totalConnections,
      instanceCounts,
      algorithm: 'dynamic', // This would be the current algorithm
    };
  }
}
