import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for demo purposes
  app.enableCors();
  
  const port = process.env.PORT || 3007;
  await app.listen(port);
  
  console.log(`💳 Payments Demo Service running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/payments-demo/health`);
  console.log(`🔍 Available endpoints:`);
  console.log(`  GET  /payments-demo/basic - Basic payment processing`);
  console.log(`  GET  /payments-demo/stripe - Stripe payment with 3DS`);
  console.log(`  GET  /payments-demo/paypal - PayPal payment`);
  console.log(`  GET  /payments-demo/square - Square payment`);
  console.log(`  GET  /payments-demo/adyen - Adyen payment with SCA`);
  console.log(`  GET  /payments-demo/high-risk - High-risk payment (fraud detection)`);
  console.log(`  POST /payments-demo/refund/:paymentId - Process refund`);
  console.log(`  POST /payments-demo/webhook/:provider - Handle webhooks`);
  console.log(`  GET  /payments-demo/stats - Payment statistics`);
  console.log(`  GET  /payments-demo/multi-currency - Multi-currency payments`);
  console.log(`  GET  /payments-demo/mobile - Mobile payments`);
  console.log(`  GET  /payments-demo/subscription - Subscription payments`);
}

bootstrap().catch(console.error);
