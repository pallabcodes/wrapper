import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get, Injectable } from '@nestjs/common';

@Injectable()
export class MinimalService {
  getMessage(): string {
    return 'Minimal service is working!';
  }
}

@Controller('minimal-working')
export class MinimalController {
  constructor(private readonly minimalService: MinimalService) {
    console.log('MinimalController constructor called');
    console.log('MinimalService injected:', !!this.minimalService);
    console.log('MinimalService type:', typeof this.minimalService);
  }

  @Get('test')
  test() {
    try {
      return {
        message: this.minimalService?.getMessage() || 'Service is undefined',
        serviceInjected: !!this.minimalService,
        serviceType: typeof this.minimalService
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
        serviceInjected: !!this.minimalService,
        serviceType: typeof this.minimalService
      };
    }
  }
}

@Module({
  controllers: [MinimalController],
  providers: [MinimalService],
})
export class MinimalModule {}

async function bootstrap() {
  const app = await NestFactory.create(MinimalModule);
  const port = 3010; // Use different port
  
  await app.listen(port);
  
  console.log(`Minimal working service running on http://localhost:${port}`);
  console.log(`Test endpoint: http://localhost:${port}/minimal-working/test`);
}

bootstrap();
