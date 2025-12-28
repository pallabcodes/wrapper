import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { PaymentServiceModule } from './payment-service.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter, GraphQLExceptionFilter, SecurityMiddleware, CorsMiddleware } from '@flashmart/common';

async function bootstrap() {
  const app = await NestFactory.create(PaymentServiceModule);

  // Apply security and CORS middleware
  app.use(new SecurityMiddleware().use);
  app.use(new CorsMiddleware().use);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Global exception filters
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('FlashMart Payment Service')
    .setDescription('Payment processing and transaction management service')
    .setVersion('1.0')
    .addTag('payments', 'Payment processing endpoints')
    .addTag('transactions', 'Transaction management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`💳 Payment Service running on http://localhost:${port}/graphql`);
  console.log(`📖 API Docs: http://localhost:${port}/api-docs`);
}
bootstrap();
