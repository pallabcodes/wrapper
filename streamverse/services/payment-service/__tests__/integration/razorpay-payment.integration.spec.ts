import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RazorpayPaymentProcessor } from '../../src/infrastructure/payment/razorpay-payment-processor';
import { Money } from '../../src/domain/value-objects/money.vo';
import { PaymentMethod } from '../../src/domain/entities/payment.entity';

// Only run if credentials are provided in env or explicitly here
// For this test run, we mock ConfigService to return user-provided keys
describe('RazorpayPaymentProcessor Integration', () => {
    let processor: RazorpayPaymentProcessor;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RazorpayPaymentProcessor,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_RzV49IC6kjIDQU';
                            if (key === 'RAZORPAY_KEY_SECRET') return 'UTmf2v3baN1Al36S7M0rojYt';
                            return null;
                        }),
                    },
                },
            ],
        }).compile();

        processor = module.get<RazorpayPaymentProcessor>(RazorpayPaymentProcessor);
        // Manually trigger init since we are not bootstrapping full app
        processor.onModuleInit();
    });

    it('should be defined', () => {
        expect(processor).toBeDefined();
    });

    it('should create a payment order in Razorpay', async () => {
        const amount = Money.fromCents(50000, 'INR'); // 500 INR
        const result = await processor.createPaymentIntent(
            amount,
            'INR',
            PaymentMethod.CARD,
            { test_meta: 'integration_test_run' }
        );

        console.log('Razorpay Order Created:', result);

        expect(result.id).toBeDefined();
        expect(result.id).toMatch(/^order_/);
        expect(result.amount).toBe(50000);
        expect(result.currency).toBe('inr');
        expect(result.status).toBe('requires_confirmation');
    });
});
