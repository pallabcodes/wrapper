import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  SOXConfig, 
  AuditLog, 
  ComplianceReport 
} from '../interfaces/compliance.interface';
import * as crypto from 'crypto';

@Injectable()
export class SOXService {
  private readonly logger = new Logger(SOXService.name);
  private config: SOXConfig;
  private auditLogs: AuditLog[] = [];

  constructor(private configService: ConfigService) {
    this.config = this.configService.get<SOXConfig>('SOX_CONFIG', {
      enabled: true,
      auditTrail: true,
      dataIntegrity: true,
      accessControls: true,
      changeManagement: true,
      financialControls: {
        enabled: true,
        approvalWorkflow: true,
        segregationOfDuties: true
      },
      auditLogging: {
        enabled: true,
        retentionDays: 2555, // 7 years
        immutable: true
      }
    });
  }

  async logFinancialTransaction(transaction: {
    id: string;
    amount: number;
    currency: string;
    type: 'debit' | 'credit' | 'transfer';
    fromAccount: string;
    toAccount?: string;
    description: string;
    userId: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<AuditLog> {
    this.logger.log(`Logging financial transaction: ${transaction.id}`);
    
    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      userId: transaction.userId,
      action: 'financial_transaction',
      resource: 'transaction',
      resourceId: transaction.id,
      details: {
        amount: transaction.amount,
        currency: transaction.currency,
        type: transaction.type,
        fromAccount: transaction.fromAccount,
        toAccount: transaction.toAccount,
        description: transaction.description
      },
      ipAddress: transaction.ipAddress,
      userAgent: transaction.userAgent,
      complianceType: 'SOX',
      severity: this.determineSeverity(transaction.amount),
      hash: this.generateHash(transaction)
    };

    if (this.config.auditLogging.enabled) {
      await this.storeAuditLog(auditLog);
    }

    return auditLog;
  }

  async logDataAccess(userId: string, resource: string, resourceId: string, action: string, details: Record<string, any>): Promise<AuditLog> {
    this.logger.log(`Logging data access: ${action} on ${resource}/${resourceId} by ${userId}`);
    
    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: '127.0.0.1', // In real implementation, get from request
      userAgent: 'SOX Service', // In real implementation, get from request
      complianceType: 'SOX',
      severity: 'medium',
      hash: this.generateHash({ userId, resource, resourceId, action, details })
    };

    if (this.config.auditLogging.enabled) {
      await this.storeAuditLog(auditLog);
    }

    return auditLog;
  }

  async logSystemChange(change: {
    id: string;
    type: 'configuration' | 'code' | 'data' | 'access';
    description: string;
    userId: string;
    previousValue?: any;
    newValue?: any;
    reason: string;
    approvalRequired: boolean;
    approvedBy?: string;
    approvedAt?: Date;
  }): Promise<AuditLog> {
    this.logger.log(`Logging system change: ${change.type} - ${change.description}`);
    
    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      userId: change.userId,
      action: 'system_change',
      resource: change.type,
      resourceId: change.id,
      details: {
        description: change.description,
        previousValue: change.previousValue,
        newValue: change.newValue,
        reason: change.reason,
        approvalRequired: change.approvalRequired,
        approvedBy: change.approvedBy,
        approvedAt: change.approvedAt
      },
      ipAddress: '127.0.0.1',
      userAgent: 'SOX Service',
      complianceType: 'SOX',
      severity: change.approvalRequired ? 'high' : 'medium',
      hash: this.generateHash(change)
    };

    if (this.config.auditLogging.enabled) {
      await this.storeAuditLog(auditLog);
    }

