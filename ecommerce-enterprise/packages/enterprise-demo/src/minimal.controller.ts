import { Controller, Get } from '@nestjs/common';

@Controller('minimal')
export class MinimalController {
  @Get('test')
  test() {
    return { message: 'Minimal controller working' };
  }
}
