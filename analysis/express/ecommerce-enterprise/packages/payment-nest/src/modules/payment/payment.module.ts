import { Module } from '@nestjs/common';
import { PaymentController } from './controllers/payment.controller';
import { EnterprisePaymentController } from './controllers/enterprise-payment.controller';
import { ThreePhasePaymentController } from './controllers/three-phase-payment.controller';
import { TypeSafeValidationDemoController } from './controllers/type-safe-validation-demo.controller';
import { DecoratorBasedValidationController } from './controllers/decorator-based-validation.controller';
import { SecurePaymentController } from './controllers/secure-payment.controller'; // NEW
import { DXImprovedPaymentController } from './controllers/dx-improved-payment.controller'; // NEW
import { EnhancedStreamsDemoController } from './controllers/enhanced-streams-demo.controller'; // NEW
import { PaymentService } from './services/payment.service';
import { EnterprisePaymentService } from './services/enterprise-payment.service';
import { ThreePhasePaymentService } from './services/three-phase-payment.service';
import { SecurePaymentService } from './services/secure-payment.service'; // NEW
import { FraudDetectionService } from './services/fraud-detection.service';
import { PaymentComplianceService } from './services/payment-compliance.service';
import { PaymentMonitoringService } from './services/payment-monitoring.service';
import { StripeService } from './services/stripe.service';
import { BraintreeService } from './services/braintree.service';
import { PayPalService } from './services/paypal.service';
import { PaymentRepository } from './repositories/payment.repository';
import { WebhookService } from '../webhook/services/webhook.service';
import { EnterpriseZodValidationService } from '@ecommerce-enterprise/nest-zod';

@Module({
  controllers: [
    PaymentController,
    EnterprisePaymentController,
    ThreePhasePaymentController,
    TypeSafeValidationDemoController,
    DecoratorBasedValidationController,
    SecurePaymentController, // NEW
    DXImprovedPaymentController, // NEW
    EnhancedStreamsDemoController, // NEW
  ],
  providers: [
    PaymentService,
    EnterprisePaymentService,
    ThreePhasePaymentService,
    SecurePaymentService, // NEW
    FraudDetectionService,
    PaymentComplianceService,
    PaymentMonitoringService,
    StripeService,
    BraintreeService,
    PayPalService,
    PaymentRepository,
    WebhookService,
    EnterpriseZodValidationService,
  ],
  exports: [
    PaymentService,
    EnterprisePaymentService,
    ThreePhasePaymentService,
    SecurePaymentService, // NEW
    FraudDetectionService,
    PaymentComplianceService,
    PaymentMonitoringService,
  ],
})
export class PaymentModule {}