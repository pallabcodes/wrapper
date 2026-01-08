import { Email } from '../value-objects/email.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Domain Entity: Notification
 *
 * Core business object representing a notification to be sent
 * Contains all business rules and behaviors for notification processing
 */
export class Notification {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly type: NotificationType,
    private readonly recipient: Email | PhoneNumber | string, // string for push tokens
    private readonly subject: string,
    private readonly content: string,
    private readonly priority: NotificationPriority,
    private status: NotificationStatus,
    private readonly metadata: Record<string, any>,
    private readonly idempotencyKey: string | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private sentAt?: Date,
    private deliveredAt?: Date,
    private failedAt?: Date,
    private failureReason?: string,
    private readonly version: number = 1
  ) { }

  static create(
    id: string,
    userId: string,
    type: NotificationType,
    recipient: Email | PhoneNumber | string,
    subject: string,
    content: string,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    metadata: Record<string, any> = {},
    idempotencyKey?: string,
  ): Notification {
    const now = new Date();
    return new Notification(
      id,
      userId,
      type,
      recipient,
      subject,
      content,
      priority,
      NotificationStatus.PENDING,
      metadata,
      idempotencyKey,
      now,
      now,
      undefined,
      undefined,
      undefined,
      undefined,
      1
    );
  }

  static fromPersistence(data: {
    id: string;
    userId: string;
    type: NotificationType;
    recipient: string;
    subject: string;
    content: string;
    priority: NotificationPriority;
    status: NotificationStatus;
    metadata: Record<string, any>;
    idempotencyKey?: string;
    createdAt: Date;
    updatedAt: Date;
    sentAt?: Date;
    deliveredAt?: Date;
    failedAt?: Date;
    failureReason?: string;
    version: number;
  }): Notification {
    // Parse recipient based on type
    let parsedRecipient: Email | PhoneNumber | string;
    if (data.type === NotificationType.EMAIL) {
      parsedRecipient = Email.fromString(data.recipient);
    } else if (data.type === NotificationType.SMS) {
      parsedRecipient = PhoneNumber.fromString(data.recipient);
    } else {
      parsedRecipient = data.recipient;
    }

    return new Notification(
      data.id,
      data.userId,
      data.type,
      parsedRecipient,
      data.subject,
      data.content,
      data.priority,
      data.status,
      data.metadata,
      data.idempotencyKey,
      data.createdAt,
      data.updatedAt,
      data.sentAt,
      data.deliveredAt,
      data.failedAt,
      data.failureReason,
      data.version
    );
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getType(): NotificationType {
    return this.type;
  }

  getRecipient(): Email | PhoneNumber | string {
    return this.recipient;
  }

  getRecipientValue(): string {
    if (this.recipient instanceof Email || this.recipient instanceof PhoneNumber) {
      return this.recipient.getValue();
    }
    return this.recipient;
  }

  getSubject(): string {
    return this.subject;
  }

  getContent(): string {
    return this.content;
  }

  getPriority(): NotificationPriority {
    return this.priority;
  }

  getStatus(): NotificationStatus {
    return this.status;
  }

  getMetadata(): Record<string, any> {
    return { ...this.metadata };
  }

  getIdempotencyKey(): string | undefined {
    return this.idempotencyKey;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getSentAt(): Date | undefined {
    return this.sentAt;
  }

  getDeliveredAt(): Date | undefined {
    return this.deliveredAt;
  }

  getFailedAt(): Date | undefined {
    return this.failedAt;
  }

  getFailureReason(): string | undefined {
    return this.failureReason;
  }

  getVersion(): number {
    return this.version;
  }

  // Business Rules
  canBeSent(): boolean {
    return this.status === NotificationStatus.PENDING;
  }

  canBeCancelled(): boolean {
    return this.status === NotificationStatus.PENDING;
  }

  isSent(): boolean {
    return this.status === NotificationStatus.SENT ||
      this.status === NotificationStatus.DELIVERED;
  }

  isFailed(): boolean {
    return this.status === NotificationStatus.FAILED;
  }

  isHighPriority(): boolean {
    return this.priority === NotificationPriority.HIGH ||
      this.priority === NotificationPriority.URGENT;
  }

  // Business Methods
  markAsSent(): void {
    if (!this.canBeSent()) {
      throw new Error('Notification cannot be marked as sent in its current state');
    }

    this.status = NotificationStatus.SENT;
    this.sentAt = new Date();
    this.updatedAt = new Date();
  }

  markAsDelivered(): void {
    if (this.status !== NotificationStatus.SENT) {
      throw new Error('Only sent notifications can be marked as delivered');
    }

    this.status = NotificationStatus.DELIVERED;
    this.deliveredAt = new Date();
    this.updatedAt = new Date();
  }

  markAsFailed(reason?: string): void {
    this.status = NotificationStatus.FAILED;
    this.failedAt = new Date();
    this.failureReason = reason;
    this.updatedAt = new Date();
  }

  markAsCancelled(): void {
    if (!this.canBeCancelled()) {
      throw new Error('Notification cannot be cancelled in its current state');
    }

    this.status = NotificationStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  // Comparison
  equals(other: Notification): boolean {
    return this.id === other.id && this.version === other.version;
  }
}
