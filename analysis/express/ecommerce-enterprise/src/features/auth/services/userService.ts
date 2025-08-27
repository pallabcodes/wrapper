import bcrypt from 'bcryptjs';
import { getPrismaClient } from '@/infrastructure/database/client';
import { env } from '@/core/config/env';
import { logger } from '@/core/utils/logger';

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

// Pure function to hash password
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, env.BCRYPT_ROUNDS);
};

// Pure function to compare passwords
export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// User query functions
export const findUserByEmail = async (email: string) => {
  const prisma = getPrismaClient();
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      isEmailVerified: true
    }
  });
};

export const findUserById = async (userId: string) => {
  const prisma = getPrismaClient();
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

export const findUserWithPassword = async (userId: string) => {
  const prisma = getPrismaClient();
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true
    }
  });
};

// User mutation functions
export const createUser = async (userData: CreateUserData) => {
  const prisma = getPrismaClient();
  const hashedPassword = await hashPassword(userData.password);

  const user = await prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: 'CUSTOMER'
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isEmailVerified: true
    }
  });

  logger.info('User created', { userId: user.id, email: user.email });
  return user;
};

export const updateUser = async (userId: string, userData: UpdateUserData) => {
  const prisma = getPrismaClient();
  
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: userData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      updatedAt: true
    }
  });

  logger.info('User updated', { userId });
  return updatedUser;
};

export const updatePassword = async (userId: string, newPassword: string) => {
  const prisma = getPrismaClient();
  const hashedPassword = await hashPassword(newPassword);
  
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  logger.info('Password updated', { userId });
};

export const updateLastLogin = async (userId: string) => {
  const prisma = getPrismaClient();
  
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() }
  });
};

export const markEmailAsVerified = async (userId: string) => {
  const prisma = getPrismaClient();
  await prisma.user.update({
    where: { id: userId },
    data: { isEmailVerified: true }
  });
};
