import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ServiceDiscoveryService } from './services/service-discovery.service';
import { LoadBalancerService } from './services/load-balancer.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { HealthCheckService } from './services/health-check.service';
import { MeshGatewayService } from './services/mesh-gateway.service';
import { ServiceRegistry } from './utils/service-registry';
import { HealthMonitor } from './utils/health-monitor';
import { MeshMetrics } from './utils/mesh-metrics';
import { ServiceMeshOptions } from './interfaces/service-mesh-options.interface';

@Module({})
export class ServiceMeshModule {
  static forRoot(options: ServiceMeshOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'SERVICE_MESH_OPTIONS',
        useValue: options,
      },
      ServiceDiscoveryService,
      LoadBalancerService,
      CircuitBreakerService,
      HealthCheckService,
      MeshGatewayService,
      ServiceRegistry,
      HealthMonitor,
      MeshMetrics,
    ];

    return {
      module: ServiceMeshModule,
      providers,
      exports: [
        ServiceDiscoveryService,
        LoadBalancerService,
        CircuitBreakerService,
        HealthCheckService,
        MeshGatewayService,
        ServiceRegistry,
        HealthMonitor,
        MeshMetrics,
      ],
      global: options.global || false,
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<ServiceMeshOptions> | ServiceMeshOptions;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'SERVICE_MESH_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      ServiceDiscoveryService,
      LoadBalancerService,
      CircuitBreakerService,
      HealthCheckService,
      MeshGatewayService,
      ServiceRegistry,
      HealthMonitor,
      MeshMetrics,
    ];

    return {
      module: ServiceMeshModule,
      providers,
      exports: [
        ServiceDiscoveryService,
        LoadBalancerService,
        CircuitBreakerService,
        HealthCheckService,
        MeshGatewayService,
        ServiceRegistry,
        HealthMonitor,
        MeshMetrics,
      ],
      global: false,
    };
  }
}
