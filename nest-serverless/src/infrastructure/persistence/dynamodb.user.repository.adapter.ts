/**
 * Adapter: DynamoDB User Repository Implementation
 * 
 * Implements the Port (interface) defined in Domain layer
 * Handles persistence using DynamoDB
 * 
 * This is the "Adapter" in Hexagonal Architecture
 * 
 * Note: For demo, using in-memory storage. In production, replace with DynamoDB client
 */
import { Injectable } from '@nestjs/common';
import { User } from '@domain/entities/user.entity';
import { UserRepositoryPort } from '@domain/ports/user.repository.port';

@Injectable()
export class DynamoDBUserRepositoryAdapter implements UserRepositoryPort {
  // In-memory storage (for demo - replace with DynamoDB client)
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    // In production: await dynamoDB.get({ TableName: 'Users', Key: { id } }).promise();
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    // In production: await dynamoDB.query({ TableName: 'Users', IndexName: 'email-index', KeyConditionExpression: 'email = :email', ExpressionAttributeValues: { ':email': email } }).promise();
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findAll(): Promise<User[]> {
    // In production: await dynamoDB.scan({ TableName: 'Users' }).promise();
    return Array.from(this.users.values());
  }

  async save(user: User): Promise<User> {
    // In production: await dynamoDB.put({ TableName: 'Users', Item: user }).promise();
    this.users.set(user.id, user);
    return user;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    // In production: await dynamoDB.update({ TableName: 'Users', Key: { id }, UpdateExpression: 'SET ...', ReturnValues: 'ALL_NEW' }).promise();
    const existing = this.users.get(id);
    if (!existing) {
      throw new Error('User not found');
    }

    const updated = new User(
      existing.id,
      updates.email ?? existing.email,
      updates.name ?? existing.name,
      updates.passwordHash ?? existing.passwordHash,
      updates.isEmailVerified ?? existing.isEmailVerified,
      existing.createdAt,
      new Date(),
    );

    this.users.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    // In production: await dynamoDB.delete({ TableName: 'Users', Key: { id } }).promise();
    this.users.delete(id);
  }
}

