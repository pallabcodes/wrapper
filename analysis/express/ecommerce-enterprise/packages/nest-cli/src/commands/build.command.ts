import { Command } from 'commander';
import { BuildService } from '../services/build.service';

export class BuildCommand {
  constructor(private readonly buildService: BuildService) {}

  register(program: Command): void {
    const buildCommand = program
      .command('build')
      .description('Build the NestJS application')
      .option('-p, --project <project>', 'Project to build')
      .option('-c, --config <config>', 'Configuration file')
      .option('-w, --watch', 'Watch for changes')
      .option('--webpack', 'Use webpack for building')
      .option('--tsc', 'Use TypeScript compiler for building')
      .action(async (options: any) => {
        try {
          await this.buildService.build(options);
          console.log('✅ Build completed successfully');
        } catch (error) {
          console.error(`❌ Build failed: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });

    buildCommand
      .command('watch')
      .description('Build and watch for changes')
      .option('-p, --project <project>', 'Project to build')
      .option('-c, --config <config>', 'Configuration file')
      .action(async (options: any) => {
        try {
          await this.buildService.watch(options);
          console.log('✅ Build watch started');
        } catch (error) {
          console.error(`❌ Build watch failed: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });
  }
}

