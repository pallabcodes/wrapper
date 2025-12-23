import { Test } from '@nestjs/testing';
import { Module, Controller, Get } from '@nestjs/common';
import request from 'supertest';
import { Resilience } from '../src/modules/analytics/shared/resilience/resilience.decorator';
import { ResilienceInterceptor } from '../src/modules/analytics/shared/resilience/resilience.interceptor';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';

let failCount = 0;

@Controller()
class FlakyController {
  @Resilience({ enabled: true, windowMs: 200, openDurationMs: 500, minimumRps: 1, failureRateThreshold: 0.5 })
  @Get('flaky')
  flaky() {
    failCount++;
    throw new Error('downstream');
  }
}

@Module({
  controllers: [FlakyController],
  providers: [
    Reflector,
    { provide: APP_INTERCEPTOR, useClass: ResilienceInterceptor },
  ],
})
class AppModule {}

describe('Resilience e2e', () => {
  it('opens circuit and short-circuits after failures', async () => {
    const modRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = modRef.createNestApplication();
    await app.init();
    const server = app.getHttpServer();

    // cause failures to trip the breaker
    await request(server).get('/flaky');
    await request(server).get('/flaky');

    const res = await request(server).get('/flaky');
    expect(res.status).toBeGreaterThanOrEqual(500);

    await app.close();
  });
});


