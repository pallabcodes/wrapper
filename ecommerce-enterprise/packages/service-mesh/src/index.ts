export * from './service-mesh.module';
export * from './services/service-discovery.service';
export * from './services/load-balancer.service';
export * from './services/circuit-breaker.service';
export * from './services/health-check.service';
export * from './decorators/retry.decorator';
export * from './decorators/timeout.decorator';
export * from './interfaces/service-mesh-options.interface';
export * from './interfaces/load-balancer-options.interface';
export * from './utils/service-registry';
export * from './utils/health-monitor';
export * from './utils/mesh-metrics';
export * from './gateway/mesh-gateway.controller';

// Export specific classes to avoid conflicts
export { MeshGatewayService } from './services/mesh-gateway.service';
export { ServiceCall, ServiceCallOptions as ServiceCallDecoratorOptions } from './decorators/service-call.decorator';
export { CircuitBreaker, CircuitBreakerOptions as CircuitBreakerDecoratorOptions } from './decorators/circuit-breaker.decorator';
export { CircuitBreakerOptions } from './interfaces/circuit-breaker-options.interface';
