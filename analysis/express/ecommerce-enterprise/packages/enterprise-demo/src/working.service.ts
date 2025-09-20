import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkingService {
  getMessage(): string {
    return 'Working service is working!';
  }
}
