import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { SwaggerConfig } from '@common/config/swagger.config';

export class AppBootstrapService {
  private constructor(
    private readonly app: INestApplication,
    private readonly configService: ConfigService,
  ) {}

  static create(app: INestApplication, configService: ConfigService): AppBootstrapService {
    return new AppBootstrapService(app, configService);
  }

  configure(): void {
    this.setGlobalPrefix();
    this.enableCors();
    this.setupViewEngine();
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

  private setupViewEngine(): void {
    // Configure EJS view engine for HTML templates
    // Views directory: src/views (relative to project root)
    const expressApp = this.app.getHttpAdapter().getInstance();
    const path = require('path');
    expressApp.set('view engine', 'ejs');
    expressApp.set('views', path.join(process.cwd(), 'src', 'views'));
    
    // Serve static assets (CSS, JS) from views/assets directory
    const expressStatic = require('express').static;
    expressApp.use('/assets', expressStatic(path.join(process.cwd(), 'src', 'views', 'assets')));
    
    // Register HTML template routes directly on Express (bypassing NestJS global prefix)
    // These routes are accessible without /api prefix for direct browser access
    this.setupTemplateRoutes(expressApp);
  }

  private setupTemplateRoutes(expressApp: any): void {
    const path = require('path');
    const viewsPath = path.join(process.cwd(), 'src', 'views');
    
    // Signup page
    expressApp.get('/auth/signup', (req: any, res: any) => {
      res.render('auth/signup', {
        formData: req.query,
        errors: [],
      });
    });

    // Login page
    expressApp.get('/auth/login', (req: any, res: any) => {
      res.render('auth/login', {
        formData: req.query,
        errors: [],
        success: req.query.success || null,
      });
    });

    // Forgot password page
    expressApp.get('/auth/forgot-password', (req: any, res: any) => {
      res.render('auth/forgot-password', {
        formData: req.query,
        errors: [],
      });
    });

    // Reset password page
    expressApp.get('/auth/reset-password', (req: any, res: any) => {
      res.render('auth/reset-password', {
        query: req.query,
        errors: [],
      });
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
    // HttpExceptionFilter is registered via APP_FILTER in AppModule
    // No need to register here to avoid duplication
  }

  private setupGlobalInterceptors(): void {
    // LoggingInterceptor is registered via APP_INTERCEPTOR in AppModule
    // Only register TransformInterceptor here
    this.app.useGlobalInterceptors(new TransformInterceptor());
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

