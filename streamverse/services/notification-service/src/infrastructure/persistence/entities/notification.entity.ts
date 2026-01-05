import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, Index, Unique } from 'typeorm';
import { NotificationType, NotificationStatus, NotificationPriority } from '../../../domain/entities/notification.entity';

/**
 * Infrastructure Entity: Notification (Database Table)
 *
 * TypeORM entity representing the notifications table
 * Maps to database schema with proper relationships
 */
@Entity('notifications')
// IDEMPOTENCY: Prevent duplicate email verifications within same hour
@Unique('unique_email_verification_hour', ['recipient', 'type'])
export class NotificationEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id', nullable: true })
  userId?: string;

  @Column({
    type: 'enum',
    enum: NotificationType
  })
  type!: NotificationType;

  @Column('varchar', { length: 500 })
  recipient!: string; // Email, phone, or push token

  @Column('varchar', { length: 500, nullable: true })
  subject?: string;

  @Column('text')
  content!: string;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL
  })
  priority!: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING
  })
  status!: NotificationStatus;

  @Column('jsonb', { default: {} })
  metadata!: Record<string, any>;

  // IDEMPOTENCY: Prevent duplicate processing
  @Column('varchar', { name: 'idempotency_key', length: 255, nullable: true })
  idempotencyKey?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'sent_at', nullable: true })
  sentAt?: Date;

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'failed_at', nullable: true })
  failedAt?: Date;

  @Column('text', { name: 'failure_reason', nullable: true })
  failureReason?: string;

  @VersionColumn()
  version!: number;
}
