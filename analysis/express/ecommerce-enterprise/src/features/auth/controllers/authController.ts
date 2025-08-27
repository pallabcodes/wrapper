import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/core/errors/AppError';
import { logger } from '@/core/utils/logger';
import { recordUserRegistration } from '@/core/middleware/metrics';
import * as userService from '@/features/auth/services/userService';
import * as tokenService from '@/features/auth/services/tokenService';
import * as authEmailService from '@/features/auth/services/emailService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Pure function to create user response
const createUserResponse = (user: any, tokens: any) => ({
  message: 'User registered successfully',
  user: {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isEmailVerified: user.isEmailVerified
  },
  tokens
});

// Pure function to create login response
const createLoginResponse = (user: any, tokens: any) => ({
  message: 'Login successful',
  user: {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isEmailVerified: user.isEmailVerified
  },
  tokens
});

// Pure function to validate user credentials
const validateUserCredentials = async (email: string, password: string) => {
  const user = await userService.findUserByEmail(email);
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isValidPassword = await userService.comparePasswords(password, user.password);
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 401);
  }

  return user;
};

// Registration handler
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    const user = await userService.createUser({ email, password, firstName, lastName, phone });
    const tokens = await tokenService.generateTokens(user.id, user.email, user.role);
    
    await authEmailService.sendVerificationEmail(user.id, email);
    recordUserRegistration('email');

    res.status(201).json(createUserResponse(user, tokens));
  } catch (error) {
    next(error);
  }
};

// Login handler
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await validateUserCredentials(email, password);
    await userService.updateLastLogin(user.id);
    const tokens = await tokenService.generateTokens(user.id, user.email, user.role);

    logger.info('User logged in', { userId: user.id, email: user.email });
    res.json(createLoginResponse(user, tokens));
  } catch (error) {
    next(error);
  }
};

// Token refresh handler
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    const token = await tokenService.findRefreshToken(refreshToken);
    if (!token || token.isRevoked || token.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const tokens = await tokenService.generateTokens(token.userId, '', '');
    await tokenService.revokeRefreshToken(refreshToken);

    res.json({ message: 'Token refreshed successfully', tokens });
  } catch (error) {
    next(error);
  }
};

// Logout handler
export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await tokenService.revokeAllRefreshTokens(req.user!.id);
    logger.info('User logged out', { userId: req.user!.id });
    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

// Password reset request handler
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await userService.findUserByEmail(email);
    
    if (user) {
      await tokenService.createPasswordResetToken(user.id);
      await authEmailService.sendPasswordResetEmail(user.id, email);
      logger.info('Password reset requested', { userId: user.id, email });
    }

    res.json({ message: 'If the email exists, a password reset link has been sent' });
  } catch (error) {
    next(error);
  }
};

// Password reset handler
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body;

    const resetToken = await tokenService.findPasswordResetToken(token);
    if (!resetToken || resetToken.isUsed || resetToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    await userService.updatePassword(resetToken.userId, password);
    await tokenService.markPasswordResetTokenAsUsed(token);
    await tokenService.revokeAllRefreshTokens(resetToken.userId);

    logger.info('Password reset completed', { userId: resetToken.userId });
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

// Email verification handler
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;

    const verificationToken = await tokenService.findEmailVerificationToken(token);
    if (!verificationToken || verificationToken.isUsed || verificationToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    await userService.markEmailAsVerified(verificationToken.userId);
    await tokenService.markEmailVerificationTokenAsUsed(token);

    logger.info('Email verified', { userId: verificationToken.userId });
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

// Profile handler
export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.findUserById(req.user!.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};
