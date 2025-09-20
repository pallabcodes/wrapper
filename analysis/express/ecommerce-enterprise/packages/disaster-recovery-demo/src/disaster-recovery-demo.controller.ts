import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DisasterRecoveryDemoService } from './disaster-recovery-demo.service';

@Controller('disaster-recovery-demo')
export class DisasterRecoveryDemoController {
  private disasterRecoveryDemoService: DisasterRecoveryDemoService;

  constructor() {
    this.disasterRecoveryDemoService = new DisasterRecoveryDemoService();
    console.log('DisasterRecoveryDemoController constructor called');
    console.log('DisasterRecoveryDemoService injected:', !!this.disasterRecoveryDemoService);
  }

  @Get('status')
  async getOverallStatus() {
    try {
      return await this.disasterRecoveryDemoService.getOverallStatus();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('backup')
  async getBackupStatus() {
    try {
      return await this.disasterRecoveryDemoService.getBackupStatus();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('restore')
  async getRestoreStatus() {
    try {
      return await this.disasterRecoveryDemoService.getRestoreStatus();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('dr-plans')
  async getDisasterRecoveryPlans() {
    try {
      return await this.disasterRecoveryDemoService.getDisasterRecoveryPlans();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('business-continuity')
  async getBusinessContinuityStatus() {
    try {
      return await this.disasterRecoveryDemoService.getBusinessContinuityStatus();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('recommendations')
  async getRecoveryRecommendations() {
    try {
      return await this.disasterRecoveryDemoService.getRecoveryRecommendations();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('report')
  async generateDisasterRecoveryReport() {
    try {
      return await this.disasterRecoveryDemoService.generateDisasterRecoveryReport();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Post('test/:planId')
  @HttpCode(HttpStatus.OK)
  async testDisasterRecovery(
    @Param('planId') planId: string,
    @Body() body: { testType: string }
  ) {
    try {
      return await this.disasterRecoveryDemoService.testDisasterRecovery(planId, body.testType);
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Post('trigger/:planId')
  @HttpCode(HttpStatus.OK)
  async triggerDisasterRecovery(
    @Param('planId') planId: string,
    @Body() body: { incidentType: string }
  ) {
    try {
      return await this.disasterRecoveryDemoService.triggerDisasterRecovery(planId, body.incidentType);
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('metrics')
  async getMetrics() {
    try {
      const status = await this.disasterRecoveryDemoService.getOverallStatus();
      return {
        success: true,
        results: {
          overallHealth: status.results.overallHealth,
          backup: status.results.backup,
          restore: status.results.restore,
          disasterRecovery: status.results.disasterRecovery,
          businessContinuity: status.results.businessContinuity,
          lastUpdated: new Date()
        },
        message: 'Disaster recovery metrics retrieved successfully (simulated)'
      };
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('health')
  async getHealth() {
    try {
      return {
        success: true,
        results: {
          status: 'healthy',
          timestamp: new Date(),
          services: {
            backup: 'operational',
            restore: 'operational',
            disasterRecovery: 'operational',
            businessContinuity: 'operational'
          },
          uptime: '99.9%',
          lastCheck: new Date()
        },
        message: 'Disaster recovery system health check passed (simulated)'
      };
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
}
