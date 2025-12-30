import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter()
    );

    // gRPC microservice setup that runs on port 50051
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.GRPC,
        options: {
            package: 'ratelimiter',
            // different OS has different path separtors (/ vs \) so used join to handle this
            protoPath: join(__dirname, '../../../packages/proto/ratelimiter.proto'),
            url: '0.0.0.0:50051',
        },
    });

    // Swagger setup
    const config = new DocumentBuilder()
        .setTitle('Rate Limiter Service')
        .setDescription('Google-grade distributed rate limiter')
        .setVersion('1.0')
        .addTag('rate-limit')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    // startAllMicroservices(): Starts the gRPC server on port 50051
    await app.startAllMicroservices();
    // listen(3001): Starts the HTTP server on port 3001 and '0.0.0.0': Binds to all network interfaces (not just localhost)
    await app.listen(3001, '0.0.0.0');
}

bootstrap();
