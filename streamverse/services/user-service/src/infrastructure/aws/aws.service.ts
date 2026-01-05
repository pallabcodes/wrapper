import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * AWS Service abstraction - handles AWS integrations
 * Only active when USE_AWS_SERVICES=true
 *
 * TODO: Install AWS SDKs when implementing specific services:
 * - @aws-sdk/client-s3 (for file storage)
 * - @aws-sdk/client-sqs (for messaging)
 * - @aws-sdk/client-rds (for database monitoring)
 */
@Injectable()
export class AWSService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Check if AWS services are enabled
   */
  isAWSEnabled(): boolean {
    return this.configService.get('USE_AWS_SERVICES') === 'true';
  }

  /**
   * Get AWS region from configuration
   */
  getRegion(): string {
    return this.configService.get('AWS_REGION', 'us-east-1');
  }

  /**
   * S3 File Upload (placeholder)
   * TODO: Implement when user avatars or file uploads are needed
   */
  async uploadToS3(file: Buffer, key: string, contentType: string): Promise<string> {
    if (!this.isAWSEnabled()) {
      throw new Error('AWS services not enabled. Set USE_AWS_SERVICES=true');
    }

    // TODO: Install @aws-sdk/client-s3 and implement
    console.log(`📤 S3 Upload: ${key} (${contentType})`);
    throw new Error('S3 upload not implemented - install @aws-sdk/client-s3');

    // return `https://${bucket}.s3.${this.getRegion()}.amazonaws.com/${key}`;
  }

  /**
   * SQS Message Publishing (placeholder)
   * TODO: Implement as alternative to Kafka when deploying to AWS
   */
  async sendToSQS(queueUrl: string, message: Record<string, unknown>): Promise<void> {
    if (!this.isAWSEnabled()) {
      throw new Error('AWS services not enabled. Set USE_AWS_SERVICES=true');
    }

    // TODO: Install @aws-sdk/client-sqs and implement
    console.log(`📨 SQS Send: ${queueUrl}`, message);
    throw new Error('SQS messaging not implemented - install @aws-sdk/client-sqs');
  }

  /**
   * CloudWatch Metrics (placeholder)
   * TODO: Implement for production monitoring
   */
  async sendMetric(metricName: string, value: number, unit: string): Promise<void> {
    if (!this.isAWSEnabled()) {
      return; // Silently skip if AWS not enabled
    }

    // TODO: Install @aws-sdk/client-cloudwatch and implement
    console.log(`📊 CloudWatch Metric: ${metricName} = ${value} ${unit}`);
    // Implementation would send metrics to AWS CloudWatch
  }

  /**
   * SES Email Service (placeholder)
   * TODO: Implement as alternative to SendGrid when using AWS
   */
  async sendEmailWithSES(to: string, subject: string, body: string): Promise<void> {
    if (!this.isAWSEnabled()) {
      throw new Error('AWS services not enabled. Set USE_AWS_SERVICES=true');
    }

    // TODO: Install @aws-sdk/client-ses and implement
    console.log(`📧 SES Email: ${to} - ${subject}`);
    throw new Error('SES email not implemented - install @aws-sdk/client-ses');
  }
}
