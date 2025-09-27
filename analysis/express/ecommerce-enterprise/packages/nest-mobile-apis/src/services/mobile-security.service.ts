import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  MobileDeviceInfo,
  MobileSecurityConfig,
} from '../interfaces/mobile-api.interface';

@Injectable()
export class MobileSecurityService {
  private readonly logger = new Logger(MobileSecurityService.name);
  private securityConfig: MobileSecurityConfig;
  private deviceSessions: Map<string, { lastSeen: Date; attempts: number }> = new Map();

  constructor(private configService: ConfigService) {
    this.securityConfig = this.configService.get<MobileSecurityConfig>('MOBILE_SECURITY_CONFIG') || {
      enableBiometrics: true,
      enablePinCode: true,
      enableFaceId: true,
      enableTouchId: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxLoginAttempts: 5,
      enableJailbreakDetection: true,
      enableRootDetection: true,
      enableSslPinning: true,
      allowedOrigins: ['https://api.ecommerce.com'],
      encryptionKey: 'default-encryption-key',
    };
  }

  async validateDevice(deviceInfo: MobileDeviceInfo): Promise<{
    isValid: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    issues: string[];
  }> {
    const issues: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check for jailbreak/root detection
    if (this.securityConfig.enableJailbreakDetection) {
      const jailbreakDetected = await this.detectJailbreak(deviceInfo);
      if (jailbreakDetected) {
        issues.push('Jailbroken device detected');
        riskLevel = 'high';
      }
    }

    if (this.securityConfig.enableRootDetection) {
      const rootDetected = await this.detectRoot(deviceInfo);
      if (rootDetected) {
        issues.push('Rooted device detected');
        riskLevel = 'high';
      }
    }

    // Check device capabilities
    if (!deviceInfo.capabilities.biometrics && this.securityConfig.enableBiometrics) {
      issues.push('Biometric authentication not available');
      riskLevel = 'medium';
    }

    // Check network security
    if (deviceInfo.networkType === 'cellular' && deviceInfo.connectionSpeed === 'slow') {
      issues.push('Using slow cellular connection');
      riskLevel = 'medium';
    }

    // Check for suspicious activity
    const deviceId = this.generateDeviceId(deviceInfo);
    const session = this.deviceSessions.get(deviceId);
    
    if (session) {
      const timeSinceLastSeen = Date.now() - session.lastSeen.getTime();
      if (timeSinceLastSeen < 1000) { // Less than 1 second
        issues.push('Suspicious rapid requests detected');
        riskLevel = 'high';
      }
    }

    return {
      isValid: issues.length === 0 || riskLevel !== 'high',
      riskLevel,
      issues,
    };
  }

