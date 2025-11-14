import { Injectable } from '@nestjs/common';
import { CircuitBreakerService } from '../../../../common/circuit-breaker/circuit-breaker.service';

/**
 * Payment Gateway Service
 * 
 * Demonstrates Circuit Breaker pattern for external service calls
 */
@Injectable()
export class PaymentGatewayService {
  private readonly circuitBreaker: CircuitBreakerService;

  constructor() {
    // Configure circuit breaker for payment gateway
    this.circuitBreaker = new CircuitBreakerService();
  }

  /**
   * Process payment with circuit breaker protection
   */
  async processPayment(amount: number, cardToken: string): Promise<any> {
    return this.circuitBreaker.execute(
      async () => {
        // Simulate external payment API call
        if (Math.random() > 0.8) {
          throw new Error('Payment gateway unavailable');
        }
        return {
          transactionId: `txn_${Date.now()}`,
          amount,
          status: 'success',
        };
      },
      // Fallback: return cached response or default
      async () => {
        return {
          transactionId: 'fallback_txn',
          amount,
          status: 'pending',
          message: 'Payment queued due to service unavailability',
        };
      },
    );
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    return this.circuitBreaker.getMetrics();
  }
}

