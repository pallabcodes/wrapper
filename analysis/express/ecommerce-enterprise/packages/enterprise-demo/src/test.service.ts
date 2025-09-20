import { Injectable } from '@nestjs/common';

@Injectable()
export class TestService {
  getMessage(): string {
    return 'Hello from TestService!';
  }
}
