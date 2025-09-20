import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  PaymentRequest, 
  ComplianceResult,
  ComplianceOptions
} from '../interfaces/payment-options.interface';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly configService: ConfigService) {}

  async validatePayment(request: PaymentRequest): Promise<ComplianceResult> {
    try {
      this.logger.log(`Validating payment compliance: ${request.amount} ${request.currency}`);

      const result: ComplianceResult = {
        pciCompliant: true,
        threeDSecure: await this.validateThreeDSecure(request),
        sca: await this.validateSCA(request),
        dataRetention: await this.validateDataRetention(request)
      };

      this.logger.log('Payment compliance validation complete');
      return result;

    } catch (error) {
      this.logger.error(`Compliance validation failed: ${error.message}`, error.stack);
      
      // Return safe default on error
      return {
        pciCompliant: false,
        threeDSecure: {
          status: 'not_required',
          version: '2.0'
        },
        sca: {
          status: 'not_required',
          method: 'none'
        },
        dataRetention: {
          enabled: false,
          expiresAt: new Date()
        }
      };
    }
  }

  private async validateThreeDSecure(request: PaymentRequest): Promise<ComplianceResult['threeDSecure']> {
    const threeDSecureEnabled = request.complianceOptions?.threeDSecure || 
                               this.configService.get<boolean>('PAYMENT_3DS_ENABLED', false);

    if (!threeDSecureEnabled) {
      return {
        status: 'not_required',
        version: '2.0'
      };
    }

    // Simulate 3DS validation
    const isRequired = this.isThreeDSecureRequired(request);
    
    if (!isRequired) {
      return {
        status: 'not_required',
        version: '2.0'
      };
    }

    // Simulate 3DS challenge
    const challengeResult = await this.simulateThreeDSecureChallenge(request);
    
    return {
      status: challengeResult ? 'success' : 'failed',
      version: '2.0',
      transactionId: challengeResult ? `3ds_${Date.now()}` : undefined
    };
  }

  private async validateSCA(request: PaymentRequest): Promise<ComplianceResult['sca']> {
    const scaEnabled = request.complianceOptions?.sca || 
                      this.configService.get<boolean>('PAYMENT_SCA_ENABLED', false);

    if (!scaEnabled) {
      return {
        status: 'not_required',
        method: 'none'
      };
    }

    // Simulate SCA validation
    const isRequired = this.isSCARequired(request);
    
    if (!isRequired) {
      return {
        status: 'not_required',
        method: 'none'
      };
    }

    // Simulate SCA challenge
    const challengeResult = await this.simulateSCAChallenge(request);
    
    return {
      status: challengeResult ? 'success' : 'failed',
      method: 'sms' // or 'email', 'app', etc.
    };
  }

  private async validateDataRetention(request: PaymentRequest): Promise<ComplianceResult['dataRetention']> {
    const dataRetentionEnabled = request.complianceOptions?.dataRetention?.enabled || 
                                this.configService.get<boolean>('PAYMENT_DATA_RETENTION_ENABLED', true);

    if (!dataRetentionEnabled) {
      return {
        enabled: false,
        expiresAt: new Date()
      };
    }

    const retentionPeriodDays = request.complianceOptions?.dataRetention?.periodDays || 
                               this.configService.get<number>('PAYMENT_DATA_RETENTION_DAYS', 365);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionPeriodDays);

    return {
      enabled: true,
      expiresAt
    };
  }

  private isThreeDSecureRequired(request: PaymentRequest): boolean {
    // 3DS is typically required for:
    // - Card payments above certain thresholds
    // - High-risk countries
    // - New customers
    // - Specific merchant categories

    if (request.paymentMethod.type !== 'card') {
      return false;
    }

    // Amount threshold (e.g., > $50)
    if (request.amount > 5000) { // $50 in cents
      return true;
    }

    // High-risk countries
    const highRiskCountries = ['CN', 'RU', 'BR', 'IN'];
    if (request.customer?.address?.country && 
        highRiskCountries.includes(request.customer.address.country)) {
      return true;
    }

    // New customer (simplified check)
    if (!request.customer?.id || request.customer.id.startsWith('new_')) {
      return true;
    }

    return false;
  }

  private isSCARequired(request: PaymentRequest): boolean {
    // SCA is required for:
    // - European customers (PSD2 regulation)
    // - High-value transactions
    // - Card-not-present transactions

    // European countries (simplified list)
    const europeanCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
    
    if (request.customer?.address?.country && 
        europeanCountries.includes(request.customer.address.country)) {
      return true;
    }

    // High-value transactions (> €30)
    if (request.amount > 3000) { // €30 in cents
      return true;
    }

    // Card-not-present (online) transactions
    if (request.paymentMethod.type === 'card' && !request.metadata?.card_present) {
      return true;
    }

    return false;
  }

  private async simulateThreeDSecureChallenge(request: PaymentRequest): Promise<boolean> {
    // Simulate 3DS challenge with 90% success rate
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
    return Math.random() > 0.1; // 90% success rate
  }

  private async simulateSCAChallenge(request: PaymentRequest): Promise<boolean> {
    // Simulate SCA challenge with 95% success rate
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
    return Math.random() > 0.05; // 95% success rate
  }

  // Method to check PCI compliance requirements
  async checkPCICompliance(): Promise<{
    level: string;
    requirements: string[];
    compliant: boolean;
  }> {
    const pciLevel = this.configService.get<string>('PAYMENT_PCI_LEVEL', '3');
    
    const requirements = this.getPCIRequirements(pciLevel);
    const compliant = this.validatePCIRequirements(requirements);

    return {
      level: pciLevel,
      requirements,
      compliant
    };
  }

  private getPCIRequirements(level: string): string[] {
    const baseRequirements = [
      'Install and maintain a firewall configuration',
      'Do not use vendor-supplied defaults for system passwords',
      'Protect stored cardholder data',
      'Encrypt transmission of cardholder data across open networks',
      'Use and regularly update anti-virus software',
      'Develop and maintain secure systems and applications',
      'Restrict access to cardholder data by business need-to-know',
      'Assign a unique ID to each person with computer access',
      'Restrict physical access to cardholder data',
      'Track and monitor all access to network resources and cardholder data',
      'Regularly test security systems and processes',
      'Maintain a policy that addresses information security'
    ];

    if (level === '1') {
      return [
        ...baseRequirements,
        'Annual Report on Compliance (ROC) by Qualified Security Assessor (QSA)',
        'Quarterly network scan by Approved Scanning Vendor (ASV)',
        'Penetration testing by QSA or Internal Security Team',
        'Internal vulnerability scans'
      ];
    }

    return baseRequirements;
  }

  private validatePCIRequirements(requirements: string[]): boolean {
    // In a real implementation, this would check actual compliance status
    // For demo purposes, return true
    return true;
  }

  // Method to get compliance status for a payment
  async getPaymentComplianceStatus(paymentId: string): Promise<{
    pciCompliant: boolean;
    threeDSecure: boolean;
    sca: boolean;
    dataRetention: boolean;
    lastChecked: Date;
  }> {
    // In a real implementation, this would query the database
    return {
      pciCompliant: true,
      threeDSecure: true,
      sca: true,
      dataRetention: true,
      lastChecked: new Date()
    };
  }
}
