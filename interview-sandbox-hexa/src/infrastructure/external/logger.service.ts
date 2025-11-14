import { Injectable, Inject } from '@nestjs/common';
import { LOGGER_TOKEN } from '../../common/di/tokens';

/**
 * Logger Service Implementation
 * 
 * Demonstrates using Symbol token with @Inject() decorator
 */
export interface ILogger {
  log(message: string, context?: string): void;
  error(message: string, trace?: string, context?: string): void;
  warn(message: string, context?: string): void;
  debug(message: string, context?: string): void;
}

@Injectable()
export class LoggerService implements ILogger {
  log(message: string, context?: string): void {
    const prefix = context ? `[${context}]` : '';
    console.log(`${prefix} ${message}`);
  }

  error(message: string, trace?: string, context?: string): void {
    const prefix = context ? `[${context}]` : '';
    console.error(`${prefix} ${message}`, trace || '');
  }

  warn(message: string, context?: string): void {
    const prefix = context ? `[${context}]` : '';
    console.warn(`${prefix} ${message}`);
  }

  debug(message: string, context?: string): void {
    const prefix = context ? `[${context}]` : '';
    console.debug(`${prefix} ${message}`);
  }
}

/**
 * Service that uses Logger via Symbol token injection
 */
@Injectable()
export class UserService {
  constructor(
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
  ) {}

  async createUser(email: string): Promise<void> {
    this.logger.log(`Creating user with email: ${email}`, 'UserService');
    // User creation logic here
  }
}

