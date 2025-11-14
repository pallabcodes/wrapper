import { Module } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';

/**
 * Circuit Breaker Module
 * 
 * Provides circuit breaker service for protecting external service calls
 */
@Module({
  providers: [CircuitBreakerService],
  exports: [CircuitBreakerService],
})
export class CircuitBreakerModule {}

