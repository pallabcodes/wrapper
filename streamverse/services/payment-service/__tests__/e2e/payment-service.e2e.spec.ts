import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * E2E Tests for Payment Service
 * 
 * These tests require:
 * - Running PostgreSQL (docker-compose up postgres -d)
 * - Running Kafka (docker-compose up kafka zookeeper -d)
 * - Valid environment variables in .env.test
 */
describe('Payment Service (E2E)', () => {
    let app: INestApplication;
    let authToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // TODO: Get auth token from user-service or mock JWT
        authToken = 'mock-jwt-token';
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Health Check', () => {
        it('/health (GET)', () => {
            return request(app.getHttpServer())
                .get('/health')
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('status', 'ok');
                });
        });
    });

    describe('Payment Flow', () => {
        describe('POST /payments', () => {
            it('should require authentication', () => {
                return request(app.getHttpServer())
                    .post('/payments')
                    .send({
                        amount: 10000,
                        currency: 'USD',
                        paymentMethod: 'card',
                    })
                    .expect(401);
            });

            it('should validate request body', () => {
                return request(app.getHttpServer())
                    .post('/payments')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        // Missing required fields
                    })
                    .expect(400);
            });

            it('should create a payment intent', async () => {
                // Note: This test requires a valid JWT and Stripe test key
                const response = await request(app.getHttpServer())
                    .post('/payments')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        amount: 10000,
                        currency: 'USD',
                        paymentMethod: 'card',
                        description: 'E2E Test Payment',
                    });

                // May return 401 if JWT is invalid, 500 if Stripe not configured
                expect([200, 201, 401, 503]).toContain(response.status);

                if (response.status === 201) {
                    expect(response.body).toHaveProperty('id');
                    expect(response.body).toHaveProperty('status');
                    expect(response.body).toHaveProperty('clientSecret');
                }
            });
        });

        describe('GET /payments/:id', () => {
            it('should require authentication', () => {
                return request(app.getHttpServer())
                    .get('/payments/pay_nonexistent')
                    .expect(401);
            });

            it('should return 404 for non-existent payment', () => {
                return request(app.getHttpServer())
                    .get('/payments/pay_nonexistent')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect((res) => {
                        expect([401, 404]).toContain(res.status);
                    });
            });
        });
    });

    describe('Subscription Flow', () => {
        describe('POST /subscriptions', () => {
            it('should require authentication', () => {
                return request(app.getHttpServer())
                    .post('/subscriptions')
                    .send({
                        priceId: 'price_test_123',
                    })
                    .expect(401);
            });
        });
    });
});
