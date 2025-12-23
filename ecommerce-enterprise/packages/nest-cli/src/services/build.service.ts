import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';

export interface BuildOptions {
  project?: string;
  config?: string;
  watch?: boolean;
  webpack?: boolean;
  tsc?: boolean;
}

@Injectable()
export class BuildService {
  async build(options: BuildOptions = {}): Promise<void> {
    const projectPath = options.project || process.cwd();
    const configFile = options.config || 'nest-cli.json';
    
    const buildCommand = this.getBuildCommand(options);
    const args = this.getBuildArgs(options, configFile);
    
    return new Promise((resolve, reject) => {
      const child = spawn(buildCommand, args, {
        cwd: projectPath,
        stdio: 'inherit',
        shell: true,
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Build failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async watch(options: BuildOptions = {}): Promise<void> {
    const watchOptions = { ...options, watch: true };
    return this.build(watchOptions);
  }

  private getBuildCommand(options: BuildOptions): string {
    if (options.webpack) {
      return 'npx';
    } else if (options.tsc) {
      return 'npx';
    } else {
      return 'npx';
    }
  }

  private getBuildArgs(options: BuildOptions, configFile: string): string[] {
    const args: string[] = [];
    
    if (options.webpack) {
      args.push('nest', 'build', '--webpack');
    } else if (options.tsc) {
      args.push('nest', 'build', '--tsc');
    } else {
      args.push('nest', 'build');
    }
    
    if (options.watch) {
      args.push('--watch');
    }
    
    if (configFile) {
      args.push('--config', configFile);
    }
    
    return args;
  }
}

