import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Op, Sequelize, Transaction } from 'sequelize';
import { User } from '../../database/models/user.model';
import { Otp, OtpType } from '../../database/models/otp.model';
import { SocialAuth, SocialProvider } from '../../database/models/social-auth.model';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Otp)
    private otpModel: typeof Otp,
    @InjectModel(SocialAuth)
    private socialAuthModel: typeof SocialAuth,
    @InjectConnection()
    private sequelize: Sequelize,
  ) {}

  // User operations
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    isEmailVerified?: boolean;
  }): Promise<User> {
    return this.userModel.create(userData as any);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ 
      where: { email },
      attributes: { include: ['password'] } // Explicitly include password field
    });
  }

  async findUserById(id: number): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  async updateUser(id: number, updateData: Partial<User>, transaction?: Transaction): Promise<[number]> {
    return this.userModel.update(updateData, { where: { id }, transaction });
  }

  // OTP operations
  async createOtp(otpData: {
    userId: number;
    code: string;
    type: OtpType;
    expiresAt: Date;
  }, transaction?: Transaction): Promise<Otp> {
    return this.otpModel.create(otpData as any, { transaction });
  }

  async findValidOtp(userId: number, code: string, type: OtpType): Promise<Otp | null> {
    return this.otpModel.findOne({
      where: {
        userId,
        code,
        type,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
    });
  }

  async invalidateUserOtps(userId: number, type: OtpType, transaction?: Transaction): Promise<number> {
    return this.otpModel.destroy({
      where: {
        userId,
        type,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
      transaction,
    });
  }

  async deleteExpiredOtps(): Promise<number> {
    return this.otpModel.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date(),
        },
      },
    });
  }

  // Social Auth operations
  async createSocialAuth(socialAuthData: {
    userId: number;
    provider: SocialProvider;
    providerId: string;
  }): Promise<SocialAuth> {
    return this.socialAuthModel.create(socialAuthData as any);
  }

  async findSocialAuth(provider: SocialProvider, providerId: string): Promise<SocialAuth | null> {
    return this.socialAuthModel.findOne({
      where: { provider, providerId },
      include: [{ model: User, as: 'user' }],
    });
  }

  // ============================================
  // TRANSACTIONAL OPERATIONS
  // These methods ensure atomicity: all operations succeed or all fail
  // Uses Sequelize managed transactions (auto-commit/rollback)
  // ============================================

  /**
   * Create user and OTP atomically
   * 
   * Why transaction: User registration requires both user and OTP.
   * If OTP creation fails, user creation is rolled back automatically.
   * 
   * @returns Both user and OTP if successful
   * @throws Error if any operation fails (transaction auto-rolls back)
   */
  async createUserWithOtp(
    userData: {
      email: string;
      password: string;
      name: string;
      phone?: string;
      isEmailVerified?: boolean;
    },
    otpData: {
      code: string;
      type: OtpType;
      expiresAt: Date;
    },
  ): Promise<{ user: User; otp: Otp }> {
    // Managed transaction: auto-commits on success, auto-rolls back on error
    return await this.sequelize.transaction(async (transaction) => {
      // Step 1: Create user
      const user = await this.userModel.create(userData as any, { transaction });
      
      // Step 2: Create OTP for the user
      // If this fails, user creation is automatically rolled back
      const otp = await this.otpModel.create(
        {
          userId: user.id,
          code: otpData.code,
          type: otpData.type,
          expiresAt: otpData.expiresAt,
        } as any,
        { transaction },
      );
      
      // Both operations succeeded - transaction auto-commits
      return { user, otp };
    });
    // If any error occurs above, transaction auto-rolls back
  }

  /**
   * Verify email atomically: invalidate OTPs and update user status
   * 
   * Why transaction: Email verification requires both OTP invalidation and user update.
   * If user update fails, OTP invalidation is rolled back automatically.
   * 
   * @param userId - User ID to verify email for
   * @throws Error if any operation fails (transaction auto-rolls back)
   */
  async verifyEmailWithTransaction(userId: number): Promise<void> {
    // Managed transaction: auto-commits on success, auto-rolls back on error
    return await this.sequelize.transaction(async (transaction) => {
      // Step 1: Invalidate all verification OTPs for this user
      await this.invalidateUserOtps(userId, OtpType.VERIFY, transaction);
      
      // Step 2: Mark user email as verified
      // If this fails, OTP invalidation is automatically rolled back
      await this.updateUser(userId, { isEmailVerified: true }, transaction);
      
      // Both operations succeeded - transaction auto-commits
    });
    // If any error occurs above, transaction auto-rolls back
  }

  /**
   * Reset password atomically: invalidate OTPs and update password
   * 
   * Why transaction: Password reset requires both OTP invalidation and password update.
   * If password update fails, OTP invalidation is rolled back automatically.
   * 
   * @param userId - User ID to reset password for
   * @param hashedPassword - New hashed password
   * @throws Error if any operation fails (transaction auto-rolls back)
   */
  async resetPasswordWithTransaction(userId: number, hashedPassword: string): Promise<void> {
    // Managed transaction: auto-commits on success, auto-rolls back on error
    return await this.sequelize.transaction(async (transaction) => {
      // Step 1: Invalidate all reset OTPs for this user
      await this.invalidateUserOtps(userId, OtpType.RESET, transaction);
      
      // Step 2: Update user password
      // If this fails, OTP invalidation is automatically rolled back
      await this.updateUser(userId, { password: hashedPassword }, transaction);
      
      // Both operations succeeded - transaction auto-commits
    });
    // If any error occurs above, transaction auto-rolls back
  }
}

