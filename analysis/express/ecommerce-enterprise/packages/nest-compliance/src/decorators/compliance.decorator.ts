import { SetMetadata } from '@nestjs/common';

export const COMPLIANCE_METADATA_KEY = 'compliance';

export interface ComplianceOptions {
  gdpr?: {
    required: boolean;
    consentRequired?: boolean;
    dataRetention?: number;
    encryption?: boolean;
  };
  sox?: {
    required: boolean;
    auditTrail?: boolean;
    segregationOfDuties?: boolean;
    financialControls?: boolean;
  };
  hipaa?: {
    required: boolean;
    encryption?: boolean;
    accessControls?: boolean;
    dataMinimization?: boolean;
  };
  audit?: {
    required: boolean;
    logLevel?: 'minimal' | 'standard' | 'detailed';
    immutable?: boolean;
  };
}

export function Compliance(options: ComplianceOptions) {
  return SetMetadata(COMPLIANCE_METADATA_KEY, options);
}

export function GDPRRequired(options?: Partial<ComplianceOptions['gdpr']>) {
  return Compliance({
    gdpr: {
      required: true,
      consentRequired: true,
      dataRetention: 2555, // 7 years
      encryption: true,
      ...options
    }
  });
}

export function SOXRequired(options?: Partial<ComplianceOptions['sox']>) {
  return Compliance({
    sox: {
      required: true,
      auditTrail: true,
      segregationOfDuties: true,
      financialControls: true,
      ...options
    }
  });
}

export function HIPAARequired(options?: Partial<ComplianceOptions['hipaa']>) {
  return Compliance({
    hipaa: {
      required: true,
      encryption: true,
      accessControls: true,
      dataMinimization: true,
      ...options
    }
  });
}

export function AuditRequired(options?: Partial<ComplianceOptions['audit']>) {
  return Compliance({
    audit: {
      required: true,
      logLevel: 'detailed',
      immutable: true,
      ...options
    }
  });
}
