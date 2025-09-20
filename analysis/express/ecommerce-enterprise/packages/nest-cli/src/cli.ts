#!/usr/bin/env node

import { Command } from 'commander';
import { GenerateCommand } from './commands/generate.command';
import { BuildCommand } from './commands/build.command';
import { TestCommand } from './commands/test.command';
import { GenerateService } from './services/generate.service';
import { BuildService } from './services/build.service';
import { TestService } from './services/test.service';

const program = new Command();

program
  .name('nest-cli')
  .description('Enhanced NestJS CLI with additional features')
  .version('1.0.0');

// Initialize services
const generateService = new GenerateService();
const buildService = new BuildService();
const testService = new TestService();

// Register commands
const generateCommand = new GenerateCommand(generateService);
const buildCommand = new BuildCommand(buildService);
const testCommand = new TestCommand(testService);

generateCommand.register(program);
buildCommand.register(program);
testCommand.register(program);

// Add help command
program
  .command('help')
  .description('Display help information')
  .action(() => {
    program.help();
  });

// Parse command line arguments
program.parse(process.argv);

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.help();
}