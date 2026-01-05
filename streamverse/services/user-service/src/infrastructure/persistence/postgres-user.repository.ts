import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AuthProvider } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Username } from '../../domain/value-objects/username.vo';
import { PhoneNumber } from '../../domain/value-objects/phone-number.vo';
import { UserRole, UserStatus } from '../../domain/entities/user.entity';
import { IUserRepository, USER_REPOSITORY } from '../../domain/ports/user-repository.port';
import { UserEntity } from './entities/user.entity';

/**
 * Infrastructure: PostgreSQL User Repository
 *
 * Implements IUserRepository using TypeORM and PostgreSQL
 * Handles data persistence and retrieval
 */
@Injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) { }

  async save(user: User): Promise<void> {
    const userEntity = this.toEntity(user);
    await this.userRepository.save(userEntity);
  }

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { id }
    });

    return userEntity ? this.toDomain(userEntity) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { email: email.getValue() }
    });

    // returns a new User (from domain) instance thus all methods from it e.g. canLogin available
    return userEntity ? this.toDomain(userEntity) : null;
  }

  async findByUsername(username: Username): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { username: username.getValue() }
    });

    return userEntity ? this.toDomain(userEntity) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { googleId }
    });

    return userEntity ? this.toDomain(userEntity) : null;
  }

  async findByPhoneNumber(phoneNumber: PhoneNumber): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { phoneNumber: phoneNumber.getValue() }
    });

    return userEntity ? this.toDomain(userEntity) : null;
  }

  async update(user: User): Promise<void> {
    const userEntity = this.toEntity(user);
    await this.userRepository.save(userEntity);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.update(id, {
      status: UserStatus.DELETED,
      updatedAt: new Date()
    });
  }

  async emailExists(email: Email, excludeUserId?: string): Promise<boolean> {
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.email = :email', { email: email.getValue() })
      .andWhere('user.status != :deleted', { deleted: UserStatus.DELETED });

    if (excludeUserId) {
      query.andWhere('user.id != :excludeId', { excludeId: excludeUserId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  async usernameExists(username: Username, excludeUserId?: string): Promise<boolean> {
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.username = :username', { username: username.getValue() })
      .andWhere('user.status != :deleted', { deleted: UserStatus.DELETED });

    if (excludeUserId) {
      query.andWhere('user.id != :excludeId', { excludeId: excludeUserId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  async findByStatus(status: UserStatus): Promise<User[]> {
    const userEntities = await this.userRepository.find({
      where: { status }
    });

    return userEntities.map(entity => this.toDomain(entity));
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const userEntities = await this.userRepository.find({
      where: { role }
    });

    return userEntities.map(entity => this.toDomain(entity));
  }

  async count(): Promise<number> {
    return await this.userRepository.count({
      where: { status: UserStatus.ACTIVE }
    });
  }

  // Helper methods for domain-entity mapping

  private toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.getId();
    entity.email = user.getEmail().getValue();
    entity.username = user.getUsername().getValue();
    entity.passwordHash = user.getPassword().getValue();
    entity.role = user.getRole();
    entity.status = user.getStatus();
    entity.authProvider = user.getAuthProvider();
    entity.googleId = user.getGoogleId();
    entity.phoneNumber = user.getPhoneNumber()?.getValue();
    entity.createdAt = user.getCreatedAt();
    entity.updatedAt = user.getUpdatedAt();
    entity.emailVerifiedAt = user.getEmailVerifiedAt();
    entity.lastLoginAt = user.getLastLoginAt();
    entity.version = user.getVersion();
    return entity;
  }

  private toDomain(entity: UserEntity): User {
    // returns a new User (from domain) instance
    return User.fromPersistence({
      id: entity.id,
      email: entity.email,
      username: entity.username,
      passwordHash: entity.passwordHash,
      role: entity.role,
      status: entity.status,
      authProvider: entity.authProvider ?? AuthProvider.LOCAL,
      googleId: entity.googleId,
      phoneNumber: entity.phoneNumber || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      emailVerifiedAt: entity.emailVerifiedAt || undefined,
      lastLoginAt: entity.lastLoginAt || undefined,
      version: entity.version,
    });
  }
}
