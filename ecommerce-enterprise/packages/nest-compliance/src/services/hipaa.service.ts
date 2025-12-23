import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  HIPAAConfig, 
  PersonalData, 
  AuditLog, 
  BreachIncident,
  ComplianceReport 
} from '../interfaces/compliance.interface';
import * as crypto from 'crypto';
// import * as bcrypt from 'bcrypt';

@Injectable()
export class HIPAAService {
  private readonly logger = new Logger(HIPAAService.name);
  private config: HIPAAConfig;
  private auditLogs: AuditLog[] = [];

  constructor(private configService: ConfigService) {
    this.config = this.configService.get<HIPAAConfig>('HIPAA_CONFIG', {
      enabled: true,
      encryption: {
        enabled: true,
        algorithm: 'aes-256-gcm',
        keyManagement: 'aws-kms'
      },
      accessControls: {
        enabled: true,
        roleBasedAccess: true,
        multiFactorAuth: true
      },
      auditLogging: {
        enabled: true,
        retentionDays: 2555, // 7 years
        detailedLogging: true
      },
      dataMinimization: true,
      breachNotification: true
    });
  }

  async processHealthData(data: Omit<PersonalData, 'id' | 'createdAt' | 'updatedAt' | 'encrypted'>): Promise<PersonalData> {
    this.logger.log(`Processing health data for user: ${data.owner}`);
    
    const healthData: PersonalData = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      encrypted: false
    };

    // Encrypt health data if encryption is enabled
    if (this.config.encryption.enabled) {
      healthData.data = await this.encryptHealthData(data.data);
      healthData.encrypted = true;
    }

    // Apply data minimization
    if (this.config.dataMinimization) {
      healthData.data = this.minimizeHealthData(healthData.data);
    }

    // Log health data processing
    await this.logHealthDataAccess(healthData, 'create');

