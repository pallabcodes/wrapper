import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
import { SubscriptionStatus, SubscriptionInterval } from '../../../domain/entities/payment.entity';

/**
 * Infrastructure Entity: Subscription (Database Table)
 *
 * TypeORM entity representing the subscriptions table
 * Maps to database schema with proper relationships
 */
@Entity('subscriptions')
export class SubscriptionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.INCOMPLETE
  })
  status!: SubscriptionStatus;

  @Column({
    type: 'enum',
    enum: SubscriptionInterval,
    default: SubscriptionInterval.MONTH
  })
  interval!: SubscriptionInterval;

  @Column('integer')
  amount!: number; // Amount in cents

  @Column('varchar', { length: 3, default: 'USD' })
  currency!: string;

  @Column('text')
  description!: string;

  @Column({ name: 'current_period_start', type: 'timestamp' })
  currentPeriodStart!: Date;

  @Column({ name: 'current_period_end', type: 'timestamp' })
  currentPeriodEnd!: Date;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd!: boolean;

  @Column({ name: 'canceled_at', nullable: true, type: 'timestamp' })
  canceledAt?: Date;

  @Column('varchar', { length: 255, name: 'stripe_subscription_id', nullable: true })
  stripeSubscriptionId?: string;

  @Column('varchar', { length: 255, name: 'stripe_customer_id', nullable: true })
  stripeCustomerId?: string;

  @Column('varchar', { length: 255, name: 'stripe_price_id', nullable: true })
  stripePriceId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @VersionColumn()
  version!: number;
}
