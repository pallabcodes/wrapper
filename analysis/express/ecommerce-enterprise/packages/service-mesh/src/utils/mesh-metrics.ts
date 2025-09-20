import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MeshMetrics {
  private readonly logger = new Logger(MeshMetrics.name);
  private metrics = {
    serviceCalls: new Map<string, { success: number; error: number; total: number }>(),
    loadBalancerRequests: new Map<string, number>(),
    circuitBreakerStates: new Map<string, string>(),
  };

  recordServiceCall(serviceName: string, method: string, status: 'success' | 'error', duration: number): void {
    const key = `${serviceName}:${method}`;
    const current = this.metrics.serviceCalls.get(key) || { success: 0, error: 0, total: 0 };
    
    if (status === 'success') {
      current.success++;
    } else {
      current.error++;
    }
    current.total++;
    
    this.metrics.serviceCalls.set(key, current);
  }

  recordLoadBalancerRequest(serviceName: string, algorithm: string): void {
    const key = `${serviceName}:${algorithm}`;
    const current = this.metrics.loadBalancerRequests.get(key) || 0;
    this.metrics.loadBalancerRequests.set(key, current + 1);
  }

  recordCircuitBreakerState(serviceName: string, state: 'closed' | 'open' | 'half-open'): void {
    this.metrics.circuitBreakerStates.set(serviceName, state);
  }

  getServiceCallMetrics(): Record<string, { success: number; error: number; total: number }> {
    const result: Record<string, { success: number; error: number; total: number }> = {};
    for (const [key, metrics] of this.metrics.serviceCalls.entries()) {
      result[key] = { ...metrics };
    }
    return result;
  }

  getLoadBalancerMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, count] of this.metrics.loadBalancerRequests.entries()) {
      result[key] = count;
    }
    return result;
  }

  getCircuitBreakerMetrics(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [serviceName, state] of this.metrics.circuitBreakerStates.entries()) {
      result[serviceName] = state;
    }
    return result;
  }

  getAllMetrics(): {
    serviceCalls: Record<string, { success: number; error: number; total: number }>;
    loadBalancerRequests: Record<string, number>;
    circuitBreakerStates: Record<string, string>;
  } {
    return {
      serviceCalls: this.getServiceCallMetrics(),
      loadBalancerRequests: this.getLoadBalancerMetrics(),
      circuitBreakerStates: this.getCircuitBreakerMetrics(),
    };
  }

  reset(): void {
    this.metrics.serviceCalls.clear();
    this.metrics.loadBalancerRequests.clear();
    this.metrics.circuitBreakerStates.clear();
    this.logger.log('Reset all metrics');
  }

  // Alias methods for compatibility
  getMetrics() {
    return this.getAllMetrics();
  }

  getMetricsAsJson(): string {
    return JSON.stringify(this.getAllMetrics(), null, 2);
  }
}