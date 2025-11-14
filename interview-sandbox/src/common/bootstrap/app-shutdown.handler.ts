import { INestApplication, Logger } from '@nestjs/common';

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
      await this.closeHttpServer();
      await this.closeDatabaseConnections();

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
      const sequelize = this.app.get('SEQUELIZE');
      if (sequelize && typeof sequelize.close === 'function') {
        await sequelize.close();
        this.logger.log('Database connections closed');
      }
    } catch (error) {
      this.logger.warn('Error closing database connections:', error);
    }
  }
}

