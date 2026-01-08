import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * Reconciliation Status
 */
export enum ReconciliationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL', // Some discrepancies found
}

/**
 * Discrepancy Type
 */
export enum DiscrepancyType {
  AMOUNT_MISMATCH = 'AMOUNT_MISMATCH',
  STATUS_MISMATCH = 'STATUS_MISMATCH',
  MISSING_IN_PSP = 'MISSING_IN_PSP',
  MISSING_IN_LOCAL = 'MISSING_IN_LOCAL',
  CURRENCY_MISMATCH = 'CURRENCY_MISMATCH',
  REFUND_MISMATCH = 'REFUND_MISMATCH',
}

/**
 * Reconciliation Record Entity
 * Tracks each reconciliation run and its results
 */
@Entity('reconciliation_records')
@Index(['status', 'createdAt'])
@Index(['provider', 'createdAt'])
export class ReconciliationRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  provider: string; // 'stripe' | 'razorpay'

  @Column({ type: 'enum', enum: ReconciliationStatus, default: ReconciliationStatus.PENDING })
  status: ReconciliationStatus;

  @Column({ type: 'date' })
  reconciliationDate: Date; // The date being reconciled

  @Column({ type: 'int', default: 0 })
  totalTransactions: number;

  @Column({ type: 'int', default: 0 })
  matchedTransactions: number;

  @Column({ type: 'int', default: 0 })
  discrepancyCount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmountReconciled: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discrepancyAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Discrepancy Entity
 * Individual discrepancy found during reconciliation
 */
@Entity('reconciliation_discrepancies')
@Index(['recordId', 'type'])
@Index(['paymentId'])
export class DiscrepancyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  recordId: string; // Reference to ReconciliationRecordEntity

  @Column({ type: 'uuid', nullable: true })
  paymentId: string; // Local payment ID

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalId: string; // PSP transaction ID

  @Column({ type: 'enum', enum: DiscrepancyType })
  type: DiscrepancyType;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @Column({ type: 'jsonb' })
  localData: Record<string, any>; // Our record

  @Column({ type: 'jsonb' })
  pspData: Record<string, any>; // PSP record

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amountDifference: number;

  @Column({ type: 'boolean', default: false })
  resolved: boolean;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
