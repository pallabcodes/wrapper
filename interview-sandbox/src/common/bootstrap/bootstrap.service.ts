import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { SwaggerConfig } from '@common/config/swagger.config';

export class BootstrapService {
  private constructor(
    private readonly app: INestApplication,
    private readonly configService: ConfigService,
  ) {}

  static create(app: INestApplication, configService: ConfigService): BootstrapService {
    return new BootstrapService(app, configService);
  }

  configure(): void {
    this.setGlobalPrefix();
    this.enableCors();
    this.setupGlobalPipes();
    this.setupGlobalFilters();
    this.setupGlobalInterceptors();
    this.setupSwagger();
    this.setupRootEndpoint();
  }

  private setGlobalPrefix(): void {
    this.app.setGlobalPrefix('api');
  }

  private enableCors(): void {
    const corsConfig = this.configService.get('cors');
    const origin = corsConfig?.origin || '*';
    
    // Support both string and array of origins
    const origins = typeof origin === 'string' 
      ? (origin === '*' ? '*' : origin.split(',').map(o => o.trim()))
      : origin;

    this.app.enableCors({
      origin: origins,
      credentials: corsConfig?.credentials ?? true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
  }

  private setupGlobalPipes(): void {
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
  }

  private setupGlobalFilters(): void {
    this.app.useGlobalFilters(new HttpExceptionFilter());
  }

  private setupGlobalInterceptors(): void {
    this.app.useGlobalInterceptors(
      new TransformInterceptor(),
      new LoggingInterceptor(),
    );
  }

  private setupSwagger(): void {
    SwaggerConfig.setup(this.app);
  }

  private setupRootEndpoint(): void {
    this.app.getHttpAdapter().get('/', (req, res) => {
      res.json({
        message: 'Interview Sandbox API',
        version: '1.0.0',
        docs: '/api-docs',
        api: '/api',
        health: '/health',
        ready: '/ready',
      });
    });
  }

  getPort(): number {
    return this.configService.get<number>('port') || 3000;
  }

  logStartupInfo(port: number): void {
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`📚 Swagger documentation: http://localhost:${port}/api-docs`);
    console.log(`❤️  Health check: http://localhost:${port}/health`);
  }
}