    return auditLog;
  }

  async validateSegregationOfDuties(userId: string, action: string, resource: string): Promise<boolean> {
    this.logger.log(`Validating segregation of duties for user: ${userId}, action: ${action}, resource: ${resource}`);
    
    if (!this.config.financialControls.segregationOfDuties) {
      return true;
    }

    // Simulate segregation of duties validation
    const conflictingRoles = this.getConflictingRoles(action, resource);
    const userRoles = await this.getUserRoles(userId);
    
    const hasConflict = conflictingRoles.some(role => userRoles.includes(role));
    
    if (hasConflict) {
      this.logger.warn(`Segregation of duties violation detected for user: ${userId}`);
      await this.logSegregationViolation(userId, action, resource, conflictingRoles, userRoles);
    }

    return !hasConflict;
  }

  async generateComplianceReport(period: { start: Date; end: Date }): Promise<ComplianceReport> {
    this.logger.log(`Generating SOX compliance report for period: ${period.start} to ${period.end}`);
    
    const auditLogs = this.getAuditLogsForPeriod(period);
    
    const report: ComplianceReport = {
      id: crypto.randomUUID(),
      type: 'SOX',
      period,
      status: 'draft',
      generatedAt: new Date(),
      generatedBy: 'system',
      data: {
        totalRecords: auditLogs.length,
        processedRequests: auditLogs.filter(log => log.action === 'data_access').length,
        breaches: auditLogs.filter(log => log.severity === 'critical').length,
        complianceScore: this.calculateComplianceScore(auditLogs),
        recommendations: this.generateRecommendations(auditLogs)
      }
    };

    return report;
  }

  async getAuditTrail(resourceId: string, startDate?: Date, endDate?: Date): Promise<AuditLog[]> {
    this.logger.log(`Retrieving audit trail for resource: ${resourceId}`);
    
    let logs = this.auditLogs.filter(log => log.resourceId === resourceId);
    
    if (startDate) {
      logs = logs.filter(log => log.timestamp >= startDate);
    }
    
    if (endDate) {
      logs = logs.filter(log => log.timestamp <= endDate);
    }
    
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async validateDataIntegrity(data: any, checksum: string): Promise<boolean> {
    this.logger.log(`Validating data integrity for checksum: ${checksum}`);
    
    if (!this.config.dataIntegrity) {
      return true;
    }

    const calculatedChecksum = this.calculateChecksum(data);
    const isValid = calculatedChecksum === checksum;
    
    if (!isValid) {
      this.logger.error(`Data integrity validation failed for checksum: ${checksum}`);
      await this.logDataIntegrityViolation(data, checksum, calculatedChecksum);
    }

    return isValid;
  }

  private async storeAuditLog(auditLog: AuditLog): Promise<void> {
    if (this.config.auditLogging.immutable) {
      // In a real implementation, this would be stored in an immutable database
      this.auditLogs.push(auditLog);
    } else {
      this.auditLogs.push(auditLog);
    }
  }

  private determineSeverity(amount: number): 'low' | 'medium' | 'high' | 'critical' {
    if (amount >= 1000000) return 'critical';
    if (amount >= 100000) return 'high';
    if (amount >= 10000) return 'medium';
    return 'low';
  }

  private generateHash(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  private getConflictingRoles(action: string, resource: string): string[] {
    // Simulate role conflict detection
    const conflicts: Record<string, string[]> = {
      'approve_payment': ['initiate_payment', 'process_payment'],
      'initiate_payment': ['approve_payment', 'reconcile_payment'],
      'process_payment': ['approve_payment', 'reconcile_payment']
    };
    
    return conflicts[action] || [];
  }

  private async getUserRoles(userId: string): Promise<string[]> {
    // Simulate user role retrieval
    return ['user', 'financial_user'];
  }

  private async logSegregationViolation(userId: string, action: string, resource: string, conflictingRoles: string[], userRoles: string[]): Promise<void> {
    this.logger.warn(`Segregation of duties violation logged for user: ${userId}`);
  }

  private getAuditLogsForPeriod(period: { start: Date; end: Date }): AuditLog[] {
    return this.auditLogs.filter(log => 
      log.timestamp >= period.start && log.timestamp <= period.end
    );
  }

  private calculateComplianceScore(auditLogs: AuditLog[]): number {
    const totalLogs = auditLogs.length;
    const criticalIssues = auditLogs.filter(log => log.severity === 'critical').length;
    const highIssues = auditLogs.filter(log => log.severity === 'high').length;
    
    const score = Math.max(0, 100 - (criticalIssues * 10) - (highIssues * 5));
    return Math.round(score);
  }

  private generateRecommendations(auditLogs: AuditLog[]): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = auditLogs.filter(log => log.severity === 'critical').length;
    if (criticalIssues > 0) {
      recommendations.push('Address critical audit issues immediately');
    }
    
    const segregationViolations = auditLogs.filter(log => 
      log.details?.violationType === 'segregation_of_duties'
    ).length;
    if (segregationViolations > 0) {
      recommendations.push('Review and update segregation of duties policies');
    }
    
    const dataIntegrityIssues = auditLogs.filter(log => 
      log.details?.violationType === 'data_integrity'
    ).length;
    if (dataIntegrityIssues > 0) {
      recommendations.push('Implement additional data integrity checks');
    }
    
    return recommendations;
  }

  private calculateChecksum(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  private async logDataIntegrityViolation(data: any, expectedChecksum: string, actualChecksum: string): Promise<void> {
    this.logger.error(`Data integrity violation logged: expected ${expectedChecksum}, got ${actualChecksum}`);
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getConfig(): SOXConfig {
    return this.config;
  }
}
