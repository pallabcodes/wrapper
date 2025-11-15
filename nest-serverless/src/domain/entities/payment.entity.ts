/**
 * Domain Entity: Payment
 * 
 * Pure business logic - no dependencies on frameworks or infrastructure
 * Contains business rules and domain methods
 */
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export class Payment {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly status: PaymentStatus,
    public readonly description: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  /**
   * Business Rule: Payment can be processed only if status is pending
   */
  canProcess(): boolean {
    return this.status === 'pending';
  }

  /**
   * Business Rule: Mark payment as processing
   */
  markAsProcessing(): Payment {
    return new Payment(
      this.id,
      this.userId,
      this.amount,
      this.currency,
      'processing',
      this.description,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Business Rule: Mark payment as completed
   */
  markAsCompleted(): Payment {
    return new Payment(
      this.id,
      this.userId,
      this.amount,
      this.currency,
      'completed',
      this.description,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Business Rule: Mark payment as failed
   */
  markAsFailed(): Payment {
    return new Payment(
      this.id,
      this.userId,
      this.amount,
      this.currency,
      'failed',
      this.description,
      this.createdAt,
      new Date(),
    );
  }
}

