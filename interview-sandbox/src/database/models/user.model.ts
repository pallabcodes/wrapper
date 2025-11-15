import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  HasMany,
} from 'sequelize-typescript';
// Circular dependency prevention: Arrow functions in decorators defer evaluation
// e.g., @HasMany(() => Otp) evaluates Otp lazily, preventing circular imports
import { Otp } from './otp.model';
import { SocialAuth } from './social-auth.model';
import { File } from './file.model';
import { Payment } from './payment.model';

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model<User> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phone: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isEmailVerified: boolean;

  @Column({
    type: DataType.ENUM('USER', 'ADMIN', 'MODERATOR'),
    defaultValue: 'USER',
    allowNull: false,
  })
  role: 'USER' | 'ADMIN' | 'MODERATOR';

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Associations
  @HasMany(() => Otp, { foreignKey: 'userId', as: 'otps' })
  otps: Otp[];

  @HasMany(() => SocialAuth, { foreignKey: 'userId', as: 'socialAuths' })
  socialAuths: SocialAuth[];

  @HasMany(() => File, { foreignKey: 'userId', as: 'files' })
  files: File[];

  @HasMany(() => Payment, { foreignKey: 'userId', as: 'payments' })
  payments: Payment[];
}

