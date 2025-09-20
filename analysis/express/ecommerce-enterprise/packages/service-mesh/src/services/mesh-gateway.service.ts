import { Injectable, Logger } from '@nestjs/common';
import { ServiceInstance } from '../interfaces/service-mesh-options.interface';
import { LoadBalancerService } from './load-balancer.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { ServiceDiscoveryService } from './service-discovery.service';
import { MeshMetrics } from '../utils/mesh-metrics';
import axios, { AxiosResponse } from 'axios';

export interface ServiceCallOptions {
  serviceName: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  timeout?: number;
  retries?: number;
  circuitBreaker?: boolean;
  loadBalancer?: {
    algorithm?: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' | 'random';
    clientIp?: string;
  };
  headers?: Record<string, string>;
  auth?: {
    enabled: boolean;
    token?: string;
  };
}

@Injectable()
export class MeshGatewayService {
  private readonly logger = new Logger(MeshGatewayService.name);

  constructor(
    private readonly loadBalancer: LoadBalancerService,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
    private readonly metrics: MeshMetrics,
  ) {}

  async callService<T = any>(options: ServiceCallOptions, data?: any): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Discover service instances
      const instances = await this.serviceDiscovery.discoverService(options.serviceName);
      if (instances.length === 0) {
        throw new Error(`No instances found for service: ${options.serviceName}`);
      }

      // Select instance using load balancer
      const instance = await this.loadBalancer.selectInstance(options.serviceName, options.loadBalancer);
      if (!instance) {
        throw new Error(`No healthy instances available for service: ${options.serviceName}`);
      }

      // Record load balancer request
      this.metrics.recordLoadBalancerRequest(
        options.serviceName,
        options.loadBalancer?.algorithm || 'round-robin'
      );

      // Make the service call with circuit breaker
      const result = await this.circuitBreaker.execute(
        options.serviceName,
        () => this.makeHttpCall<T>(instance, options, data),
      );

      // Record successful call
      const duration = (Date.now() - startTime) / 1000;
      this.metrics.recordServiceCall(options.serviceName, options.method || 'GET', 'success', duration);

      return result;
    } catch (error) {
      // Record failed call
      const duration = (Date.now() - startTime) / 1000;
      this.metrics.recordServiceCall(options.serviceName, options.method || 'GET', 'error', duration);
      
      this.logger.error(`Service call failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async makeHttpCall<T>(
    instance: ServiceInstance,
    options: ServiceCallOptions,
    data?: any,
  ): Promise<T> {
    const url = `${instance.protocol}://${instance.host}:${instance.port}${options.endpoint}`;
    
    const requestConfig = {
      method: options.method || 'GET',
      url,
      timeout: options.timeout || 5000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add authentication if enabled
    if (options.auth?.enabled && options.auth.token) {
      requestConfig.headers['Authorization'] = `Bearer ${options.auth.token}`;
    }

    // Add data for non-GET requests
    if (data && options.method !== 'GET') {
      (requestConfig as any).data = data;
    } else if (data && options.method === 'GET') {
      (requestConfig as any).params = data;
    }

    const response: AxiosResponse<T> = await axios(requestConfig);
    return response.data;
  }

  async getServiceInstances(serviceName: string): Promise<ServiceInstance[]> {
    return this.serviceDiscovery.discoverService(serviceName);
  }

  async getServiceHealth(serviceName: string): Promise<{
    total: number;
    healthy: number;
    unhealthy: number;
    healthPercentage: number;
  }> {
    const instances = await this.getServiceInstances(serviceName);
    const healthy = instances.filter(instance => instance.health === 'healthy');
    const total = instances.length;
    const healthPercentage = total > 0 ? (healthy.length / total) * 100 : 0;

    return {
      total,
      healthy: healthy.length,
      unhealthy: total - healthy.length,
      healthPercentage,
    };
  }

  async getMetrics(): Promise<any> {
    return this.metrics.getMetrics();
  }

  async getMetricsAsJson(): Promise<string> {
    return this.metrics.getMetricsAsJson();
  }
}