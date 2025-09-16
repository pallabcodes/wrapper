import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  async getMetrics() {
    this.logger.log('Getting metrics');
    return { message: 'Metrics service not implemented yet' };
  }
}
