import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from '../services/reports.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reports' })
  async getReports() {
    return { message: 'Reports endpoint not implemented yet' };
  }

  @Post()
  @ApiOperation({ summary: 'Generate a new report' })
  async generateReport(@Body() body: any) {
    return await this.reportsService.generateReport('custom', body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  async getReportById(@Param('id') id: string) {
    return await this.reportsService.getReportById(id);
  }
}
