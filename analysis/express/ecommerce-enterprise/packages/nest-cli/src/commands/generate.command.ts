import { Command } from 'commander';
import { GenerateService } from '../services/generate.service';

export class GenerateCommand {
  constructor(private readonly generateService: GenerateService) {}

  register(program: Command): void {
    const generateCommand = program
      .command('generate')
      .description('Generate NestJS components')
      .alias('g');

    generateCommand
      .command('module <name>')
      .description('Generate a new module')
      .option('-p, --path <path>', 'Path to generate the module')
      .option('-f, --flat', 'Generate files in a flat structure')
      .action(async (name: string, options: any) => {
        try {
          await this.generateService.generateModule(name, options);
          console.log(`✅ Module '${name}' generated successfully`);
        } catch (error) {
          console.error(`❌ Failed to generate module: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });

    generateCommand
      .command('controller <name>')
      .description('Generate a new controller')
      .option('-p, --path <path>', 'Path to generate the controller')
      .option('-m, --module <module>', 'Module to add the controller to')
      .option('-f, --flat', 'Generate files in a flat structure')
      .action(async (name: string, options: any) => {
        try {
          await this.generateService.generateController(name, options);
          console.log(`✅ Controller '${name}' generated successfully`);
        } catch (error) {
          console.error(`❌ Failed to generate controller: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });

    generateCommand
      .command('service <name>')
      .description('Generate a new service')
      .option('-p, --path <path>', 'Path to generate the service')
      .option('-m, --module <module>', 'Module to add the service to')
      .option('-f, --flat', 'Generate files in a flat structure')
      .action(async (name: string, options: any) => {
        try {
          await this.generateService.generateService(name, options);
          console.log(`✅ Service '${name}' generated successfully`);
        } catch (error) {
          console.error(`❌ Failed to generate service: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });

    generateCommand
      .command('guard <name>')
      .description('Generate a new guard')
      .option('-p, --path <path>', 'Path to generate the guard')
      .option('-m, --module <module>', 'Module to add the guard to')
      .option('-f, --flat', 'Generate files in a flat structure')
      .action(async (name: string, options: any) => {
        try {
          await this.generateService.generateGuard(name, options);
          console.log(`✅ Guard '${name}' generated successfully`);
        } catch (error) {
          console.error(`❌ Failed to generate guard: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });

    generateCommand
      .command('interceptor <name>')
      .description('Generate a new interceptor')
      .option('-p, --path <path>', 'Path to generate the interceptor')
      .option('-m, --module <module>', 'Module to add the interceptor to')
      .option('-f, --flat', 'Generate files in a flat structure')
      .action(async (name: string, options: any) => {
        try {
          await this.generateService.generateInterceptor(name, options);
          console.log(`✅ Interceptor '${name}' generated successfully`);
        } catch (error) {
          console.error(`❌ Failed to generate interceptor: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });

    generateCommand
      .command('decorator <name>')
      .description('Generate a new decorator')
      .option('-p, --path <path>', 'Path to generate the decorator')
      .option('-m, --module <module>', 'Module to add the decorator to')
      .option('-f, --flat', 'Generate files in a flat structure')
      .action(async (name: string, options: any) => {
        try {
          await this.generateService.generateDecorator(name, options);
          console.log(`✅ Decorator '${name}' generated successfully`);
        } catch (error) {
          console.error(`❌ Failed to generate decorator: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });

    generateCommand
      .command('pipe <name>')
      .description('Generate a new pipe')
      .option('-p, --path <path>', 'Path to generate the pipe')
      .option('-m, --module <module>', 'Module to add the pipe to')
      .option('-f, --flat', 'Generate files in a flat structure')
      .action(async (name: string, options: any) => {
        try {
          await this.generateService.generatePipe(name, options);
          console.log(`✅ Pipe '${name}' generated successfully`);
        } catch (error) {
          console.error(`❌ Failed to generate pipe: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });

    generateCommand
      .command('middleware <name>')
      .description('Generate a new middleware')
      .option('-p, --path <path>', 'Path to generate the middleware')
      .option('-m, --module <module>', 'Module to add the middleware to')
      .option('-f, --flat', 'Generate files in a flat structure')
      .action(async (name: string, options: any) => {
        try {
          await this.generateService.generateMiddleware(name, options);
          console.log(`✅ Middleware '${name}' generated successfully`);
        } catch (error) {
          console.error(`❌ Failed to generate middleware: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });

    generateCommand
      .command('filter <name>')
      .description('Generate a new exception filter')
      .option('-p, --path <path>', 'Path to generate the filter')
      .option('-m, --module <module>', 'Module to add the filter to')
      .option('-f, --flat', 'Generate files in a flat structure')
      .action(async (name: string, options: any) => {
        try {
          await this.generateService.generateFilter(name, options);
          console.log(`✅ Filter '${name}' generated successfully`);
        } catch (error) {
          console.error(`❌ Failed to generate filter: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });
  }
}

