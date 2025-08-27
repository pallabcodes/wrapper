import nodemailer from 'nodemailer';
import { logger } from '@/core/utils/logger';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify your email address',
        html: `
          <h1>Welcome to Ecommerce Enterprise!</h1>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        `
      });

      logger.info('Verification email sent', { email });
    } catch (error) {
      logger.error('Failed to send verification email', { email, error });
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Reset your password',
        html: `
          <h1>Password Reset Request</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        `
      });

      logger.info('Password reset email sent', { email });
    } catch (error) {
      logger.error('Failed to send password reset email', { email, error });
      throw error;
    }
  }

  async sendOrderConfirmation(email: string, orderData: any): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `Order Confirmation #${orderData.orderNumber}`,
        html: `
          <h1>Order Confirmed!</h1>
          <p>Thank you for your order. Your order number is: ${orderData.orderNumber}</p>
          <p>Total: $${orderData.total}</p>
          <p>We'll send you updates as your order progresses.</p>
        `
      });

      logger.info('Order confirmation email sent', { email, orderNumber: orderData.orderNumber });
    } catch (error) {
      logger.error('Failed to send order confirmation email', { email, error });
      throw error;
    }
  }
}

export const emailService = new EmailService();
