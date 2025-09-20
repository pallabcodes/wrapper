import { Controller, Get, Post, HttpCode, HttpStatus, UseGuards, UseInterceptors } from '@nestjs/common';
import { ComplianceDemoService } from './compliance-demo.service';
import { 
  ComplianceGuard, 
  ComplianceInterceptor,
  GDPRRequired,
  SOXRequired,
  HIPAARequired,
  AuditRequired
} from '@ecommerce-enterprise/nest-compliance';

@Controller('compliance-demo')
@UseGuards(ComplianceGuard)
@UseInterceptors(ComplianceInterceptor)
export class ComplianceDemoController {
  private complianceDemoService: ComplianceDemoService;

  constructor() {
    console.log('ComplianceDemoController constructor called');
    // Create service instance directly as workaround for DI issue
    this.complianceDemoService = new ComplianceDemoService();
    console.log('ComplianceDemoService created directly:', !!this.complianceDemoService);
  }

  @Get('status')
  async getStatus() {
    try {
      return await this.complianceDemoService.getComplianceStatus();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('gdpr')
  @GDPRRequired()
  async demonstrateGDPR() {
    try {
      return await this.complianceDemoService.demonstrateGDPRFeatures();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('sox')
  @SOXRequired()
  async demonstrateSOX() {
    try {
      return await this.complianceDemoService.demonstrateSOXFeatures();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('hipaa')
  @HIPAARequired()
  async demonstrateHIPAA() {
    try {
      return await this.complianceDemoService.demonstrateHIPAAFeatures();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('breach-handling')
  @AuditRequired()
  async demonstrateBreachHandling() {
    try {
      return await this.complianceDemoService.demonstrateDataBreachHandling();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('reports')
  @AuditRequired()
  async generateReports() {
    try {
      return await this.complianceDemoService.generateComplianceReports();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('configuration')
  async getConfiguration() {
    try {
      return await this.complianceDemoService.getComplianceConfiguration();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Post('test-compliance')
  @GDPRRequired({ consentRequired: true })
  @SOXRequired({ auditTrail: true })
  @AuditRequired({ logLevel: 'detailed' })
  async testCompliance() {
    try {
      return {
        success: true,
        message: 'Compliance validation passed',
        timestamp: new Date().toISOString(),
        complianceChecks: {
          gdpr: 'passed',
          sox: 'passed',
          audit: 'passed'
        }
      };
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
}
