/**
 * Domain Entity: Payment
 */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export class Payment {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly status: PaymentStatus,
    public readonly transactionId: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  /**
   * Business rule: Payment can be refunded only if completed
   */
  canRefund(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  /**
   * Domain method: Mark payment as completed
   */
  complete(): Payment {
    return new Payment(
      this.id,
      this.userId,
      this.amount,
      this.currency,
      PaymentStatus.COMPLETED,
      this.transactionId,
      this.createdAt,
      new Date(),
    );
  }
}

