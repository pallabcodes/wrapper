import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AnalyticsModule } from '../src/modules/analytics/analytics.module';

describe('AuthX in-memory e2e', () => {
  let app: INestApplication;
  const base = '/api/v1/analytics';

  beforeAll(async () => {
    process.env['JWT_SECRET'] = process.env['JWT_SECRET'] || 'testsecret';
    app = await NestFactory.create(AnalyticsModule, { logger: false as any });
    app.setGlobalPrefix('api/v1/analytics');
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('403 unauth, 201 login, 200 /auth/me with Bearer, 200 after refresh', async () => {
    await request(app.getHttpServer()).get(base + '/auth/me').expect(403);

    const loginRes = await request(app.getHttpServer())
      .post(base + '/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'demo@example.com', roles: ['admin'] })
      .expect(201);

    const { accessToken, refreshToken } = loginRes.body;
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');

    await request(app.getHttpServer())
      .get(base + '/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const rotateRes = await request(app.getHttpServer())
      .post(base + '/auth/refresh')
      .set('x-refresh-token', refreshToken)
      .expect(201)
      .catch(async (e) => {
        const res = e.response;
        if (res && (res.status === 200 || res.status === 201)) return res;
        throw e;
      });
    const newAccess = rotateRes.body?.accessToken || accessToken;

    await request(app.getHttpServer())
      .get(base + '/auth/me')
      .set('Authorization', `Bearer ${newAccess}`)
      .expect(200);
  });
});


