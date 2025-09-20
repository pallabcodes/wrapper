import { Command } from 'commander';
import { TestService } from '../services/test.service';

export class TestCommand {
  constructor(private readonly testService: TestService) {}

  register(program: Command): void {
    const testCommand = program
      .command('test')
      .description('Run tests')
      .option('-p, --project <project>', 'Project to test')
      .option('-c, --config <config>', 'Configuration file')
      .option('-w, --watch', 'Watch for changes')
      .option('--coverage', 'Generate coverage report')
      .option('--e2e', 'Run e2e tests')
      .option('--unit', 'Run unit tests')
      .action(async (options: any) => {
        try {
          await this.testService.runTests(options);
          console.log('✅ Tests completed successfully');
        } catch (error) {
          console.error(`❌ Tests failed: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });

    testCommand
      .command('watch')
      .description('Run tests and watch for changes')
      .option('-p, --project <project>', 'Project to test')
      .option('-c, --config <config>', 'Configuration file')
      .option('--coverage', 'Generate coverage report')
      .action(async (options: any) => {
        try {
          await this.testService.watchTests(options);
          console.log('✅ Test watch started');
        } catch (error) {
          console.error(`❌ Test watch failed: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });

    testCommand
      .command('e2e')
      .description('Run e2e tests')
      .option('-p, --project <project>', 'Project to test')
      .option('-c, --config <config>', 'Configuration file')
      .action(async (options: any) => {
        try {
          await this.testService.runE2ETests(options);
          console.log('✅ E2E tests completed successfully');
        } catch (error) {
          console.error(`❌ E2E tests failed: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });
  }
}

