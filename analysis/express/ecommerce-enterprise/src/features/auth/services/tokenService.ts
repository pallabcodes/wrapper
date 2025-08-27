import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getPrismaClient } from '@/infrastructure/database/client';
import { env } from '@/core/config/env';

// Pure function to generate JWT token
export const generateJWTToken = (payload: any, secret: string, expiresIn: string): string => {
  return jwt.sign(payload, secret, { expiresIn });
};

// Pure function to verify JWT token
export const verifyJWTToken = (token: string, secret: string): any => {
  return jwt.verify(token, secret);
};

// Pure function to generate UUID
export const generateUUID = (): string => {
  return uuidv4();
};

// Token generation functions
export const generateAccessToken = (userId: string, email: string, role: string): string => {
  return generateJWTToken(
    { userId, email, role },
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN
  );
};

export const generateRefreshToken = (): string => {
  return generateUUID();
};

export const generateTokens = async (userId: string, email: string, role: string) => {
  const prisma = getPrismaClient();
  
  const accessToken = generateAccessToken(userId, email, role);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt
    }
  });

  return { accessToken, refreshToken };
};

// Refresh token functions
export const findRefreshToken = async (token: string) => {
  const prisma = getPrismaClient();
  return await prisma.refreshToken.findUnique({
    where: { token }
  });
};

export const revokeRefreshToken = async (token: string) => {
  const prisma = getPrismaClient();
  await prisma.refreshToken.update({
    where: { token },
    data: { isRevoked: true }
  });
};

export const revokeAllRefreshTokens = async (userId: string) => {
  const prisma = getPrismaClient();
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true }
  });
};

// Password reset token functions
export const createPasswordResetToken = async (userId: string) => {
  const prisma = getPrismaClient();
  
  const token = generateUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await prisma.passwordReset.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

  return token;
};

export const findPasswordResetToken = async (token: string) => {
  const prisma = getPrismaClient();
  return await prisma.passwordReset.findUnique({
    where: { token }
  });
};

export const markPasswordResetTokenAsUsed = async (token: string) => {
  const prisma = getPrismaClient();
  await prisma.passwordReset.update({
    where: { token },
    data: { isUsed: true }
  });
};

// Email verification token functions
export const createEmailVerificationToken = async (userId: string) => {
  const prisma = getPrismaClient();
  
  const token = generateUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 1);

  await prisma.emailVerification.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

  return token;
};

export const findEmailVerificationToken = async (token: string) => {
  const prisma = getPrismaClient();
  return await prisma.emailVerification.findUnique({
    where: { token }
  });
};

export const markEmailVerificationTokenAsUsed = async (token: string) => {
  const prisma = getPrismaClient();
  await prisma.emailVerification.update({
    where: { token },
    data: { isUsed: true }
  });
};
