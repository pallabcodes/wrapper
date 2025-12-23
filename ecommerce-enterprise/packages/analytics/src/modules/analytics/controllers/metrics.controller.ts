import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  @Get()
  @ApiOperation({ summary: 'Get metrics' })
  async getMetrics() {
    return { message: 'Metrics endpoint not implemented yet' };
  }
}
