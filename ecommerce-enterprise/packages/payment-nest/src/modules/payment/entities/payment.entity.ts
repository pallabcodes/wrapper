import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  BRAINTREE = 'braintree',
  PAYPAL = 'paypal',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
  CRYPTOCURRENCY = 'cryptocurrency',
}

@Entity('payments')
@Index(['userId', 'tenantId'])
@Index(['status', 'createdAt'])
@Index(['provider', 'providerPaymentId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ type: 'int' })
  amount: number = 0;

  @Column({ type: 'varchar', length: 3 })
  currency: string = '';

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus = PaymentStatus.PENDING;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
  })
  provider: PaymentProvider = PaymentProvider.STRIPE;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod = PaymentMethod.CARD;

  @Column({ type: 'text' })
  description: string = '';

  @Column({ type: 'varchar', length: 255 })
  customerEmail: string = '';

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerPaymentId?: string;

  @Column({ type: 'text', nullable: true })
  paymentUrl?: string;

  @Column({ type: 'int', default: 0 })
  refundAmount: number = 0;

  @Column({ type: 'text', nullable: true })
  refundReason?: string;

  @Column({ type: 'varchar', length: 255 })
  tenantId: string = '';

  @Column({ type: 'varchar', length: 255 })
  userId: string = '';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}
