import { Controller, Get } from '@nestjs/common';
import { WorkingService } from './working.service';

@Controller('working')
export class WorkingController {
  constructor(private readonly workingService: WorkingService) {
    console.log('WorkingController constructor called');
    console.log('WorkingService injected:', !!this.workingService);
  }

  @Get('test')
  test() {
    return {
      message: this.workingService.getMessage(),
      serviceInjected: !!this.workingService
    };
  }
}
