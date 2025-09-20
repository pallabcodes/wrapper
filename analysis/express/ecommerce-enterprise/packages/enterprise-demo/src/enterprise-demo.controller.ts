import { Controller, Get, Post, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { EnterpriseDemoService } from './enterprise-demo.service';
import { TestService } from './test.service';

@Controller('enterprise-demo')
export class EnterpriseDemoController {
  private enterpriseDemoService: EnterpriseDemoService;
  private testService: TestService;

  constructor() {
    console.log('EnterpriseDemoController constructor called');
    // Create service instances directly as workaround for DI issue
    this.enterpriseDemoService = new EnterpriseDemoService();
    this.testService = new TestService();
    console.log('Services created directly:', {
      mainService: !!this.enterpriseDemoService,
      testService: !!this.testService
    });
  }

  @Get('health')
  async getHealth() {
    try {
      return await this.enterpriseDemoService.getSystemHealth();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('test')
  async test() {
    return {
      message: 'Test endpoint working',
      service: this.enterpriseDemoService ? 'available' : 'not available',
      testService: this.testService ? 'available' : 'not available',
      testServiceMessage: this.testService?.getMessage(),
      timestamp: new Date().toISOString()
    };
  }

  @Get('simple')
  async simple() {
    return { message: 'Simple endpoint working' };
  }

  @Get('stats')
  async getStats() {
    try {
      return await this.enterpriseDemoService.getIntegrationStats();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('sap')
  async demonstrateSAP() {
    try {
      return await this.enterpriseDemoService.demonstrateSAPIntegration();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('salesforce')
  async demonstrateSalesforce() {
    try {
      return await this.enterpriseDemoService.demonstrateSalesforceIntegration();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('sync')
  async demonstrateSync() {
    try {
      return await this.enterpriseDemoService.demonstrateDataSync();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('conflict-resolution')
  async demonstrateConflictResolution() {
    try {
      return await this.enterpriseDemoService.demonstrateConflictResolution();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('bulk')
  async demonstrateBulkOperations() {
    try {
      return await this.enterpriseDemoService.demonstrateBulkOperations();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Post('cache/clear')
  @HttpCode(HttpStatus.OK)
  async clearCache() {
    try {
      return await this.enterpriseDemoService.clearCache();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Post('circuit-breakers/reset')
  @HttpCode(HttpStatus.OK)
  async resetCircuitBreakers() {
    try {
      return await this.enterpriseDemoService.resetCircuitBreakers();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
}
