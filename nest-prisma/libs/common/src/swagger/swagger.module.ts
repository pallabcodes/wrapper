import { Module } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

@Module({})
export class SwaggerModuleConfig {
  static setup(app: any, options?: { title?: string; version?: string; description?: string }) {
    const config = new DocumentBuilder()
      .setTitle(options?.title || 'Sleepr Prisma API')
      .setDescription(options?.description || 'Microservices API for Sleepr application with Prisma ORM')
      .setVersion(options?.version || '1.0')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('reservations', 'Reservation management endpoints')
      .addTag('payments', 'Payment processing endpoints')
      .addTag('notifications', 'Notification service endpoints')
      .addTag('health', 'Health check endpoints')
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
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
    });

    return document;
  }
}




