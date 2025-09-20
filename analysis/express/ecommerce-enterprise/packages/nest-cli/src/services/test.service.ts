import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';

export interface TestOptions {
  project?: string;
  config?: string;
  watch?: boolean;
  coverage?: boolean;
  e2e?: boolean;
  unit?: boolean;
}

@Injectable()
export class TestService {
  async runTests(options: TestOptions = {}): Promise<void> {
    const projectPath = options.project || process.cwd();
    const configFile = options.config || 'jest.config.js';
    
    const testCommand = this.getTestCommand(options);
    const args = this.getTestArgs(options, configFile);
    
    return new Promise((resolve, reject) => {
      const child = spawn(testCommand, args, {
        cwd: projectPath,
        stdio: 'inherit',
        shell: true,
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async watchTests(options: TestOptions = {}): Promise<void> {
    const watchOptions = { ...options, watch: true };
    return this.runTests(watchOptions);
  }

  async runE2ETests(options: TestOptions = {}): Promise<void> {
    const e2eOptions = { ...options, e2e: true };
    return this.runTests(e2eOptions);
  }

  private getTestCommand(options: TestOptions): string {
    return 'npx';
  }

  private getTestArgs(options: TestOptions, configFile: string): string[] {
    const args: string[] = [];
    
    if (options.e2e) {
      args.push('jest', '--config', 'jest-e2e.json');
    } else {
      args.push('jest');
    }
    
    if (options.watch) {
      args.push('--watch');
    }
    
    if (options.coverage) {
      args.push('--coverage');
    }
    
    if (options.unit) {
      args.push('--testPathPattern=spec.ts$');
    }
    
    if (configFile) {
      args.push('--config', configFile);
    }
    
    return args;
  }
}

