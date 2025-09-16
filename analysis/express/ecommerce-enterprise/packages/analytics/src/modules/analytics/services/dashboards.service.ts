import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DashboardsService {
  private readonly logger = new Logger(DashboardsService.name);

  async getDashboards() {
    this.logger.log('Getting dashboards');
    return { message: 'Dashboards service not implemented yet' };
  }
}
