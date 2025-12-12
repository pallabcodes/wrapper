import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { Sequelize } from 'sequelize-typescript';

describe('Auth E2E', () => {
  let app: INestApplication;
  let sequelize: Sequelize;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    sequelize = moduleRef.get(Sequelize);
  });

  afterAll(async () => {
    if (sequelize) {
      await sequelize.close();
    }
    await app.close();
  });

  it('register and login', async () => {
    const email = `user${Date.now()}@example.com`;
    const password = 'SecurePass123!';

    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, name: 'Test User' })
      .expect(201);

    expect(register.body.email).toBe(email);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    expect(login.body).toHaveProperty('accessToken');
    expect(login.body).toHaveProperty('refreshToken');
  });
});


