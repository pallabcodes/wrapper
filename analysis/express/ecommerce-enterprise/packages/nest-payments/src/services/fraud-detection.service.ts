import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  PaymentRequest, 
  FraudResult, 
  FraudRule, 
  FraudCondition,
  FraudThresholds
} from '../interfaces/payment-options.interface';

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);
  private fraudRules: FraudRule[] = [];
  private thresholds: FraudThresholds;

  constructor(private readonly configService: ConfigService) {
    this.initializeFraudRules();
    this.initializeThresholds();
  }

  async analyzePayment(request: PaymentRequest): Promise<FraudResult> {
    try {
      this.logger.log(`Analyzing payment for fraud: ${request.amount} ${request.currency}`);

      let riskScore = 0;
      const triggeredRules: string[] = [];

      // Apply fraud rules
      for (const rule of this.fraudRules) {
        if (!rule.enabled) continue;

        const ruleScore = this.evaluateRule(rule, request);
        if (ruleScore > 0) {
          riskScore += ruleScore;
          triggeredRules.push(rule.id);
          this.logger.debug(`Fraud rule triggered: ${rule.name} (score: ${ruleScore})`);
        }
      }

      // Determine risk level and recommended action
      const riskLevel = this.determineRiskLevel(riskScore);
      const recommendedAction = this.determineRecommendedAction(riskScore);

      const result: FraudResult = {
        riskScore: Math.min(riskScore, 100), // Cap at 100
        riskLevel,
        triggeredRules,
        recommendedAction,
        analysisData: {
          totalRules: this.fraudRules.length,
          enabledRules: this.fraudRules.filter(r => r.enabled).length,
          triggeredRulesCount: triggeredRules.length,
          analysisTimestamp: new Date().toISOString()
        }
      };

      this.logger.log(`Fraud analysis complete: ${riskLevel} risk (score: ${riskScore})`);
      return result;

    } catch (error) {
      this.logger.error(`Fraud analysis failed: ${error.message}`, error.stack);
      
      // Return safe default on error
      return {
        riskScore: 0,
        riskLevel: 'low',
        triggeredRules: [],
        recommendedAction: 'allow',
        analysisData: {
          error: error.message,
          analysisTimestamp: new Date().toISOString()
        }
      };
    }
  }

  private evaluateRule(rule: FraudRule, request: PaymentRequest): number {
    let ruleScore = 0;

    for (const condition of rule.conditions) {
      if (this.evaluateCondition(condition, request)) {
        ruleScore += condition.weight;
      }
    }

    return ruleScore;
  }

  private evaluateCondition(condition: FraudCondition, request: PaymentRequest): boolean {
    const fieldValue = this.getFieldValue(condition.field, request);
    
    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      
      case 'not_equals':
        return fieldValue !== condition.value;
      
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      
      case 'regex':
        const regex = new RegExp(condition.value);
        return regex.test(String(fieldValue));
      
      default:
        return false;
    }
  }

  private getFieldValue(field: string, request: PaymentRequest): any {
    const fieldParts = field.split('.');
    let value: any = request;

    for (const part of fieldParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private determineRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= this.thresholds.block) {
      return 'critical';
    } else if (riskScore >= this.thresholds.review) {
      return 'high';
    } else if (riskScore >= this.thresholds.allow) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private determineRecommendedAction(riskScore: number): 'allow' | 'review' | 'block' {
    if (riskScore >= this.thresholds.block) {
      return 'block';
    } else if (riskScore >= this.thresholds.review) {
      return 'review';
    } else {
      return 'allow';
    }
  }

  private initializeFraudRules(): void {
    this.fraudRules = [
      // High amount rule
      {
        id: 'high_amount',
        name: 'High Amount Transaction',
        description: 'Flag transactions above $1000',
        conditions: [
          {
            field: 'amount',
            operator: 'greater_than',
            value: 100000, // $1000 in cents
            weight: 20
          }
        ],
        action: 'review',
        priority: 1,
        enabled: true
      },
      // Multiple currencies rule
      {
        id: 'multiple_currencies',
        name: 'Multiple Currency Usage',
        description: 'Flag if customer uses multiple currencies',
        conditions: [
          {
            field: 'currency',
            operator: 'not_equals',
            value: 'USD',
            weight: 10
          }
        ],
        action: 'allow',
        priority: 2,
        enabled: true
      },
      // Card number pattern rule
      {
        id: 'card_pattern',
        name: 'Suspicious Card Pattern',
        description: 'Flag cards with suspicious patterns',
        conditions: [
          {
            field: 'paymentMethod.details.number',
            operator: 'regex',
            value: '^(4{4}|5{4}|6{4})', // Repeated digits
            weight: 30
          }
        ],
        action: 'block',
        priority: 1,
        enabled: true
      },
      // Email domain rule
      {
        id: 'suspicious_email',
        name: 'Suspicious Email Domain',
        description: 'Flag suspicious email domains',
        conditions: [
          {
            field: 'customer.email',
            operator: 'contains',
            value: 'temp-mail',
            weight: 25
          }
        ],
        action: 'review',
        priority: 2,
        enabled: true
      },
      // Rapid transactions rule
      {
        id: 'rapid_transactions',
        name: 'Rapid Transaction Pattern',
        description: 'Flag rapid successive transactions',
        conditions: [
          {
            field: 'metadata.rapid_transaction',
            operator: 'equals',
            value: 'true',
            weight: 35
          }
        ],
        action: 'block',
        priority: 1,
        enabled: true
      },
      // Geographic anomaly rule
      {
        id: 'geo_anomaly',
        name: 'Geographic Anomaly',
        description: 'Flag transactions from unusual locations',
        conditions: [
          {
            field: 'customer.address.country',
            operator: 'not_equals',
            value: 'US',
            weight: 15
          }
        ],
        action: 'review',
        priority: 3,
        enabled: true
      }
    ];
  }

  private initializeThresholds(): void {
    this.thresholds = {
      block: 50,    // Block if risk score >= 50
      review: 25,   // Review if risk score >= 25
      allow: 10     // Allow if risk score < 10
    };
  }

  // Method to add custom fraud rules
  addFraudRule(rule: FraudRule): void {
    this.fraudRules.push(rule);
    this.logger.log(`Added custom fraud rule: ${rule.name}`);
  }

  // Method to update fraud thresholds
  updateThresholds(thresholds: Partial<FraudThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    this.logger.log('Updated fraud detection thresholds');
  }

  // Method to get current fraud rules
  getFraudRules(): FraudRule[] {
    return [...this.fraudRules];
  }

  // Method to get current thresholds
  getThresholds(): FraudThresholds {
    return { ...this.thresholds };
  }
}
