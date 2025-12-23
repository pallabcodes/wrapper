/**
 * Advanced Fraud Detection Service
 * 
 * Enterprise-grade fraud detection with machine learning,
 * behavioral analysis, and real-time risk assessment.
 */

import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';

// Fraud Detection Schemas
export const FraudDetectionConfigSchema = z.object({
  enabled: z.boolean().default(true),
  riskThreshold: z.number().min(0).max(1).default(0.7),
  maxDailyAmount: z.number().positive().default(50000),
  maxDailyTransactions: z.number().int().positive().default(100),
  geoBlocking: z.boolean().default(true),
  deviceFingerprinting: z.boolean().default(true),
  behavioralAnalysis: z.boolean().default(true),
  machineLearning: z.boolean().default(true),
  customRules: z.array(z.string()).optional(),
});

export const RiskAssessmentSchema = z.object({
  paymentId: z.string().uuid(),
  userId: z.string().uuid(),
  riskScore: z.number().min(0).max(1),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  riskFactors: z.array(z.object({
    factor: z.string(),
    weight: z.number().min(0).max(1),
    description: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  recommendation: z.enum(['APPROVE', 'REVIEW', 'DECLINE', 'CHALLENGE']),
  confidence: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export const BehavioralPatternSchema = z.object({
  userId: z.string().uuid(),
  pattern: z.enum(['NORMAL', 'SUSPICIOUS', 'ANOMALOUS']),
  confidence: z.number().min(0).max(1),
  factors: z.array(z.object({
    behavior: z.string(),
    score: z.number().min(0).max(1),
    description: z.string(),
  })),
  lastUpdated: z.string().datetime(),
});

// Risk Assessment Result Interface
export interface RiskAssessmentResult {
  paymentId: string;
  userId: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: Array<{
    factor: string;
    weight: number;
    description: string;
    confidence: number;
  }>;
  recommendation: 'APPROVE' | 'REVIEW' | 'DECLINE' | 'CHALLENGE';
  confidence: number;
  timestamp: Date;
  expiresAt: Date;
}

// Behavioral Pattern Interface
export interface BehavioralPattern {
  userId: string;
  pattern: 'NORMAL' | 'SUSPICIOUS' | 'ANOMALOUS';
  confidence: number;
  factors: Array<{
    behavior: string;
    score: number;
    description: string;
  }>;
  lastUpdated: Date;
}

// Device Fingerprint Interface
export interface DeviceFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: boolean;
  fingerprint: string;
}

// Geographic Risk Interface
export interface GeographicRisk {
  country: string;
  region: string;
  city: string;
  riskScore: number;
  riskFactors: string[];
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);
  private readonly riskCache = new Map<string, RiskAssessmentResult>();
  private readonly behavioralPatterns = new Map<string, BehavioralPattern>();
  private readonly deviceFingerprints = new Map<string, DeviceFingerprint>();
  private readonly blockedIPs = new Set<string>();
  private readonly blockedEmails = new Set<string>();
  private readonly blockedCountries = new Set<string>();

  constructor() {
    this.initializeBlockedLists();
  }

  /**
   * Perform comprehensive fraud detection assessment
   */
  async assessFraudRisk(
    paymentData: {
      amount: number;
      currency: string;
      customerEmail: string;
      billingAddress?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    },
    context: {
      userId: string;
      ipAddress: string;
      userAgent?: string;
      deviceFingerprint?: DeviceFingerprint;
      sessionId?: string;
    },
    config: z.infer<typeof FraudDetectionConfigSchema>
  ): Promise<RiskAssessmentResult> {
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cacheKey = `${context.userId}_${context.ipAddress}_${paymentData.amount}`;

    // Check cache first
    if (this.riskCache.has(cacheKey)) {
      const cached = this.riskCache.get(cacheKey)!;
      if (cached.expiresAt > new Date()) {
        return cached;
      }
      this.riskCache.delete(cacheKey);
    }

    const riskFactors: Array<{
      factor: string;
      weight: number;
      description: string;
      confidence: number;
    }> = [];

    let totalRiskScore = 0;

    // 1. Amount-based risk assessment
    const amountRisk = this.assessAmountRisk(paymentData.amount, config);
    if (amountRisk.score > 0) {
      riskFactors.push(amountRisk);
      totalRiskScore += amountRisk.weight * amountRisk.score;
    }

    // 2. Velocity-based risk assessment
    const velocityRisk = await this.assessVelocityRisk(context.userId, paymentData.customerEmail);
    if (velocityRisk.score > 0) {
      riskFactors.push(velocityRisk);
      totalRiskScore += velocityRisk.weight * velocityRisk.score;
    }

    // 3. Geographic risk assessment
    if (config.geoBlocking) {
      const geoRisk = await this.assessGeographicRisk(context.ipAddress, paymentData.billingAddress);
      if (geoRisk.score > 0) {
        riskFactors.push(geoRisk);
        totalRiskScore += geoRisk.weight * geoRisk.score;
      }
    }

    // 4. Device fingerprinting risk
    if (config.deviceFingerprinting && context.deviceFingerprint) {
      const deviceRisk = this.assessDeviceRisk(context.deviceFingerprint);
      if (deviceRisk.score > 0) {
        riskFactors.push(deviceRisk);
        totalRiskScore += deviceRisk.weight * deviceRisk.score;
      }
    }

    // 5. Behavioral analysis
    if (config.behavioralAnalysis) {
      const behaviorRisk = await this.assessBehavioralRisk(context.userId, paymentData);
      if (behaviorRisk.score > 0) {
        riskFactors.push(behaviorRisk);
        totalRiskScore += behaviorRisk.weight * behaviorRisk.score;
      }
    }

    // 6. Email and domain risk
    const emailRisk = this.assessEmailRisk(paymentData.customerEmail);
    if (emailRisk.score > 0) {
      riskFactors.push(emailRisk);
      totalRiskScore += emailRisk.weight * emailRisk.score;
    }

    // 7. Machine learning risk assessment
    if (config.machineLearning) {
      const mlRisk = await this.assessMachineLearningRisk(paymentData, context);
      if (mlRisk.score > 0) {
        riskFactors.push(mlRisk);
        totalRiskScore += mlRisk.weight * mlRisk.score;
      }
    }

    // 8. Custom rules assessment
    if (config.customRules && config.customRules.length > 0) {
      const customRisk = await this.assessCustomRules(paymentData, context, config.customRules);
      if (customRisk.score > 0) {
        riskFactors.push(customRisk);
        totalRiskScore += customRisk.weight * customRisk.score;
      }
    }

    // Normalize risk score
    totalRiskScore = Math.min(totalRiskScore, 1);

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (totalRiskScore >= 0.9) {
      riskLevel = 'CRITICAL';
    } else if (totalRiskScore >= 0.7) {
      riskLevel = 'HIGH';
    } else if (totalRiskScore >= 0.4) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    // Determine recommendation
    let recommendation: 'APPROVE' | 'REVIEW' | 'DECLINE' | 'CHALLENGE';
    if (totalRiskScore >= config.riskThreshold) {
      if (totalRiskScore >= 0.9) {
        recommendation = 'DECLINE';
      } else if (totalRiskScore >= 0.8) {
        recommendation = 'CHALLENGE';
      } else {
        recommendation = 'REVIEW';
      }
    } else {
      recommendation = 'APPROVE';
    }

    // Calculate confidence based on risk factors
    const confidence = this.calculateConfidence(riskFactors);

    const result: RiskAssessmentResult = {
      paymentId,
      userId: context.userId,
      riskScore: totalRiskScore,
      riskLevel,
      riskFactors,
      recommendation,
      confidence,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };

    // Cache result
    this.riskCache.set(cacheKey, result);

    this.logger.log(`Fraud risk assessment completed: ${riskLevel} (${totalRiskScore.toFixed(3)}) - ${recommendation}`);

    return result;
  }

  /**
   * Assess amount-based risk
   */
  private assessAmountRisk(amount: number, config: z.infer<typeof FraudDetectionConfigSchema>) {
    let score = 0;
    let description = '';

    if (amount > config.maxDailyAmount) {
      score = 0.8;
      description = `Amount exceeds daily limit of $${config.maxDailyAmount}`;
    } else if (amount > config.maxDailyAmount * 0.8) {
      score = 0.6;
      description = `Amount approaches daily limit (${((amount / config.maxDailyAmount) * 100).toFixed(1)}%)`;
    } else if (amount > 10000) {
      score = 0.4;
      description = 'High-value transaction';
    } else if (amount > 5000) {
      score = 0.2;
      description = 'Medium-value transaction';
    }

    return {
      factor: 'AMOUNT_RISK',
      weight: 0.3,
      description,
      confidence: 0.9,
      score,
    };
  }

  /**
   * Assess velocity-based risk
   */
  private async assessVelocityRisk(userId: string, email: string) {
    // Mock velocity check - in production, this would query the database
    const recentTransactions = await this.getRecentTransactions(userId, email, 24);
    
    let score = 0;
    let description = '';

    if (recentTransactions.length > 20) {
      score = 0.9;
      description = 'Extremely high transaction velocity';
    } else if (recentTransactions.length > 10) {
      score = 0.7;
      description = 'High transaction velocity';
    } else if (recentTransactions.length > 5) {
      score = 0.4;
      description = 'Elevated transaction velocity';
    }

    return {
      factor: 'VELOCITY_RISK',
      weight: 0.25,
      description,
      confidence: 0.8,
      score,
    };
  }

  /**
   * Assess geographic risk
   */
  private async assessGeographicRisk(ipAddress: string, billingAddress?: Record<string, unknown>): Promise<{
    factor: string;
    weight: number;
    description: string;
    confidence: number;
    score: number;
  }> {
    // Mock geographic risk assessment
    const geoData = await this.getGeographicData(ipAddress);
    
    let score = 0;
    let description = '';

    // Check if IP is blocked
    if (this.blockedIPs.has(ipAddress)) {
      score = 1.0;
      description = 'IP address is blocked';
    }
    // Check if country is blocked
    else if (geoData.country && this.blockedCountries.has(geoData.country)) {
      score = 0.9;
      description = `Country ${geoData.country} is blocked`;
    }
    // Check for VPN/Proxy/Tor
    else if (geoData.isVPN || geoData.isProxy || geoData.isTor) {
      score = 0.7;
      description = 'Suspicious network (VPN/Proxy/Tor)';
    }
    // Check for high-risk countries
    else if (geoData.riskScore > 0.7) {
      score = geoData.riskScore;
      description = `High-risk geographic location (${geoData.country})`;
    }
    // Check for country mismatch
    else if (billingAddress?.country && geoData.country !== billingAddress.country) {
      score = 0.5;
      description = `IP country (${geoData.country}) differs from billing country (${billingAddress.country})`;
    }

    return {
      factor: 'GEOGRAPHIC_RISK',
      weight: 0.2,
      description,
      confidence: 0.85,
      score,
    };
  }

  /**
   * Assess device risk
   */
  private assessDeviceRisk(deviceFingerprint: DeviceFingerprint) {
    let score = 0;
    let description = '';

    // Check for suspicious user agent
    const suspiciousPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /headless/i, /phantom/i, /selenium/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(deviceFingerprint.userAgent)) {
        score = 0.8;
        description = 'Suspicious user agent detected';
        break;
      }
    }

    // Check for missing device characteristics
    if (!deviceFingerprint.screenResolution || !deviceFingerprint.timezone) {
      score = Math.max(score, 0.6);
      description = 'Incomplete device fingerprint';
    }

    // Check for Do Not Track
    if (deviceFingerprint.doNotTrack) {
      score = Math.max(score, 0.3);
      description = 'Do Not Track enabled';
    }

    return {
      factor: 'DEVICE_RISK',
      weight: 0.15,
      description,
      confidence: 0.7,
      score,
    };
  }

  /**
   * Assess behavioral risk
   */
  private async assessBehavioralRisk(userId: string, paymentData: Record<string, unknown>) {
    const pattern = this.behavioralPatterns.get(userId);
    
    if (!pattern) {
      return {
        factor: 'BEHAVIORAL_RISK',
        weight: 0.1,
        description: 'No behavioral pattern available',
        confidence: 0.5,
        score: 0.1,
      };
    }

    let score = 0;
    let description = '';

    if (pattern.pattern === 'ANOMALOUS') {
      score = 0.8;
      description = 'Anomalous behavioral pattern detected';
    } else if (pattern.pattern === 'SUSPICIOUS') {
      score = 0.5;
      description = 'Suspicious behavioral pattern detected';
    }

    return {
      factor: 'BEHAVIORAL_RISK',
      weight: 0.2,
      description,
      confidence: pattern.confidence,
      score,
    };
  }

  /**
   * Assess email risk
   */
  private assessEmailRisk(email: string) {
    let score = 0;
    let description = '';

    // Check if email is blocked
    if (this.blockedEmails.has(email)) {
      score = 1.0;
      description = 'Email address is blocked';
    }
    // Check for disposable email domains
    else if (this.isDisposableEmail(email)) {
      score = 0.7;
      description = 'Disposable email domain detected';
    }
    // Check for suspicious email patterns
    else if (this.hasSuspiciousEmailPattern(email)) {
      score = 0.5;
      description = 'Suspicious email pattern detected';
    }

    return {
      factor: 'EMAIL_RISK',
      weight: 0.1,
      description,
      confidence: 0.8,
      score,
    };
  }

  /**
   * Assess machine learning risk
   */
  private async assessMachineLearningRisk(paymentData: Record<string, unknown>, context: Record<string, unknown>) {
    // Mock ML risk assessment
    // In production, this would call a trained ML model
    const features = this.extractMLFeatures(paymentData, context);
    const mlScore = await this.predictFraudRisk(features);

    return {
      factor: 'ML_RISK',
      weight: 0.3,
      description: `ML model prediction: ${(mlScore * 100).toFixed(1)}% fraud risk`,
      confidence: 0.75,
      score: mlScore,
    };
  }

  /**
   * Assess custom rules
   */
  private async assessCustomRules(paymentData: Record<string, unknown>, context: Record<string, unknown>, customRules: string[]) {
    let score = 0;
    let description = '';

    // Mock custom rules evaluation
    for (const rule of customRules) {
      if (rule === 'weekend_high_amount' && this.isWeekend() && (paymentData.amount as number) > 5000) {
        score = Math.max(score, 0.6);
        description = 'High amount transaction on weekend';
      }
      // Add more custom rules as needed
    }

    return {
      factor: 'CUSTOM_RULES',
      weight: 0.1,
      description,
      confidence: 0.9,
      score,
    };
  }

  /**
   * Calculate confidence based on risk factors
   */
  private calculateConfidence(riskFactors: Array<{ confidence: number; weight: number }>): number {
    if (riskFactors.length === 0) return 0.5;

    const weightedSum = riskFactors.reduce((sum, factor) => sum + (factor.confidence * factor.weight), 0);
    const totalWeight = riskFactors.reduce((sum, factor) => sum + factor.weight, 0);

    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }

  /**
   * Helper methods
   */
  private async getRecentTransactions(userId: string, email: string, hours: number): Promise<any[]> {
    // Mock implementation - in production, this would query the database
    return [];
  }

  private async getGeographicData(ipAddress: string): Promise<GeographicRisk> {
    // Mock implementation - in production, this would use a geolocation service
    return {
      country: 'US',
      region: 'CA',
      city: 'San Francisco',
      riskScore: 0.1,
      riskFactors: [],
      isVPN: false,
      isProxy: false,
      isTor: false,
    };
  }

  private isDisposableEmail(email: string): boolean {
    const disposableDomains = [
      'tempmail.com', '10minutemail.com', 'guerrillamail.com',
      'mailinator.com', 'yopmail.com', 'temp-mail.org'
    ];
    const domain = email.split('@')[1];
    return disposableDomains.includes(domain);
  }

  private hasSuspiciousEmailPattern(email: string): boolean {
    // Check for suspicious patterns like random character sequences
    const suspiciousPatterns = [
      /^[a-z0-9]{10,}@/, // Random character sequences
      /[0-9]{6,}@/, // Long number sequences
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(email));
  }

  private extractMLFeatures(paymentData: Record<string, unknown>, context: Record<string, unknown>): number[] {
    // Extract features for ML model
    return [
      paymentData.amount as number,
      paymentData.currency === 'USD' ? 1 : 0,
      context.userAgent ? (context.userAgent as string).length : 0,
      // Add more features as needed
    ];
  }

  private async predictFraudRisk(features: number[]): Promise<number> {
    // Mock ML prediction - in production, this would call a trained model
    return Math.random() * 0.3; // Return a low risk score for demo
  }

  private isWeekend(): boolean {
    const day = new Date().getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  private initializeBlockedLists(): void {
    // Initialize blocked IPs, emails, and countries
    // In production, these would be loaded from a database or external service
    this.blockedIPs.add('192.168.1.100'); // Example blocked IP
    this.blockedEmails.add('fraud@example.com'); // Example blocked email
    this.blockedCountries.add('XX'); // Example blocked country code
  }
}
