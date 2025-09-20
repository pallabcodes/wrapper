import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class CodeGeneratorService {
  async generateModule(name: string, targetPath: string): Promise<void> {
    const moduleContent = this.getModuleTemplate(name);
    await fs.writeFile(path.join(targetPath, `${name}.module.ts`), moduleContent);
  }

  async generateController(name: string, targetPath: string): Promise<void> {
    const controllerContent = this.getControllerTemplate(name);
    await fs.writeFile(path.join(targetPath, `${name}.controller.ts`), controllerContent);
  }

  async generateService(name: string, targetPath: string): Promise<void> {
    const serviceContent = this.getServiceTemplate(name);
    await fs.writeFile(path.join(targetPath, `${name}.service.ts`), serviceContent);
  }

  private getModuleTemplate(name: string): string {
    return `import { Module } from '@nestjs/common';

@Module({
  controllers: [],
  providers: [],
  exports: [],
})
export class ${name}Module {}
`;
  }

  private getControllerTemplate(name: string): string {
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

  private getServiceTemplate(name: string): string {
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
}

