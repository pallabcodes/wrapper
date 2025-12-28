import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ServiceInstance {
    id: string;
    name: string;
    host: string;
    port: number;
    healthEndpoint: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck: Date;
    metadata?: Record<string, string>;
}

/**
 * Service Registry - Local service discovery for microservices
 * 
 * In Kubernetes: This is replaced by K8s Service DNS
 * In AWS: This is replaced by ECS Service Discovery or Cloud Map
 * 
 * This provides:
 * 1. Service registration on startup
 * 2. Health check polling
 * 3. Load balancing (round-robin)
 * 4. Automatic deregistration on crash
 */
@Injectable()
export class ServiceRegistry implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger('ServiceRegistry');
    private readonly services = new Map<string, ServiceInstance[]>();
    private readonly healthCheckInterval: NodeJS.Timer | null = null;
    private readonly selfInstance: ServiceInstance;
    private roundRobinIndex = new Map<string, number>();

    constructor(private readonly config: ConfigService) {
        this.selfInstance = {
            id: `${config.get('SERVICE_NAME', 'unknown')}-${Date.now()}`,
            name: config.get('SERVICE_NAME', 'unknown'),
            host: config.get('HOST', 'localhost'),
            port: parseInt(config.get('PORT', '3000'), 10),
            healthEndpoint: '/health',
            status: 'unknown',
            lastCheck: new Date(),
        };
    }

    async onModuleInit() {
        // Register self
        await this.register(this.selfInstance);

        // Start health check polling (every 30 seconds)
        // In K8s, this is handled by kubelet
        this.startHealthChecks();

        this.logger.log(`Service ${this.selfInstance.name} registered with ID: ${this.selfInstance.id}`);
    }

    async onModuleDestroy() {
        // Deregister self on graceful shutdown
        await this.deregister(this.selfInstance.id);
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval as unknown as NodeJS.Timeout);
        }
        this.logger.log(`Service ${this.selfInstance.id} deregistered`);
    }

    async register(instance: ServiceInstance): Promise<void> {
        const instances = this.services.get(instance.name) || [];
        const existing = instances.findIndex(i => i.id === instance.id);

        if (existing >= 0) {
            instances[existing] = instance;
        } else {
            instances.push(instance);
        }

        this.services.set(instance.name, instances);
    }

    async deregister(instanceId: string): Promise<void> {
        for (const [name, instances] of this.services.entries()) {
            const filtered = instances.filter(i => i.id !== instanceId);
            if (filtered.length !== instances.length) {
                this.services.set(name, filtered);
            }
        }
    }

    // Get a healthy instance using round-robin load balancing
    getService(serviceName: string): ServiceInstance | null {
        const instances = this.services.get(serviceName)?.filter(i => i.status === 'healthy') || [];

        if (instances.length === 0) {
            return null;
        }

        // Round-robin selection
        let index = this.roundRobinIndex.get(serviceName) || 0;
        const instance = instances[index % instances.length];
        this.roundRobinIndex.set(serviceName, index + 1);

        return instance;
    }

    getAllServices(): Map<string, ServiceInstance[]> {
        return this.services;
    }

    getHealthyCount(serviceName: string): number {
        return this.services.get(serviceName)?.filter(i => i.status === 'healthy').length || 0;
    }

    private startHealthChecks() {
        setInterval(async () => {
            for (const [name, instances] of this.services.entries()) {
                for (const instance of instances) {
                    try {
                        const response = await fetch(
                            `http://${instance.host}:${instance.port}${instance.healthEndpoint}`,
                            { method: 'GET', signal: AbortSignal.timeout(5000) }
                        );

                        instance.status = response.ok ? 'healthy' : 'unhealthy';
                        instance.lastCheck = new Date();
                    } catch (error) {
                        instance.status = 'unhealthy';
                        instance.lastCheck = new Date();
                        this.logger.warn(`Health check failed for ${name}:${instance.id}`);
                    }
                }
            }
        }, 30000); // Every 30 seconds
    }
}

/**
 * Kubernetes Service Discovery
 * 
 * In K8s, service discovery is automatic via DNS:
 * - user-service.flashmart.svc.cluster.local
 * - payment-service.flashmart.svc.cluster.local
 * 
 * This class provides the K8s-specific configuration
 */
export class K8sServiceDiscovery {
    private readonly namespace: string;
    private readonly clusterDomain: string;

    constructor(namespace = 'flashmart', clusterDomain = 'cluster.local') {
        this.namespace = namespace;
        this.clusterDomain = clusterDomain;
    }

    getServiceUrl(serviceName: string, port: number): string {
        // Kubernetes DNS format: <service>.<namespace>.svc.<cluster-domain>
        return `http://${serviceName}.${this.namespace}.svc.${this.clusterDomain}:${port}`;
    }

    getHeadlessServiceUrl(serviceName: string): string {
        // For StatefulSets or when you need pod-specific addressing
        return `${serviceName}.${this.namespace}.svc.${this.clusterDomain}`;
    }

    // Get environment-aware service URL
    static getServiceEndpoint(serviceName: string, defaultPort: number): string {
        // Check for environment override first (for local dev)
        const envKey = `${serviceName.toUpperCase().replace(/-/g, '_')}_URL`;
        const envUrl = process.env[envKey];

        if (envUrl) {
            return envUrl;
        }

        // Check if running in Kubernetes
        if (process.env.KUBERNETES_SERVICE_HOST) {
            const namespace = process.env.POD_NAMESPACE || 'flashmart';
            return `http://${serviceName}.${namespace}.svc.cluster.local:${defaultPort}`;
        }

        // Fallback to localhost for development
        return `http://localhost:${defaultPort}`;
    }
}
