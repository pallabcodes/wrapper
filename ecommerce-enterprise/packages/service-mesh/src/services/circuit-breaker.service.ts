import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreakerOptions } from '../interfaces/circuit-breaker-options.interface';

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open',
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  nextAttemptTime?: Date;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitBreakerStats>();
  private readonly options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }

  async execute<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    const circuit = this.getOrCreateCircuit(serviceName);
    
    // Check if circuit is open and not ready for retry
    if (circuit.state === CircuitState.OPEN) {
      if (circuit.nextAttemptTime && new Date() < circuit.nextAttemptTime) {
        this.logger.warn(`Circuit breaker open for service: ${serviceName}`);
        if (fallback) {
          return fallback();
        }
        throw new Error(`Circuit breaker open for service: ${serviceName}`);
      }
      
      // Move to half-open state
      circuit.state = CircuitState.HALF_OPEN;
      this.logger.log(`Circuit breaker moved to half-open for service: ${serviceName}`);
    }

    try {
      const result = await operation();
      await this.onSuccess(serviceName);
      return result;
    } catch (error) {
      await this.onFailure(serviceName);
      throw error;
    }
  }

  private getOrCreateCircuit(serviceName: string): CircuitBreakerStats {
    if (!this.circuits.has(serviceName)) {
      this.circuits.set(serviceName, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        successCount: 0,
      });
    }
    
    return this.circuits.get(serviceName)!;
  }

  private async onSuccess(serviceName: string): Promise<void> {
    const circuit = this.circuits.get(serviceName)!;
    
    circuit.successCount++;
    circuit.lastSuccessTime = new Date();
    
    // Reset failure count on success
    circuit.failureCount = 0;
    
    // If in half-open state, move to closed
    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.state = CircuitState.CLOSED;
      this.logger.log(`Circuit breaker closed for service: ${serviceName}`);
    }
    
    // Clear next attempt time
    delete circuit.nextAttemptTime;
  }

  private async onFailure(serviceName: string): Promise<void> {
    const circuit = this.circuits.get(serviceName)!;
    
    circuit.failureCount++;
    circuit.lastFailureTime = new Date();
    
    // Check if we should open the circuit
    if (circuit.failureCount >= this.options.failureThreshold) {
      circuit.state = CircuitState.OPEN;
      circuit.nextAttemptTime = new Date(Date.now() + this.options.recoveryTimeout);
      
      this.logger.warn(
        `Circuit breaker opened for service: ${serviceName} after ${circuit.failureCount} failures`,
      );
    }
  }

  getCircuitState(serviceName: string): CircuitState {
    const circuit = this.circuits.get(serviceName);
    return circuit?.state || CircuitState.CLOSED;
  }

  getCircuitStats(serviceName: string): CircuitBreakerStats | null {
    return this.circuits.get(serviceName) || null;
  }

  getAllCircuitStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [serviceName, circuit] of this.circuits.entries()) {
      stats[serviceName] = { ...circuit };
    }
    return stats;
  }

  async resetCircuit(serviceName: string): Promise<void> {
    const circuit = this.circuits.get(serviceName);
    if (circuit) {
      circuit.state = CircuitState.CLOSED;
    circuit.failureCount = 0;
    circuit.successCount = 0;
    delete circuit.lastFailureTime;
    delete circuit.lastSuccessTime;
    delete circuit.nextAttemptTime;
      
      this.logger.log(`Circuit breaker reset for service: ${serviceName}`);
    }
  }

  async resetAllCircuits(): Promise<void> {
    for (const serviceName of this.circuits.keys()) {
      await this.resetCircuit(serviceName);
    }
  }

  async forceOpenCircuit(serviceName: string): Promise<void> {
    const circuit = this.getOrCreateCircuit(serviceName);
    circuit.state = CircuitState.OPEN;
    circuit.nextAttemptTime = new Date(Date.now() + this.options.recoveryTimeout);
    
    this.logger.log(`Circuit breaker force opened for service: ${serviceName}`);
  }

  async forceCloseCircuit(serviceName: string): Promise<void> {
    const circuit = this.getOrCreateCircuit(serviceName);
    circuit.state = CircuitState.CLOSED;
    circuit.failureCount = 0;
    delete circuit.nextAttemptTime;
    
    this.logger.log(`Circuit breaker force closed for service: ${serviceName}`);
  }

  async getHealthStatus(): Promise<{
    totalCircuits: number;
    openCircuits: number;
    halfOpenCircuits: number;
    closedCircuits: number;
  }> {
    let openCircuits = 0;
    let halfOpenCircuits = 0;
    let closedCircuits = 0;

    for (const circuit of this.circuits.values()) {
      switch (circuit.state) {
        case CircuitState.OPEN:
          openCircuits++;
          break;
        case CircuitState.HALF_OPEN:
          halfOpenCircuits++;
          break;
        case CircuitState.CLOSED:
          closedCircuits++;
          break;
      }
    }

    return {
      totalCircuits: this.circuits.size,
      openCircuits,
      halfOpenCircuits,
      closedCircuits,
    };
  }
}
