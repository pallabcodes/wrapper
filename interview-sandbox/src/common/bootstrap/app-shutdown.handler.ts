import { INestApplication, Logger } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

export class AppShutdownHandler {
  private readonly logger = new Logger(AppShutdownHandler.name);
  private readonly shutdownTimeout = 30000; // 30 seconds

  private constructor(private readonly app: INestApplication) {
    this.setupSignalHandlers();
    this.setupErrorHandlers();
  }

  static handle(app: INestApplication): AppShutdownHandler {
    return new AppShutdownHandler(app);
  }

  private setupSignalHandlers(): void {
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
  }

  private setupErrorHandlers(): void {
    process.on('uncaughtException', (error: Error) => {
      this.logger.error('Uncaught Exception:', error.stack);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  private async shutdown(signal: string): Promise<void> {
    this.logger.log(`${signal} received. Starting graceful shutdown...`);

    const shutdownTimer = setTimeout(() => {
      this.logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      // Close database connections BEFORE closing HTTP server
      await this.closeDatabaseConnections();
      await this.closeHttpServer();

      clearTimeout(shutdownTimer);
      this.logger.log('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      clearTimeout(shutdownTimer);
      process.exit(1);
    }
  }

  private async closeHttpServer(): Promise<void> {
    await this.app.close();
    this.logger.log('HTTP server closed');
  }

  private async closeDatabaseConnections(): Promise<void> {
    try {
      // Use getConnectionToken() to get the correct Sequelize connection token
      const connectionToken = getConnectionToken();
      const sequelize = this.app.get<Sequelize>(connectionToken, { strict: false });
      
      if (sequelize && typeof sequelize.close === 'function') {
        await sequelize.close();
        this.logger.log('Database connections closed');
      } else {
        this.logger.debug('Sequelize connection not available or already closed');
      }
    } catch (error: any) {
      // Silently handle if Sequelize is not available or already closed
      // This is expected if database module is not configured or connection doesn't exist
      if (error?.name === 'UnknownElementException' || error?.message?.includes('does not exist')) {
        this.logger.debug('Database connection not registered, skipping closure');
      } else {
        this.logger.warn('Error closing database connections:', error?.message || error);
      }
    }
  }
}

