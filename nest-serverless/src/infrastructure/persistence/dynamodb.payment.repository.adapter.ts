/**
 * Adapter: DynamoDB Payment Repository Implementation
 * 
 * Implements the Port (interface) defined in Domain layer
 * Handles persistence using DynamoDB
 */
import { Injectable } from '@nestjs/common';
import { Payment } from '@domain/entities/payment.entity';
import { PaymentRepositoryPort } from '@domain/ports/payment.repository.port';

@Injectable()
export class DynamoDBPaymentRepositoryAdapter implements PaymentRepositoryPort {
  // In-memory storage (for demo - replace with DynamoDB client)
  private payments: Map<string, Payment> = new Map();

  async findById(id: string): Promise<Payment | null> {
    // In production: await dynamoDB.get({ TableName: 'Payments', Key: { id } }).promise();
    return this.payments.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    // In production: await dynamoDB.query({ TableName: 'Payments', IndexName: 'userId-index', KeyConditionExpression: 'userId = :userId', ExpressionAttributeValues: { ':userId': userId } }).promise();
    return Array.from(this.payments.values()).filter(p => p.userId === userId);
  }

  async save(payment: Payment): Promise<Payment> {
    // In production: await dynamoDB.put({ TableName: 'Payments', Item: payment }).promise();
    this.payments.set(payment.id, payment);
    return payment;
  }

  async update(id: string, updates: Partial<Payment>): Promise<Payment> {
    // In production: await dynamoDB.update({ TableName: 'Payments', Key: { id }, UpdateExpression: 'SET ...', ReturnValues: 'ALL_NEW' }).promise();
    const existing = this.payments.get(id);
    if (!existing) {
      throw new Error('Payment not found');
    }

    const updated = new Payment(
      existing.id,
      updates.userId ?? existing.userId,
      updates.amount ?? existing.amount,
      updates.currency ?? existing.currency,
      updates.status ?? existing.status,
      updates.description ?? existing.description,
      existing.createdAt,
      new Date(),
    );

    this.payments.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: Payment['status']): Promise<Payment> {
    return this.update(id, { status });
  }
}

