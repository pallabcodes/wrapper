import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like } from 'typeorm';
import { Payment, PaymentStatus, PaymentProvider } from '../entities/payment.entity';

export interface PaymentFilters {
  page: number;
  limit: number;
  status?: string;
  provider?: string;
}

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async create(paymentData: Partial<Payment>): Promise<Payment> {
    const payment = this.paymentRepository.create(paymentData);
    return this.paymentRepository.save(payment);
  }

  async findById(id: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({ where: { id } });
  }

  async findByUser(
    userId: string,
    tenantId: string,
    filters: PaymentFilters,
  ): Promise<{ payments: Payment[]; total: number }> {
    const { page, limit, status, provider } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (provider) {
      where.provider = provider;
    }

    const [payments, total] = await this.paymentRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { payments, total };
  }

  async update(id: string, updateData: Partial<Payment>): Promise<Payment> {
    await this.paymentRepository.update(id, updateData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.paymentRepository.delete(id);
  }

  async findByProviderPaymentId(providerPaymentId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({ 
      where: { providerPaymentId } 
    });
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    return this.paymentRepository.find({ 
      where: { status },
      order: { createdAt: 'ASC' },
    });
  }

  async findByTenant(tenantId: string, filters: PaymentFilters): Promise<{ payments: Payment[]; total: number }> {
    const { page, limit, status, provider } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (provider) {
      where.provider = provider;
    }

    const [payments, total] = await this.paymentRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { payments, total };
  }

  async getTotalAmountByTenant(tenantId: string): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .getRawOne();

    return parseInt(result.total) || 0;
  }

  async getPaymentStats(tenantId: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    completedPayments: number;
    failedPayments: number;
    pendingPayments: number;
  }> {
    const stats = await this.paymentRepository
      .createQueryBuilder('payment')
      .select([
        'COUNT(*) as totalPayments',
        'SUM(CASE WHEN payment.status = :completed THEN payment.amount ELSE 0 END) as totalAmount',
        'SUM(CASE WHEN payment.status = :completed THEN 1 ELSE 0 END) as completedPayments',
        'SUM(CASE WHEN payment.status = :failed THEN 1 ELSE 0 END) as failedPayments',
        'SUM(CASE WHEN payment.status = :pending THEN 1 ELSE 0 END) as pendingPayments',
      ])
      .where('payment.tenantId = :tenantId', { tenantId })
      .setParameters({
        completed: PaymentStatus.COMPLETED,
        failed: PaymentStatus.FAILED,
        pending: PaymentStatus.PENDING,
      })
      .getRawOne();

    return {
      totalPayments: parseInt(stats.totalPayments) || 0,
      totalAmount: parseInt(stats.totalAmount) || 0,
      completedPayments: parseInt(stats.completedPayments) || 0,
      failedPayments: parseInt(stats.failedPayments) || 0,
      pendingPayments: parseInt(stats.pendingPayments) || 0,
    };
  }
}
