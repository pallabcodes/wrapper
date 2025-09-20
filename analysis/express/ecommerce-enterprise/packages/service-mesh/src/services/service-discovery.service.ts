import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceMeshOptions, ServiceInstance } from '../interfaces/service-mesh-options.interface';
import { ServiceRegistry } from '../utils/service-registry';
import { HealthMonitor } from '../utils/health-monitor';
import * as Consul from 'consul';
import { Etcd3 } from 'etcd3';
import IORedis from 'ioredis';

@Injectable()
export class ServiceDiscoveryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServiceDiscoveryService.name);
  private consul?: Consul.Consul;
  private etcd?: Etcd3;
  private redis?: IORedis;
  private discoveryType: string;
  private serviceId: string;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(
    @Inject('SERVICE_MESH_OPTIONS') private readonly options: ServiceMeshOptions,
    private readonly serviceRegistry: ServiceRegistry,
    private readonly healthMonitor: HealthMonitor,
  ) {
    this.discoveryType = options.discovery?.type || 'static';
    this.serviceId = `${options.serviceName}-${Date.now()}`;
  }

  async onModuleInit() {
    await this.initializeDiscovery();
    await this.registerService();
    this.startHealthCheck();
  }

  async onModuleDestroy() {
    await this.deregisterService();
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    await this.disconnect();
  }

  private async initializeDiscovery() {
    switch (this.discoveryType) {
      case 'consul':
        await this.initializeConsul();
        break;
      case 'etcd':
        await this.initializeEtcd();
        break;
      case 'redis':
        await this.initializeRedis();
        break;
      case 'static':
        await this.initializeStatic();
        break;
      default:
        throw new Error(`Unsupported discovery type: ${this.discoveryType}`);
    }
  }

  private async initializeConsul() {
    const consulOptions = this.options.discovery?.consul;
    if (!consulOptions) {
      throw new Error('Consul options not provided');
    }
    this.consul = new Consul({
      host: consulOptions.host,
      port: consulOptions.port,
      token: consulOptions.token,
    });

    this.logger.log('Consul discovery initialized');
  }

  private async initializeEtcd() {
    const etcdOptions = this.options.discovery?.etcd;
    if (!etcdOptions) {
      throw new Error("Etcd options not provided");
    }
    this.etcd = new Etcd3({
      hosts: etcdOptions.hosts,
      auth: etcdOptions.auth,
    });

    this.logger.log('Etcd discovery initialized');
  }

  private async initializeRedis() {
    const redisOptions = this.options.discovery?.redis;
    if (!redisOptions) {
      throw new Error("Redis options not provided");
    }
    this.redis = new IORedis({
      host: redisOptions.host,
      port: redisOptions.port,
      password: redisOptions.password,
    });

    this.logger.log('Redis discovery initialized');
  }

  private async initializeStatic() {
    const staticOptions = this.options.discovery?.static;
    if (!staticOptions) {
      throw new Error("Static options not provided");
    }
    for (const [serviceName, instances] of Object.entries(staticOptions.services)) {
      await this.serviceRegistry.registerService(serviceName, instances);
    }

    this.logger.log('Static discovery initialized');
  }

  private async registerService() {
    const serviceInstance: ServiceInstance = {
      id: this.serviceId,
      name: this.options.serviceName,
      host: this.options.serviceHost || 'localhost',
      port: this.options.servicePort,
      protocol: 'http',
      health: 'healthy',
      lastSeen: new Date(),
      metadata: {
        version: '1.0.0',
        environment: process.env['NODE_ENV'] || 'development',
      },
    };

    switch (this.discoveryType) {
      case 'consul':
        await this.registerWithConsul(serviceInstance);
        break;
      case 'etcd':
        await this.registerWithEtcd(serviceInstance);
        break;
      case 'redis':
        await this.registerWithRedis(serviceInstance);
        break;
    }

    await this.serviceRegistry.registerService(this.options.serviceName, [serviceInstance]);
    this.logger.log(`Service registered: ${this.options.serviceName}`);
  }

  private async registerWithConsul(instance: ServiceInstance) {
    const consulOptions = this.options.discovery?.consul;
    if (!consulOptions) {
      throw new Error("Consul options not provided");
    }
    
    await this.consul.agent.service.register({
      id: instance.id,
      name: instance.name,
      address: instance.host,
      port: instance.port,
      check: {
        http: `http://${instance.host}:${instance.port}/health`,
        interval: '10s',
        timeout: '5s',
      },
      tags: instance.tags || [],
      meta: instance.metadata || {},
    });
  }

  private async registerWithEtcd(instance: ServiceInstance) {
    if (!this.etcd) {
      throw new Error("Etcd client not initialized");
    }
    const key = `/services/${instance.name}/${instance.id}`;
    const value = JSON.stringify(instance);
    
    await this.etcd.put(key).value(value);
    
    // Set TTL for automatic cleanup
    await this.etcd.lease(30).put(key).value(value);
  }

  private async registerWithRedis(instance: ServiceInstance) {
    if (!this.redis) {
      throw new Error("Redis client not initialized");
    }
    const key = `service:${instance.name}:${instance.id}`;
    const value = JSON.stringify(instance);
    
    await this.redis.setex(key, 30, value);
  }

  private async deregisterService() {
    switch (this.discoveryType) {
      case 'consul':
        await this.deregisterFromConsul();
        break;
      case 'etcd':
        await this.deregisterFromEtcd();
        break;
      case 'redis':
        await this.deregisterFromRedis();
        break;
    }

    await this.serviceRegistry.deregisterService(this.options.serviceName, this.serviceId);
    this.logger.log(`Service deregistered: ${this.options.serviceName}`);
  }

  private async deregisterFromConsul() {
    if (!this.consul) {
      throw new Error("Consul client not initialized");
    }
    await this.consul.agent.service.deregister(this.serviceId);
  }

  private async deregisterFromEtcd() {
    if (!this.etcd) {
      throw new Error("Etcd client not initialized");
    }
    const key = `/services/${this.options.serviceName}/${this.serviceId}`;
    await this.etcd.delete().key(key).exec();
  }

  private async deregisterFromRedis() {
    if (!this.redis) {
      throw new Error("Redis client not initialized");
    }
    const key = `service:${this.options.serviceName}:${this.serviceId}`;
    await this.redis.del(key);
  }

  private startHealthCheck() {
    if (this.options.loadBalancer?.healthCheck?.enabled) {
      const interval = this.options.loadBalancer.healthCheck.interval || 10000;
      
      this.healthCheckInterval = setInterval(async () => {
        await this.performHealthCheck();
      }, interval);
    }
  }

  private async performHealthCheck() {
    try {
      const instances = await this.serviceRegistry.getServiceInstances(this.options.serviceName);
      
      for (const instance of instances) {
        const isHealthy = await this.healthMonitor.checkHealth(instance);
        
        if (isHealthy !== (instance.health === 'healthy')) {
          instance.health = isHealthy ? 'healthy' : 'unhealthy';
          instance.lastSeen = new Date();
          
          await this.serviceRegistry.updateServiceInstance(instance);
          this.logger.log(`Health check updated for ${instance.id}: ${instance.health}`);
        }
      }
    } catch (error) {
      this.logger.error('Health check failed:', error);
    }
  }

  async discoverService(serviceName: string): Promise<ServiceInstance[]> {
    switch (this.discoveryType) {
      case 'consul':
        return this.discoverFromConsul(serviceName);
      case 'etcd':
        return this.discoverFromEtcd(serviceName);
      case 'redis':
        return this.discoverFromRedis(serviceName);
      case 'static':
        return this.serviceRegistry.getServiceInstances(serviceName);
      default:
        return [];
    }
  }

  private async discoverFromConsul(serviceName: string): Promise<ServiceInstance[]> {
    try {
      if (!this.consul) {
        throw new Error("Consul client not initialized");
      }
      const services = await this.consul.health.service(serviceName);
      
      return services[0].Service.map((service: any) => ({
        id: service.ID,
        name: service.Service,
        host: service.Address,
        port: service.Port,
        protocol: 'http',
        health: 'healthy',
        lastSeen: new Date(),
        metadata: service.Meta || {},
        tags: service.Tags || [],
      }));
    } catch (error) {
      this.logger.error(`Failed to discover service ${serviceName}:`, error);
      return [];
    }
  }

  private async discoverFromEtcd(serviceName: string): Promise<ServiceInstance[]> {
    try {
      if (!this.etcd) {
        throw new Error("Etcd client not initialized");
      }
      const key = `/services/${serviceName}`;
      const instances = await this.etcd.getAll().prefix(key).strings();
      
      return Object.values(instances).map((data: string) => {
        const instance = JSON.parse(data) as ServiceInstance;
        instance.lastSeen = new Date();
        return instance;
      });
    } catch (error) {
      this.logger.error(`Failed to discover service ${serviceName}:`, error);
      return [];
    }
  }

  private async discoverFromRedis(serviceName: string): Promise<ServiceInstance[]> {
    try {
      if (!this.redis) {
        throw new Error("Redis client not initialized");
      }
      const pattern = `service:${serviceName}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) {
        return [];
      }
      
      const instances = await this.redis.mget(...keys);
      
      return instances
        .filter((data: string | null) => data !== null)
        .map((data: string) => {
          const instance = JSON.parse(data) as ServiceInstance;
          instance.lastSeen = new Date();
          return instance;
        });
    } catch (error) {
      this.logger.error(`Failed to discover service ${serviceName}:`, error);
      return [];
    }
  }

  private async disconnect() {
    if (this.consul) {
      // Consul doesn't need explicit disconnect
    }
    
    if (this.etcd) {
      await this.etcd.close();
    }
    
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}
