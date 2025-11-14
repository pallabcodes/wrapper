import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Payment, PaymentStatus } from '../../database/models/payment.model';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectModel(Payment)
    private paymentModel: typeof Payment,
  ) {}

  async create(paymentData: {
    userId: number;
    amount: number;
    currency: string;
    status: PaymentStatus;
    transactionId?: string;
  }): Promise<Payment> {
    return this.paymentModel.create(paymentData as any);
  }

  async findByUserId(userId: number): Promise<Payment[]> {
    return this.paymentModel.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return this.paymentModel.findOne({ where: { transactionId } });
  }

  async updateStatus(id: number, status: PaymentStatus): Promise<[number]> {
    return this.paymentModel.update({ status }, { where: { id } });
  }
}

