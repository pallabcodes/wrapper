import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, Index } from 'typeorm';
import { UserRole, UserStatus, AuthProvider } from '../../../domain/entities/user.entity';

/**
 * Infrastructure Entity: User (Database Table)
 *
 * TypeORM entity representing the users table
 * Maps to database schema
 */
@Entity('users')
export class UserEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 254 })
  email!: string;

  @Column({ unique: true, length: 30 })
  username!: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER
  })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING
  })
  status!: UserStatus;

  @Column({
    name: 'auth_provider',
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL
  })
  authProvider!: AuthProvider;

  @Column({ name: 'google_id', nullable: true, unique: true })
  @Index('idx_users_google_id')
  googleId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'email_verified_at', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ name: 'phone_number', nullable: true, unique: true })
  @Index('idx_users_phone_number')
  phoneNumber?: string;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'token_version', default: 1 })
  tokenVersion!: number;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts!: number;

  @Column({ name: 'account_locked_until', nullable: true })
  accountLockedUntil?: Date;

  @VersionColumn()
  version!: number;
}
