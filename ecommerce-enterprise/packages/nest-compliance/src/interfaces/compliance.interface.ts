export interface ComplianceConfig {
  gdpr: GDPRConfig;
  sox: SOXConfig;
  hipaa: HIPAAConfig;
  audit: AuditConfig;
}

export interface GDPRConfig {
  enabled: boolean;
  dataRetentionDays: number;
  consentRequired: boolean;
  rightToBeForgotten: boolean;
  dataPortability: boolean;
  privacyByDesign: boolean;
  encryption: {
    enabled: boolean;
    algorithm: string;
    keyRotationDays: number;
  };
  consentManagement: {
    enabled: boolean;
    consentTypes: string[];
    expirationDays: number;
  };
}

export interface SOXConfig {
  enabled: boolean;
  auditTrail: boolean;
  dataIntegrity: boolean;
  accessControls: boolean;
  changeManagement: boolean;
  financialControls: {
    enabled: boolean;
    approvalWorkflow: boolean;
    segregationOfDuties: boolean;
  };
  auditLogging: {
    enabled: boolean;
    retentionDays: number;
    immutable: boolean;
  };
}

export interface HIPAAConfig {
  enabled: boolean;
  encryption: {
    enabled: boolean;
    algorithm: string;
    keyManagement: string;
  };
  accessControls: {
    enabled: boolean;
    roleBasedAccess: boolean;
    multiFactorAuth: boolean;
  };
  auditLogging: {
    enabled: boolean;
    retentionDays: number;
    detailedLogging: boolean;
  };
  dataMinimization: boolean;
  breachNotification: boolean;
}

export interface AuditConfig {
  enabled: boolean;
  logLevel: 'minimal' | 'standard' | 'detailed';
  retentionDays: number;
  immutable: boolean;
  realTimeAlerting: boolean;
  complianceReporting: boolean;
}

export interface PersonalData {
  id: string;
  type: 'personal' | 'sensitive' | 'financial' | 'health';
  data: Record<string, any>;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
  consentGiven: boolean;
  consentDate?: Date;
  retentionExpiry?: Date;
  encrypted: boolean;
  source: string;
  purpose: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: string;
  granted: boolean;
  grantedAt: Date;
  expiresAt?: Date;
  purpose: string;
  dataTypes: string[];
  withdrawalAt?: Date;
  ipAddress: string;
  userAgent: string;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  complianceType: 'GDPR' | 'SOX' | 'HIPAA' | 'GENERAL';
  severity: 'low' | 'medium' | 'high' | 'critical';
  hash: string;
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  requestType: 'access' | 'portability' | 'rectification' | 'erasure' | 'restriction';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  processedAt?: Date;
  data: Record<string, any>;
  reason?: string;
  responseData?: Record<string, any>;
}

export interface BreachIncident {
  id: string;
  type: 'data_breach' | 'security_incident' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  reportedAt?: Date;
  affectedRecords: number;
  affectedUsers: string[];
  description: string;
  rootCause: string;
  mitigationActions: string[];
  status: 'detected' | 'investigating' | 'contained' | 'resolved';
  complianceImpact: ('GDPR' | 'SOX' | 'HIPAA')[];
}

export interface ComplianceReport {
  id: string;
  type: 'GDPR' | 'SOX' | 'HIPAA' | 'GENERAL';
  period: {
    start: Date;
    end: Date;
  };
  status: 'draft' | 'review' | 'approved' | 'published';
  generatedAt: Date;
  generatedBy: string;
  data: {
    totalRecords: number;
    processedRequests: number;
    breaches: number;
    complianceScore: number;
    recommendations: string[];
  };
  filePath?: string;
}
