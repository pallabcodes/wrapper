import { Controller, Get, Post, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { MultiRegionDemoService } from './multi-region-demo.service';

@Controller('multi-region-demo')
export class MultiRegionDemoController {
  private multiRegionDemoService: MultiRegionDemoService;

  constructor() {
    this.multiRegionDemoService = new MultiRegionDemoService();
    console.log('MultiRegionDemoController constructor called');
    console.log('MultiRegionDemoService injected:', !!this.multiRegionDemoService);
  }

  @Get('metrics')
  async getGlobalMetrics() {
    try {
      return await this.multiRegionDemoService.getGlobalMetrics();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('regions')
  async getRegions() {
    try {
      return await this.multiRegionDemoService.getRegions();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('load-balancing')
  async demonstrateLoadBalancing() {
    try {
      return await this.multiRegionDemoService.demonstrateLoadBalancing();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('data-replication')
  async demonstrateDataReplication() {
    try {
      return await this.multiRegionDemoService.demonstrateDataReplication();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('failover')
  async demonstrateFailover() {
    try {
      return await this.multiRegionDemoService.demonstrateFailover();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('data-conflicts')
  async demonstrateDataConflicts() {
    try {
      return await this.multiRegionDemoService.demonstrateDataConflicts();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('performance')
  async demonstratePerformanceOptimization() {
    try {
      return await this.multiRegionDemoService.demonstratePerformanceOptimization();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('health')
  async getHealthSummary() {
    try {
      return await this.multiRegionDemoService.getHealthSummary();
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Post('simulate-failure/:regionId')
  @HttpCode(HttpStatus.OK)
  async simulateRegionFailure(@Param('regionId') regionId: string) {
    try {
      return await this.multiRegionDemoService.simulateRegionFailure(regionId);
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Post('simulate-recovery/:regionId')
  @HttpCode(HttpStatus.OK)
  async simulateRegionRecovery(@Param('regionId') regionId: string) {
    try {
      return await this.multiRegionDemoService.simulateRegionRecovery(regionId);
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
}
