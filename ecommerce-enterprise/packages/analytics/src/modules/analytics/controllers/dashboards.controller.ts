import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Dashboards')
@Controller('dashboards')
export class DashboardsController {
  @Get()
  @ApiOperation({ summary: 'Get dashboards' })
  async getDashboards() {
    return { message: 'Dashboards endpoint not implemented yet' };
  }
}
