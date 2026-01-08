import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus, SubscriptionInterval } from '../../domain/entities/payment.entity';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '../../domain/ports/subscription-repository.port';
import { SubscriptionEntity } from './entities/subscription.entity';

/**
 * Infrastructure: PostgreSQL Subscription Repository
 *
 * Implements ISubscriptionRepository using TypeORM and PostgreSQL
 * Handles subscription data persistence and retrieval
 */
@Injectable()
export class PostgresSubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
  ) { }

  async save(subscription: Subscription): Promise<void> {
    const subscriptionEntity = this.toEntity(subscription);
    await this.subscriptionRepository.save(subscriptionEntity);
  }

  async findById(id: string): Promise<Subscription | null> {
    const entity = await this.subscriptionRepository.findOne({
      where: { id }
    });

    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    const entity = await this.subscriptionRepository.findOne({
      where: { userId }
    });

    return entity ? this.toDomain(entity) : null;
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const entity = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId }
    });

    return entity ? this.toDomain(entity) : null;
  }

  async update(subscription: Subscription): Promise<void> {
    const subscriptionEntity = this.toEntity(subscription);
    await this.subscriptionRepository.save(subscriptionEntity);
  }

  async delete(id: string): Promise<void> {
    await this.subscriptionRepository.update(id, {
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async findByStatus(status: SubscriptionStatus): Promise<Subscription[]> {
    const entities = await this.subscriptionRepository.find({
      where: { status }
    });

    return entities.map(entity => this.toDomain(entity));
  }

  async findExpiringSoon(daysThreshold: number): Promise<Subscription[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const entities = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.status IN (:...statuses)', {
        statuses: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING]
      })
      .andWhere('subscription.current_period_end <= :thresholdDate', {
        thresholdDate
      })
      .getMany();

    return entities.map(entity => this.toDomain(entity));
  }

  async findByInterval(interval: SubscriptionInterval): Promise<Subscription[]> {
    const entities = await this.subscriptionRepository.find({
      where: { interval }
    });

    return entities.map(entity => this.toDomain(entity));
  }

  async count(): Promise<number> {
    return await this.subscriptionRepository.count();
  }

  async countByStatus(status: SubscriptionStatus): Promise<number> {
    return await this.subscriptionRepository.count({
      where: { status }
    });
  }

  private toEntity(subscription: Subscription): SubscriptionEntity {
    const entity = new SubscriptionEntity();
    entity.id = subscription.getId();
    entity.userId = subscription.getUserId();
    entity.userEmail = subscription.getUserEmail();
    entity.status = subscription.getStatus();
    entity.interval = subscription.getInterval();
    entity.amount = subscription.getAmount().getAmountInCents();
    entity.currency = subscription.getAmount().getCurrency();
    entity.description = subscription.getDescription();
    entity.currentPeriodStart = subscription.getCurrentPeriodStart();
    entity.currentPeriodEnd = subscription.getCurrentPeriodEnd();
    entity.cancelAtPeriodEnd = subscription.getCancelAtPeriodEnd();
    entity.canceledAt = subscription.getCanceledAt();
    entity.stripeSubscriptionId = subscription.getStripeSubscriptionId();
    entity.stripeCustomerId = subscription.getStripeCustomerId();
    entity.stripePriceId = subscription.getStripePriceId();
    entity.createdAt = subscription.getCreatedAt();
    entity.updatedAt = subscription.getUpdatedAt();
    entity.version = subscription.getVersion();

    return entity;
  }

  private toDomain(entity: SubscriptionEntity): Subscription {
    return Subscription.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      userEmail: entity.userEmail,
      status: entity.status,
      interval: entity.interval,
      amount: entity.amount,
      currency: entity.currency,
      description: entity.description,
      currentPeriodStart: entity.currentPeriodStart,
      currentPeriodEnd: entity.currentPeriodEnd,
      cancelAtPeriodEnd: entity.cancelAtPeriodEnd,
      canceledAt: entity.canceledAt,
      stripeSubscriptionId: entity.stripeSubscriptionId,
      stripeCustomerId: entity.stripeCustomerId,
      stripePriceId: entity.stripePriceId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      version: entity.version,
    });
  }
}
