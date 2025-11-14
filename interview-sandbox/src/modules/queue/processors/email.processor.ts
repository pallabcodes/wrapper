import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  type?: 'verification' | 'reset' | 'notification';
}

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>) {
    this.logger.log(`Processing email job ${job.id} to ${job.data.to}`);
    
    try {
      // In a real implementation, you would:
      // 1. Use nodemailer or SendGrid
      // 2. Send the email
      // 3. Handle errors and retries
      
      // Mock email sending
      this.logger.log(`Email sent to ${job.data.to}: ${job.data.subject}`);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, jobId: job.id };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error}`);
      throw error;
    }
  }

  @Process('send-otp')
  async handleSendOtp(job: Job<EmailJobData & { code: string }>) {
    this.logger.log(`Processing OTP email job ${job.id} to ${job.data.to}`);
    
    try {
      // Send OTP email
      this.logger.log(`OTP email sent to ${job.data.to} with code: ${job.data.code}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true, jobId: job.id };
    } catch (error) {
      this.logger.error(`Failed to send OTP email: ${error}`);
      throw error;
    }
  }
}

