import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface GenerateOptions {
  path?: string;
  module?: string;
  flat?: boolean;
}

@Injectable()
export class GenerateService {
  
  async generateModule(name: string, options: GenerateOptions = {}): Promise<void> {
    const targetPath = options.path || `src/modules/${name}`;
    const moduleName = this.toPascalCase(name);
    
    await this.ensureDirectory(targetPath);
    
    // Generate module file
    const moduleContent = this.generateModuleTemplate(moduleName);
    await fs.writeFile(path.join(targetPath, `${name}.module.ts`), moduleContent);
    
    // Generate index file
    const indexContent = this.generateIndexTemplate(moduleName);
    await fs.writeFile(path.join(targetPath, 'index.ts'), indexContent);
    
    console.log(`Generated module: ${targetPath}/${name}.module.ts`);
  }

  async generateController(name: string, options: GenerateOptions = {}): Promise<void> {
    const targetPath = options.path || `src/modules/${options.module || 'app'}`;
    const controllerName = this.toPascalCase(name);
    
    await this.ensureDirectory(targetPath);
    
    const controllerContent = this.generateControllerTemplate(controllerName);
    await fs.writeFile(path.join(targetPath, `${name}.controller.ts`), controllerContent);
    
    console.log(`Generated controller: ${targetPath}/${name}.controller.ts`);
  }

  async generateService(name: string, options: GenerateOptions = {}): Promise<void> {
    const targetPath = options.path || `src/modules/${options.module || 'app'}`;
    const serviceName = this.toPascalCase(name);
    
    await this.ensureDirectory(targetPath);
    
    const serviceContent = this.generateServiceTemplate(serviceName);
    await fs.writeFile(path.join(targetPath, `${name}.service.ts`), serviceContent);
    
    console.log(`Generated service: ${targetPath}/${name}.service.ts`);
  }

  async generateGuard(name: string, options: GenerateOptions = {}): Promise<void> {
    const targetPath = options.path || `src/guards`;
    const guardName = this.toPascalCase(name);
    
    await this.ensureDirectory(targetPath);
    
    const guardContent = this.generateGuardTemplate(guardName);
    await fs.writeFile(path.join(targetPath, `${name}.guard.ts`), guardContent);
    
    console.log(`Generated guard: ${targetPath}/${name}.guard.ts`);
  }

  async generateInterceptor(name: string, options: GenerateOptions = {}): Promise<void> {
    const targetPath = options.path || `src/interceptors`;
    const interceptorName = this.toPascalCase(name);
    
    await this.ensureDirectory(targetPath);
    
    const interceptorContent = this.generateInterceptorTemplate(interceptorName);
    await fs.writeFile(path.join(targetPath, `${name}.interceptor.ts`), interceptorContent);
    
    console.log(`Generated interceptor: ${targetPath}/${name}.interceptor.ts`);
  }

  async generateDecorator(name: string, options: GenerateOptions = {}): Promise<void> {
    const targetPath = options.path || `src/decorators`;
    const decoratorName = this.toPascalCase(name);
    
    await this.ensureDirectory(targetPath);
    
    const decoratorContent = this.generateDecoratorTemplate(decoratorName);
    await fs.writeFile(path.join(targetPath, `${name}.decorator.ts`), decoratorContent);
    
    console.log(`Generated decorator: ${targetPath}/${name}.decorator.ts`);
  }

  async generatePipe(name: string, options: GenerateOptions = {}): Promise<void> {
    const targetPath = options.path || `src/pipes`;
    const pipeName = this.toPascalCase(name);
    
    await this.ensureDirectory(targetPath);
    
    const pipeContent = this.generatePipeTemplate(pipeName);
    await fs.writeFile(path.join(targetPath, `${name}.pipe.ts`), pipeContent);
    
    console.log(`Generated pipe: ${targetPath}/${name}.pipe.ts`);
  }

  async generateMiddleware(name: string, options: GenerateOptions = {}): Promise<void> {
    const targetPath = options.path || `src/middleware`;
    const middlewareName = this.toPascalCase(name);
    
    await this.ensureDirectory(targetPath);
    
    const middlewareContent = this.generateMiddlewareTemplate(middlewareName);
    await fs.writeFile(path.join(targetPath, `${name}.middleware.ts`), middlewareContent);
    
    console.log(`Generated middleware: ${targetPath}/${name}.middleware.ts`);
  }

  async generateFilter(name: string, options: GenerateOptions = {}): Promise<void> {
    const targetPath = options.path || `src/filters`;
    const filterName = this.toPascalCase(name);
    
    await this.ensureDirectory(targetPath);
    
    const filterContent = this.generateFilterTemplate(filterName);
    await fs.writeFile(path.join(targetPath, `${name}.filter.ts`), filterContent);
    
    console.log(`Generated filter: ${targetPath}/${name}.filter.ts`);
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }

  private toPascalCase(str: string): string {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  private generateModuleTemplate(name: string): string {
    return `import { Module } from '@nestjs/common';

@Module({
  controllers: [],
  providers: [],
  exports: [],
})
export class ${name}Module {}
`;
  }

  private generateControllerTemplate(name: string): string {
    return `import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';

@Controller('${name.toLowerCase()}')
export class ${name}Controller {
  @Get()
  findAll(@Query() query: any): string {
    return 'This action returns all ${name.toLowerCase()}';
  }

  @Get(':id')
  findOne(@Param('id') id: string): string {
    return \`This action returns a #\${id} ${name.toLowerCase()}\`;
  }

  @Post()
  create(@Body() create${name}Dto: any): string {
    return 'This action adds a new ${name.toLowerCase()}';
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() update${name}Dto: any): string {
    return \`This action updates a #\${id} ${name.toLowerCase()}\`;
  }

  @Delete(':id')
  remove(@Param('id') id: string): string {
    return \`This action removes a #\${id} ${name.toLowerCase()}\`;
  }
}
`;
  }

  private generateServiceTemplate(name: string): string {
    return `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${name}Service {
  findAll(): string[] {
    return [];
  }

  findOne(id: string): string {
    return \`\${id}\`;
  }

  create(create${name}Dto: any): string {
    return 'created';
  }

  update(id: string, update${name}Dto: any): string {
    return \`updated \${id}\`;
  }

  remove(id: string): string {
    return \`removed \${id}\`;
  }
}
`;
  }

  private generateGuardTemplate(name: string): string {
    return `import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class ${name}Guard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Add your guard logic here
    return true;
  }
}
`;
  }

  private generateInterceptorTemplate(name: string): string {
    return `import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ${name}Interceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(data => {
        // Add your interceptor logic here
      }),
    );
  }
}
`;
  }

  private generateDecoratorTemplate(name: string): string {
    return `import { SetMetadata } from '@nestjs/common';

export const ${name.toUpperCase()}_KEY = '${name.toLowerCase()}';

export const ${name} = (value?: any) => SetMetadata(${name.toUpperCase()}_KEY, value);
`;
  }

  private generatePipeTemplate(name: string): string {
    return `import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ${name}Pipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Add your pipe logic here
    return value;
  }
}
`;
  }

  private generateMiddlewareTemplate(name: string): string {
    return `import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ${name}Middleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Add your middleware logic here
    next();
  }
}
`;
  }

  private generateFilterTemplate(name: string): string {
    return `import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class ${name}Filter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
`;
  }

  private generateIndexTemplate(name: string): string {
    return `export * from './${name.toLowerCase()}.module';
`;
  }
}

