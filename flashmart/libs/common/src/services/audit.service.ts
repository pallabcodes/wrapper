import { Injectable, Logger } from '@nestjs/common';

export interface AuditLogEntry {
  timestamp: Date;
  eventType: string;
  clientId: string | null;
  ipAddress: string;
  userAgent?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

/**
 * Audit Service - Logs security and compliance events
 * In production: Send to CloudWatch, ELK, Splunk, or audit DB
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditService');

  async log(entry: AuditLogEntry): Promise<void> {
    // In production: Send to audit log destination
    this.logger.log({
      ...entry,
      timestamp: entry.timestamp.toISOString(),
    });
  }

  async logRateLimit(
    clientId: string,
    ipAddress: string,
    userAgent?: string,
    correlationId?: string,
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      eventType: 'RATE_LIMIT_EXCEEDED',
      clientId,
      ipAddress,
      userAgent,
      correlationId,
    });
  }

  async logAuthFailure(
    clientId: string | null,
    ipAddress: string,
    reason: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      eventType: 'AUTH_FAILURE',
      clientId,
      ipAddress,
      userAgent,
      metadata: { reason },
    });
  }

  async logSecurityEvent(
    eventType: string,
    clientId: string | null,
    ipAddress: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      eventType,
      clientId,
      ipAddress,
      metadata,
    });
  }

  // Matches user's call signature
  async logAuthentication(
    clientId: string | null,
    success: boolean,
    ipAddress: string,
    userAgent?: string,
    correlationId?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      eventType: success ? 'AUTH_SUCCESS' : 'AUTH_FAILURE',
      clientId,
      ipAddress,
      userAgent,
      correlationId,
      metadata: { ...metadata, success },
    });
  }
}