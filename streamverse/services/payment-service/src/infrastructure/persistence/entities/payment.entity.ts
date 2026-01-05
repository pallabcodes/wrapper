import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
import { PaymentStatus, PaymentMethod } from '../../../domain/entities/payment.entity';

/**
 * Infrastructure Entity: Payment (Database Table)
 *
 * TypeORM entity representing the payments table
 * Maps to database schema with proper relationships
 */
@Entity('payments')
export class PaymentEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('integer')
  amount!: number; // Amount in cents

  @Column('varchar', { length: 3, default: 'USD' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  status!: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CARD
  })
  method!: PaymentMethod;

  @Column('text')
  description!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt?: Date;

  @Column('integer', { name: 'refunded_amount', nullable: true })
  refundedAmount?: number;

  @Column('varchar', { length: 3, name: 'refunded_currency', nullable: true })
  refundedCurrency?: string;

  @Column('varchar', { length: 255, name: 'stripe_payment_intent_id', nullable: true })
  stripePaymentIntentId?: string;

  @Column('varchar', { length: 255, name: 'stripe_refund_id', nullable: true })
  stripeRefundId?: string;

  @Column('text', { name: 'failure_reason', nullable: true })
  failureReason?: string;

  @VersionColumn()
  version!: number;
}
