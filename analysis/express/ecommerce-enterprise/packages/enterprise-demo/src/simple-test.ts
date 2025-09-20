import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get, Injectable } from '@nestjs/common';

@Injectable()
export class SimpleService {
  getMessage(): string {
    return 'Simple service is working!';
  }
}

@Controller('simple-test')
export class SimpleController {
  constructor(private readonly simpleService: SimpleService) {
    console.log('SimpleController constructor called');
    console.log('SimpleService injected:', !!this.simpleService);
  }

  @Get('test')
  test() {
    return {
      message: this.simpleService.getMessage(),
      serviceInjected: !!this.simpleService
    };
  }
}

@Module({
  controllers: [SimpleController],
  providers: [SimpleService],
})
export class SimpleModule {}

async function bootstrap() {
  const app = await NestFactory.create(SimpleModule);
  const port = 3009; // Use different port
  
  await app.listen(port);
  
  console.log(`Simple test service running on http://localhost:${port}`);
  console.log(`Test endpoint: http://localhost:${port}/simple-test/test`);
}

bootstrap();
