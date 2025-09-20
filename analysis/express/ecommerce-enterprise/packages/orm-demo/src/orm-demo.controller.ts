import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { OrmDemoService } from './orm-demo.service';
import { Pagination, Sort, Filters } from '@ecommerce-enterprise/nest-orm';

@Controller('orm-demo')
export class OrmDemoController {
  constructor(private readonly ormDemoService: OrmDemoService) {}

  @Get('users')
  async getUsers(
    @Pagination() pagination: any,
    @Sort() sort: any,
    @Filters() filters: any
  ) {
    return await this.ormDemoService.getUsers();
  }

  @Get('users/prisma')
  async getUsersWithPrisma() {
    return await this.ormDemoService.getUsersWithPrisma();
  }

  @Get('report')
  async getComplexReport() {
    return await this.ormDemoService.getComplexReport();
  }

  @Post('users/batch')
  async batchInsertUsers(@Body() users: any[]) {
    return await this.ormDemoService.batchInsertUsers(users);
  }

  @Post('users/with-profile')
  async createUserWithProfile(
    @Body() userData: any,
    @Body('profile') profileData: any
  ) {
    return await this.ormDemoService.createUserWithProfile(userData, profileData);
  }

  @Get('analysis')
  async analyzeQueryPerformance() {
    return await this.ormDemoService.analyzeQueryPerformance();
  }

  @Get('metrics')
  async getPerformanceMetrics() {
    return await this.ormDemoService.getPerformanceMetrics();
  }

  @Get('cache-demo')
  async demonstrateCaching() {
    return await this.ormDemoService.demonstrateCaching();
  }

  @Get('error-handling')
  async demonstrateErrorHandling() {
    return await this.ormDemoService.demonstrateErrorHandling();
  }

  @Get('multi-tenant/:tenantId')
  async demonstrateMultiTenancy(@Param('tenantId') tenantId: string) {
    return await this.ormDemoService.demonstrateMultiTenancy(tenantId);
  }

  @Get('health')
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'orm-demo',
      features: [
        'Multi-ORM Support',
        'Query Optimization',
        'Performance Analysis',
        'Caching',
        'Transaction Management',
        'Multi-Tenancy',
        'Error Handling'
      ]
    };
  }
}