  async authenticateUser(
    userId: string,
    credentials: {
      password?: string;
      pinCode?: string;
      biometricData?: string;
      faceIdData?: string;
      touchIdData?: string;
    },
    deviceInfo: MobileDeviceInfo,
  ): Promise<{
    success: boolean;
    token?: string;
    expiresAt?: Date;
    requiresMFA?: boolean;
    error?: string;
  }> {
    const deviceId = this.generateDeviceId(deviceInfo);
    const session = this.deviceSessions.get(deviceId);

    // Check for too many attempts
    if (session && session.attempts >= this.securityConfig.maxLoginAttempts) {
      return {
        success: false,
        error: 'Too many failed attempts. Please try again later.',
      };
    }

    try {
      // Simulate authentication logic
      const isAuthenticated = await this.performAuthentication(userId, credentials, deviceInfo);
      
      if (isAuthenticated) {
        const token = await this.generateSecureToken(userId, deviceId);
        const expiresAt = new Date(Date.now() + this.securityConfig.sessionTimeout);

        // Update session
        this.deviceSessions.set(deviceId, {
          lastSeen: new Date(),
          attempts: 0,
        });

        return {
          success: true,
          token,
          expiresAt,
          requiresMFA: this.requiresMFA(deviceInfo),
        };
      } else {
        // Increment failed attempts
        if (session) {
          session.attempts++;
          this.deviceSessions.set(deviceId, session);
        } else {
          this.deviceSessions.set(deviceId, {
            lastSeen: new Date(),
            attempts: 1,
          });
        }

        return {
          success: false,
          error: 'Invalid credentials',
        };
      }
    } catch (error) {
      this.logger.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  async validateToken(token: string, deviceInfo: MobileDeviceInfo): Promise<{
    isValid: boolean;
    userId?: string;
    expiresAt?: Date;
    error?: string;
  }> {
    try {
      const payload = this.verifyToken(token);
      const deviceId = this.generateDeviceId(deviceInfo);

      if (!payload || payload.deviceId !== deviceId) {
        return {
          isValid: false,
          error: 'Invalid token or device mismatch',
        };
      }

      if (payload.exp < Date.now() / 1000) {
        return {
          isValid: false,
          error: 'Token expired',
        };
      }

      return {
        isValid: true,
        userId: payload.userId,
        expiresAt: new Date(payload.exp * 1000),
      };
    } catch (error) {
      this.logger.error('Token validation error:', error);
      return {
        isValid: false,
        error: 'Token validation failed',
      };
    }
  }

  async encryptData(data: any, key?: string): Promise<string> {
    const encryptionKey = key || this.securityConfig.encryptionKey;
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  async decryptData(encryptedData: string, key?: string): Promise<any> {
    const encryptionKey = key || this.securityConfig.encryptionKey;
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  async generateSecureToken(userId: string, deviceId: string): Promise<string> {
    const payload = {
      userId,
      deviceId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (this.securityConfig.sessionTimeout / 1000),
    };

    return this.signToken(payload);
  }

  private async detectJailbreak(deviceInfo: MobileDeviceInfo): Promise<boolean> {
    // Simulate jailbreak detection logic
    // In a real implementation, this would check for jailbreak indicators
    const suspiciousIndicators = [
      deviceInfo.model?.includes('jailbreak'),
      deviceInfo.manufacturer?.includes('jailbreak'),
    ];

    return suspiciousIndicators.some(indicator => indicator);
  }

  private async detectRoot(deviceInfo: MobileDeviceInfo): Promise<boolean> {
    // Simulate root detection logic
    // In a real implementation, this would check for root indicators
    const suspiciousIndicators = [
      deviceInfo.model?.includes('root'),
      deviceInfo.manufacturer?.includes('root'),
    ];

    return suspiciousIndicators.some(indicator => indicator);
  }

  private async performAuthentication(
    _userId: string,
    credentials: any,
    deviceInfo: MobileDeviceInfo,
  ): Promise<boolean> {
    // Simulate authentication logic
    // In a real implementation, this would validate against a database
    
    // Check if device supports required authentication methods
    if (this.securityConfig.enableBiometrics && credentials.biometricData) {
      return deviceInfo.capabilities.biometrics;
    }

    if (this.securityConfig.enableFaceId && credentials.faceIdData) {
      return deviceInfo.capabilities.biometrics;
    }

    if (this.securityConfig.enableTouchId && credentials.touchIdData) {
      return deviceInfo.capabilities.biometrics;
    }

    // Fallback to password/pin authentication
    return !!(credentials.password || credentials.pinCode);
  }

  private requiresMFA(deviceInfo: MobileDeviceInfo): boolean {
    // Require MFA for high-risk devices or first-time logins
    return deviceInfo.connectionSpeed === 'slow' || 
           deviceInfo.networkType === 'cellular' ||
           !deviceInfo.capabilities.biometrics;
  }

  private generateDeviceId(deviceInfo: MobileDeviceInfo): string {
    const deviceString = `${deviceInfo.platform}-${deviceInfo.version}-${deviceInfo.model}-${deviceInfo.manufacturer}`;
    return crypto.createHash('sha256').update(deviceString).digest('hex');
  }

  private signToken(payload: any): string {
    // In a real implementation, use a proper JWT library
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', this.securityConfig.encryptionKey)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private verifyToken(token: string): any {
    try {
      const [header, payload, signature] = token.split('.');
      
      const expectedSignature = crypto
        .createHmac('sha256', this.securityConfig.encryptionKey)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }

      return JSON.parse(Buffer.from(payload || '', 'base64url').toString());
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getSecurityStats(): Promise<{
    activeSessions: number;
    blockedDevices: number;
    failedAttempts: number;
    riskLevels: {
      low: number;
      medium: number;
      high: number;
    };
  }> {
    const activeSessions = this.deviceSessions.size;
    const blockedDevices = Array.from(this.deviceSessions.values())
      .filter(session => session.attempts >= this.securityConfig.maxLoginAttempts).length;
    const failedAttempts = Array.from(this.deviceSessions.values())
      .reduce((total, session) => total + session.attempts, 0);

    return {
      activeSessions,
      blockedDevices,
      failedAttempts,
      riskLevels: {
        low: 0, // Would need to track this
        medium: 0,
        high: 0,
      },
    };
  }
}
