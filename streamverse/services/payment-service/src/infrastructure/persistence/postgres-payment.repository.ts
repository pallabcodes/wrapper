import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../domain/entities/payment.entity';
import { PaymentEntity } from './entities/payment.entity';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY
} from '../../domain/ports/payment-repository.port';

/**
 * Infrastructure: PostgreSQL Payment Repository
 *
 * Implements IPaymentRepository using TypeORM and PostgreSQL
 */
@Injectable()
export class PostgresPaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) { }

  async save(payment: Payment): Promise<void> {
    const entity = this.toEntity(payment);
    await this.paymentRepository.save(entity);
  }

  async findById(id: string): Promise<Payment | null> {
    const entity = await this.paymentRepository.findOne({
      where: { id }
    });

    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    const entities = await this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });

    return entities.map(entity => this.toDomain(entity));
  }

  async findByStripePaymentIntentId(stripePaymentIntentId: string): Promise<Payment | null> {
    const entity = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId }
    });

    return entity ? this.toDomain(entity) : null;
  }

  async update(payment: Payment): Promise<void> {
    const entity = this.toEntity(payment);
    await this.paymentRepository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.paymentRepository.softDelete(id);
  }

  private toEntity(payment: Payment): PaymentEntity {
    const entity = new PaymentEntity();
    entity.id = payment.getId();
    entity.userId = payment.getUserId();
    entity.userEmail = payment.getUserEmail();
    entity.amount = payment.getAmount().getAmountInCents();
    entity.currency = payment.getAmount().getCurrency();
    entity.status = payment.getStatus();
    entity.method = payment.getMethod();
    entity.description = payment.getDescription();
    entity.createdAt = payment.getCreatedAt();
    entity.updatedAt = payment.getUpdatedAt();
    entity.completedAt = payment.getCompletedAt();
    entity.version = payment.getVersion();

    const refundedAmount = payment.getRefundedAmount();
    if (refundedAmount) {
      entity.refundedAmount = refundedAmount.getAmountInCents();
      entity.refundedCurrency = refundedAmount.getCurrency();
    }

    entity.stripePaymentIntentId = payment.getStripePaymentIntentId();
    entity.stripeRefundId = payment.getStripeRefundId();
    entity.failureReason = payment.getFailureReason();

    return entity;
  }

  private toDomain(entity: PaymentEntity): Payment {
    return Payment.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      userEmail: entity.userEmail,
      amount: entity.amount,
      currency: entity.currency,
      status: entity.status,
      method: entity.method,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      completedAt: entity.completedAt,
      refundedAmount: entity.refundedAmount,
      refundedCurrency: entity.refundedCurrency,
      stripePaymentIntentId: entity.stripePaymentIntentId,
      stripeRefundId: entity.stripeRefundId,
      failureReason: entity.failureReason,
      version: entity.version,
    });
  }
}