    return healthData;
  }

  async validateAccess(userId: string, resourceId: string, action: string, healthData: PersonalData): Promise<boolean> {
    this.logger.log(`Validating HIPAA access for user: ${userId}, resource: ${resourceId}, action: ${action}`);
    
    if (!this.config.accessControls.enabled) {
      return true;
    }

    // Check role-based access
    if (this.config.accessControls.roleBasedAccess) {
      const hasAccess = await this.checkRoleBasedAccess(userId, resourceId, action);
      if (!hasAccess) {
        await this.logAccessDenied(userId, resourceId, action, 'insufficient_role');
        return false;
      }
    }

    // Check multi-factor authentication
    if (this.config.accessControls.multiFactorAuth) {
      const mfaVerified = await this.verifyMultiFactorAuth(userId);
      if (!mfaVerified) {
        await this.logAccessDenied(userId, resourceId, action, 'mfa_required');
        return false;
      }
    }

    // Log successful access
    await this.logHealthDataAccess(healthData, action, userId);

    return true;
  }

  async logHealthDataAccess(healthData: PersonalData, action: string, userId?: string): Promise<AuditLog> {
    this.logger.log(`Logging health data access: ${action} for data: ${healthData.id}`);
    
    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      userId: userId || 'system',
      action,
      resource: 'health_data',
      resourceId: healthData.id,
      details: {
        dataType: healthData.type,
        owner: healthData.owner,
        encrypted: healthData.encrypted,
        purpose: healthData.purpose,
        source: healthData.source
      },
      ipAddress: '127.0.0.1', // In real implementation, get from request
      userAgent: 'HIPAA Service', // In real implementation, get from request
      complianceType: 'HIPAA',
      severity: this.determineSeverity(healthData.type, action),
      hash: this.generateHash({ healthData, action, userId })
    };

    if (this.config.auditLogging.enabled) {
      await this.storeAuditLog(auditLog);
    }

    return auditLog;
  }

  async detectHealthDataBreach(incident: Omit<BreachIncident, 'id' | 'detectedAt' | 'status'>): Promise<BreachIncident> {
    this.logger.warn(`Health data breach detected: ${incident.type}, severity: ${incident.severity}`);
    
    const breach: BreachIncident = {
      ...incident,
      id: crypto.randomUUID(),
      detectedAt: new Date(),
      status: 'detected',
      complianceImpact: ['HIPAA']
    };

    // Log the breach
    await this.logBreachIncident(breach);

    // Trigger breach notification if required
    if (this.config.breachNotification) {
      await this.triggerBreachNotification(breach);
    }

    return breach;
  }

  async generateComplianceReport(period: { start: Date; end: Date }): Promise<ComplianceReport> {
    this.logger.log(`Generating HIPAA compliance report for period: ${period.start} to ${period.end}`);
    
    const auditLogs = this.getAuditLogsForPeriod(period);
    
    const report: ComplianceReport = {
      id: crypto.randomUUID(),
      type: 'HIPAA',
      period,
      status: 'draft',
      generatedAt: new Date(),
      generatedBy: 'system',
      data: {
        totalRecords: auditLogs.length,
        processedRequests: auditLogs.filter(log => log.action === 'access').length,
        breaches: auditLogs.filter(log => log.severity === 'critical').length,
        complianceScore: this.calculateComplianceScore(auditLogs),
        recommendations: this.generateRecommendations(auditLogs)
      }
    };

    return report;
  }

  async getAuditTrail(resourceId: string, startDate?: Date, endDate?: Date): Promise<AuditLog[]> {
    this.logger.log(`Retrieving HIPAA audit trail for resource: ${resourceId}`);
    
    let logs = this.auditLogs.filter(log => log.resourceId === resourceId);
    
    if (startDate) {
      logs = logs.filter(log => log.timestamp >= startDate);
    }
    
    if (endDate) {
      logs = logs.filter(log => log.timestamp <= endDate);
    }
    
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async validateDataIntegrity(healthData: PersonalData): Promise<boolean> {
    this.logger.log(`Validating HIPAA data integrity for health data: ${healthData.id}`);
    
    // Check if data is properly encrypted
    if (this.config.encryption.enabled && !healthData.encrypted) {
      this.logger.error(`Health data not encrypted: ${healthData.id}`);
      return false;
    }

    // Validate data minimization
    if (this.config.dataMinimization) {
      const isMinimized = this.validateDataMinimization(healthData.data);
      if (!isMinimized) {
        this.logger.warn(`Health data not properly minimized: ${healthData.id}`);
      }
    }

    return true;
  }

  private async encryptHealthData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const key = crypto.randomBytes(32);
    // IV not used in createCipher but kept for completeness
    crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.config.encryption.algorithm, key);
    
    const encrypted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        encrypted[key] = cipher.update(value, 'utf8', 'hex') + cipher.final('hex');
      } else {
        encrypted[key] = value;
      }
    }
    
    return encrypted;
  }

  private minimizeHealthData(data: Record<string, unknown>): Record<string, unknown> {
    // Remove unnecessary fields and anonymize where possible
    const minimized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (this.isRequiredField(key)) {
        if (this.isIdentifiableField(key)) {
          minimized[key] = this.anonymizeValue(value);
        } else {
          minimized[key] = value;
        }
      }
    }
    
    return minimized;
  }

  private isRequiredField(field: string): boolean {
    const requiredFields = ['diagnosis', 'treatment', 'medication', 'allergies', 'vitalSigns'];
    return requiredFields.includes(field);
  }

  private isIdentifiableField(field: string): boolean {
    const identifiableFields = ['patientName', 'ssn', 'address', 'phone', 'email'];
    return identifiableFields.includes(field);
  }

  private anonymizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return value.replace(/[a-zA-Z0-9]/g, '*');
    }
    return value;
  }

  private async checkRoleBasedAccess(userId: string, _resourceId: string, action: string): Promise<boolean> {
    // Simulate role-based access check
    const userRoles = await this.getUserRoles(userId);
    const requiredRoles = this.getRequiredRoles(action);
    
    return requiredRoles.some(role => userRoles.includes(role));
  }

  private async getUserRoles(_userId: string): Promise<string[]> {
    // Simulate user role retrieval
    return ['healthcare_provider', 'nurse'];
  }

  private getRequiredRoles(action: string): string[] {
    const roleMap: Record<string, string[]> = {
      'read': ['healthcare_provider', 'nurse', 'admin'],
      'write': ['healthcare_provider', 'admin'],
      'delete': ['admin'],
      'export': ['admin']
    };
    
    return roleMap[action] || ['admin'];
  }

  private async verifyMultiFactorAuth(_userId: string): Promise<boolean> {
    // Simulate MFA verification
    return true;
  }

  private async logAccessDenied(userId: string, resourceId: string, action: string, reason: string): Promise<void> {
    this.logger.warn(`HIPAA access denied: ${reason} for user: ${userId}, resource: ${resourceId}, action: ${action}`);
  }

  private determineSeverity(dataType: string, action: string): 'low' | 'medium' | 'high' | 'critical' {
    if (dataType === 'health' && action === 'delete') return 'critical';
    if (dataType === 'health' && action === 'export') return 'high';
    if (dataType === 'health' && action === 'write') return 'medium';
    return 'low';
  }

  private generateHash(data: unknown): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  private async storeAuditLog(auditLog: AuditLog): Promise<void> {
    this.auditLogs.push(auditLog);
  }

  private async logBreachIncident(breach: BreachIncident): Promise<void> {
    this.logger.warn(`HIPAA breach incident logged: ${breach.id}`);
  }

  private async triggerBreachNotification(breach: BreachIncident): Promise<void> {
    this.logger.warn(`HIPAA breach notification triggered for incident: ${breach.id}`);
  }

  private getAuditLogsForPeriod(period: { start: Date; end: Date }): AuditLog[] {
    return this.auditLogs.filter(log => 
      log.timestamp >= period.start && log.timestamp <= period.end
    );
  }

  private calculateComplianceScore(auditLogs: AuditLog[]): number {
    // const totalLogs = auditLogs.length;
    const criticalIssues = auditLogs.filter(log => log.severity === 'critical').length;
    const highIssues = auditLogs.filter(log => log.severity === 'high').length;
    const accessDenials = auditLogs.filter(log => 
      log.details?.['reason']?.includes('denied')
    ).length;
    
    const score = Math.max(0, 100 - (criticalIssues * 15) - (highIssues * 10) - (accessDenials * 5));
    return Math.round(score);
  }

  private generateRecommendations(auditLogs: AuditLog[]): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = auditLogs.filter(log => log.severity === 'critical').length;
    if (criticalIssues > 0) {
      recommendations.push('Address critical HIPAA compliance issues immediately');
    }
    
    const accessDenials = auditLogs.filter(log => 
      log.details?.['reason']?.includes('denied')
    ).length;
    if (accessDenials > 0) {
      recommendations.push('Review access control policies and user permissions');
    }
    
    const encryptionIssues = auditLogs.filter(log => 
      log.details?.['encryption'] === false
    ).length;
    if (encryptionIssues > 0) {
      recommendations.push('Ensure all health data is properly encrypted');
    }
    
    return recommendations;
  }

  private validateDataMinimization(data: Record<string, unknown>): boolean {
    // Check if data contains only necessary fields
    const allowedFields = ['diagnosis', 'treatment', 'medication', 'allergies', 'vitalSigns'];
    const dataFields = Object.keys(data);
    
    return dataFields.every(field => allowedFields.includes(field));
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getConfig(): HIPAAConfig {
    return this.config;
  }
}
