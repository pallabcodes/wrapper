import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationStatus } from '../../domain/entities/notification.entity';
import { NotificationEntity } from './entities/notification.entity';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY
} from '../../domain/ports/notification-repository.port';

/**
 * Infrastructure: PostgreSQL Notification Repository
 *
 * Implements INotificationRepository using TypeORM and PostgreSQL
 */
@Injectable()
export class PostgresNotificationRepository implements INotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  async save(notification: Notification): Promise<void> {
    const entity = this.toEntity(notification);
    await this.notificationRepository.save(entity);
  }

  async findById(id: string): Promise<Notification | null> {
    const entity = await this.notificationRepository.findOne({
      where: { id }
    });

    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string, limit: number = 50): Promise<Notification[]> {
    const entities = await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit
    });

    return entities.map(entity => this.toDomain(entity));
  }

  async findByType(type: NotificationType, limit: number = 50): Promise<Notification[]> {
    const entities = await this.notificationRepository.find({
      where: { type },
      order: { createdAt: 'DESC' },
      take: limit
    });

    return entities.map(entity => this.toDomain(entity));
  }

  async findByStatus(status: NotificationStatus, limit: number = 50): Promise<Notification[]> {
    const entities = await this.notificationRepository.find({
      where: { status },
      order: { createdAt: 'DESC' },
      take: limit
    });

    return entities.map(entity => this.toDomain(entity));
  }

  async update(notification: Notification): Promise<void> {
    const entity = this.toEntity(notification);
    await this.notificationRepository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.notificationRepository.softDelete(id);
  }

  async findByRecipientAndTypeWithinTimeframe(
    recipient: string,
    type: NotificationType,
    timeframeMs: number
  ): Promise<Notification[]> {
    const cutoffDate = new Date(Date.now() - timeframeMs);

    const entities = await this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.recipient = :recipient', { recipient })
      .andWhere('notification.type = :type', { type })
      .andWhere('notification.created_at >= :cutoffDate', { cutoffDate })
      .orderBy('notification.created_at', 'DESC')
      .getMany();

    return entities.map(entity => this.toDomain(entity));
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
  }> {
    const [total, pending, sent, delivered, failed] = await Promise.all([
      this.notificationRepository.count(),
      this.notificationRepository.count({ where: { status: NotificationStatus.PENDING } }),
      this.notificationRepository.count({ where: { status: NotificationStatus.SENT } }),
      this.notificationRepository.count({ where: { status: NotificationStatus.DELIVERED } }),
      this.notificationRepository.count({ where: { status: NotificationStatus.FAILED } })
    ]);

    return { total, pending, sent, delivered, failed };
  }

  private toEntity(notification: Notification): NotificationEntity {
    const entity = new NotificationEntity();
    entity.id = notification.getId();
    entity.userId = notification.getUserId();
    entity.type = notification.getType();
    entity.recipient = notification.getRecipientValue();
    entity.subject = notification.getSubject();
    entity.content = notification.getContent();
    entity.priority = notification.getPriority();
    entity.status = notification.getStatus();
    entity.metadata = notification.getMetadata();
    entity.createdAt = notification.getCreatedAt();
    entity.updatedAt = notification.getUpdatedAt();
    entity.sentAt = notification.getSentAt();
    entity.deliveredAt = notification.getDeliveredAt();
    entity.failedAt = notification.getFailedAt();
    entity.failureReason = notification.getFailureReason();
    entity.version = notification.getVersion();

    return entity;
  }

  private toDomain(entity: NotificationEntity): Notification {
    return Notification.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      type: entity.type,
      recipient: entity.recipient,
      subject: entity.subject,
      content: entity.content,
      priority: entity.priority,
      status: entity.status,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      sentAt: entity.sentAt,
      deliveredAt: entity.deliveredAt,
      failedAt: entity.failedAt,
      failureReason: entity.failureReason,
      version: entity.version,
    });
  }
}
