import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
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
  ) {}

  // User operations
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<User> {
    return this.userModel.create(userData as any);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  async findUserById(id: number): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  async updateUser(id: number, updateData: Partial<User>): Promise<[number]> {
    return this.userModel.update(updateData, { where: { id } });
  }

  // OTP operations
  async createOtp(otpData: {
    userId: number;
    code: string;
    type: OtpType;
    expiresAt: Date;
  }): Promise<Otp> {
    return this.otpModel.create(otpData as any);
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

  async invalidateUserOtps(userId: number, type: OtpType): Promise<number> {
    return this.otpModel.destroy({
      where: {
        userId,
        type,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
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
}

