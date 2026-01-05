import { NestFactory } from '@nestjs/core';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

/**
 * Bootstrap Application
 */
async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
    );

    await app.listen(3001, '0.0.0.0');
    console.log('✅ Rate Limiter (Clean Architecture) running on http://localhost:3001');
}

bootstrap();
