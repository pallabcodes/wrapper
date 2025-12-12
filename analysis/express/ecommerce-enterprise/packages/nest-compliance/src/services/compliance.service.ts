import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GDPRService } from './gdpr.service';
import { SOXService } from './sox.service';
import { HIPAAService } from './hipaa.service';
import { 
  ComplianceConfig, 
  ComplianceReport, 
  PersonalData, 
  BreachIncident 
} from '../interfaces/compliance.interface';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);
  private config: ComplianceConfig;

  constructor(
    private configService: ConfigService,
    private gdprService: GDPRService,
    private soxService: SOXService,
    private hipaaService: HIPAAService
  ) {
    this.config = this.configService.get<ComplianceConfig>('COMPLIANCE_CONFIG', {
      gdpr: {
        enabled: true,
        dataRetentionDays: 2555,
        consentRequired: true,
        rightToBeForgotten: true,
        dataPortability: true,
        privacyByDesign: true,
        encryption: {
          enabled: true,
          algorithm: 'aes-256-gcm',
          keyRotationDays: 90
        },
        consentManagement: {
          enabled: true,
          consentTypes: ['marketing', 'analytics', 'essential', 'functional'],
          expirationDays: 365
        }
      },
      sox: {
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
          retentionDays: 2555,
          immutable: true
        }
      },
      hipaa: {
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
          retentionDays: 2555,
          detailedLogging: true
        },
        dataMinimization: true,
        breachNotification: true
      },
      audit: {
        enabled: true,
        logLevel: 'detailed',
        retentionDays: 2555,
        immutable: true,
        realTimeAlerting: true,
        complianceReporting: true
      }
    });
  }

  async processPersonalData(data: Omit<PersonalData, 'id' | 'createdAt' | 'updatedAt' | 'encrypted'>): Promise<PersonalData> {
    this.logger.log(`Processing personal data with compliance checks for user: ${data.owner}`);
    
    let processedData: PersonalData;

    // Process based on data type
    switch (data.type) {
      case 'health':
        if (this.config.hipaa.enabled) {
          processedData = await this.hipaaService.processHealthData(data);
        } else {
          processedData = await this.gdprService.processPersonalData(data);
        }
        break;
      case 'financial':
        if (this.config.sox.enabled) {
          // Log financial data processing for SOX compliance
          await this.soxService.logDataAccess(
            data.owner,
            'financial_data',
            'unknown', // data.id is not available in this context
            'create',
            { dataType: data.type, purpose: data.purpose }
          );
        }
        processedData = await this.gdprService.processPersonalData(data);
        break;
      default:
        processedData = await this.gdprService.processPersonalData(data);
    }

    // Log comprehensive audit trail
    await this.logComplianceEvent('data_processing', processedData, {
      dataType: data.type,
      complianceTypes: this.getApplicableComplianceTypes(data.type)
    });

    return processedData;
  }

  async generateComprehensiveReport(period: { start: Date; end: Date }): Promise<ComplianceReport> {
    this.logger.log(`Generating comprehensive compliance report for period: ${period.start} to ${period.end}`);
    
    const reports: ComplianceReport[] = [];

    // Generate individual compliance reports
    if (this.config.gdpr.enabled) {
      const gdprReport = await this.gdprService.generateComplianceReport(period);
      reports.push(gdprReport);
    }

    if (this.config.sox.enabled) {
      const soxReport = await this.soxService.generateComplianceReport(period);
      reports.push(soxReport);
    }

    if (this.config.hipaa.enabled) {
      const hipaaReport = await this.hipaaService.generateComplianceReport(period);
      reports.push(hipaaReport);
    }

    // Combine reports
    const combinedReport: ComplianceReport = {
      id: `comprehensive_${Date.now()}`,
      type: 'GENERAL',
      period,
      status: 'draft',
      generatedAt: new Date(),
      generatedBy: 'system',
      data: {
        totalRecords: reports.reduce((sum, report) => sum + report.data.totalRecords, 0),
        processedRequests: reports.reduce((sum, report) => sum + report.data.processedRequests, 0),
        breaches: reports.reduce((sum, report) => sum + report.data.breaches, 0),
        complianceScore: this.calculateOverallComplianceScore(reports),
        recommendations: this.consolidateRecommendations(reports)
      }
    };

    return combinedReport;
  }

  async handleDataBreach(incident: Omit<BreachIncident, 'id' | 'detectedAt' | 'status'>): Promise<BreachIncident> {
    this.logger.warn(`Handling data breach: ${incident.type}, severity: ${incident.severity}`);
    
    const breach: BreachIncident = {
      ...incident,
      id: `breach_${Date.now()}`,
      detectedAt: new Date(),
      status: 'detected',
      complianceImpact: this.determineComplianceImpact(incident)
    };

    // Handle breach based on compliance requirements
    for (const complianceType of breach.complianceImpact) {
      switch (complianceType) {
        case 'GDPR':
          if (this.config.gdpr.enabled) {
            await this.gdprService.detectDataBreach(breach);
          }
          break;
        case 'HIPAA':
          if (this.config.hipaa.enabled) {
            await this.hipaaService.detectHealthDataBreach(breach);
          }
          break;
        case 'SOX':
          if (this.config.sox.enabled) {
            await this.soxService.logDataAccess(
              'system',
              'breach_incident',
              breach.id,
              'breach_detected',
              { breachType: breach.type, severity: breach.severity }
            );
          }
          break;
      }
    }

    // Log comprehensive breach event
    await this.logComplianceEvent('breach_detected', breach, {
      complianceImpact: breach.complianceImpact,
      severity: breach.severity
    });

    return breach;
  }

  async validateCompliance(
    data: PersonalData | Record<string, unknown>,
    context: { type: string; action: string; userId: string }
  ): Promise<boolean> {
    this.logger.log(`Validating compliance for ${context.type} data, action: ${context.action}`);
    
    let isValid = true;

    // GDPR validation
    if (this.config.gdpr.enabled && this.isPersonalData(data)) {
      // Check consent requirements
      if (this.config.gdpr.consentRequired) {
        const hasConsent = await this.checkConsent(context.userId, context.action);
        if (!hasConsent) {
          this.logger.warn(`GDPR consent validation failed for user: ${context.userId}`);
          isValid = false;
        }
      }
    }

    // SOX validation
    if (this.config.sox.enabled && this.isFinancialData(data)) {
      const segregationValid = await this.soxService.validateSegregationOfDuties(
        context.userId,
        context.action,
        context.type
      );
      if (!segregationValid) {
        this.logger.warn(`SOX segregation of duties validation failed for user: ${context.userId}`);
        isValid = false;
      }
    }

    // HIPAA validation
    if (this.config.hipaa.enabled && this.isHealthData(data)) {
      const healthData = data as PersonalData;
      const accessValid = await this.hipaaService.validateAccess(
        context.userId,
        context.type,
        context.action,
        healthData
      );
      if (!accessValid) {
        this.logger.warn(`HIPAA access validation failed for user: ${context.userId}`);
        isValid = false;
      }
    }

    return isValid;
  }

  async getComplianceStatus(): Promise<{
    gdpr: { enabled: boolean; status: 'active' | 'inactive' };
    sox: { enabled: boolean; status: 'active' | 'inactive' };
    hipaa: { enabled: boolean; status: 'active' | 'inactive' };
    audit: { enabled: boolean; logLevel: string };
  }> {
    return {
      gdpr: {
        enabled: this.config.gdpr.enabled,
        status: this.gdprService.isEnabled() ? 'active' : 'inactive'
      },
      sox: {
        enabled: this.config.sox.enabled,
        status: this.soxService.isEnabled() ? 'active' : 'inactive'
      },
      hipaa: {
        enabled: this.config.hipaa.enabled,
        status: this.hipaaService.isEnabled() ? 'active' : 'inactive'
      },
      audit: {
        enabled: this.config.audit.enabled,
        logLevel: this.config.audit.logLevel
      }
    };
  }

  private getApplicableComplianceTypes(dataType: string): string[] {
    const types: string[] = [];
    
    if (this.isPersonalData({ type: dataType })) {
      types.push('GDPR');
    }
    
    if (this.isFinancialData({ type: dataType })) {
      types.push('SOX');
    }
    
    if (this.isHealthData({ type: dataType })) {
      types.push('HIPAA');
    }
    
    return types;
  }

  private isPersonalData(data: { type?: string }): boolean {
    return data.type === 'personal' || data.type === 'sensitive';
  }

  private isFinancialData(data: { type?: string; purpose?: string | string[] }): boolean {
    const purpose = Array.isArray(data.purpose) ? data.purpose.join(' ') : data.purpose || '';
    return data.type === 'financial' || purpose.includes('financial');
  }

  private isHealthData(data: { type?: string; purpose?: string | string[] }): boolean {
    const purpose = Array.isArray(data.purpose) ? data.purpose.join(' ') : data.purpose || '';
    return data.type === 'health' || purpose.includes('health') || purpose.includes('medical');
  }

  private calculateOverallComplianceScore(reports: ComplianceReport[]): number {
    if (reports.length === 0) return 0;
    
    const totalScore = reports.reduce((sum, report) => sum + report.data.complianceScore, 0);
    return Math.round(totalScore / reports.length);
  }

  private consolidateRecommendations(reports: ComplianceReport[]): string[] {
    const allRecommendations = reports.flatMap(report => report.data.recommendations);
    return [...new Set(allRecommendations)]; // Remove duplicates
  }

  private determineComplianceImpact(incident: Omit<BreachIncident, 'id' | 'detectedAt' | 'status'>): ('GDPR' | 'SOX' | 'HIPAA')[] {
    const impact: ('GDPR' | 'SOX' | 'HIPAA')[] = [];
    
    if (incident.affectedRecords > 0) {
      impact.push('GDPR'); // Any data breach affects GDPR
    }
    
    if (incident.description?.toLowerCase().includes('health') || 
        incident.description?.toLowerCase().includes('medical')) {
      impact.push('HIPAA');
    }
    
    if (incident.description?.toLowerCase().includes('financial') ||
        incident.description?.toLowerCase().includes('payment')) {
      impact.push('SOX');
    }
    
    return impact.length > 0 ? impact : ['GDPR'];
  }

  private async checkConsent(_userId: string, _action: string): Promise<boolean> {
    // Simulate consent check
    return true;
  }

  private async logComplianceEvent(
    event: string,
    data: unknown,
    context: Record<string, unknown>
  ): Promise<void> {
    this.logger.debug(`Compliance event logged: ${event}`, { data, context });
  }

  getConfig(): ComplianceConfig {
    return this.config;
  }
}
