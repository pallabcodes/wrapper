import { logger } from '@/core/utils/logger';
import { createEmailVerificationToken } from './tokenService';
import { emailService as sharedEmailService } from '@/shared/services/emailService';

export const sendVerificationEmail = async (userId: string, email: string) => {
  try {
    const token = await createEmailVerificationToken(userId);
    await sharedEmailService.sendVerificationEmail(email, token);
  } catch (error) {
    logger.error('Failed to send verification email', { userId, email, error });
  }
};

export const sendPasswordResetEmail = async (userId: string, email: string) => {
  try {
    const token = await createPasswordResetToken(userId);
    await sharedEmailService.sendPasswordResetEmail(email, token);
  } catch (error) {
    logger.error('Failed to send password reset email', { userId, email, error });
  }
};

// Import from tokenService to avoid circular dependency
const createPasswordResetToken = async (userId: string) => {
  const { createPasswordResetToken: createToken } = await import('./tokenService');
  return await createToken(userId);
};
