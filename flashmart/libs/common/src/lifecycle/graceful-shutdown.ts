import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Graceful Shutdown Handler
 * 
 * Handles service crashes and restarts properly:
 * 1. Stops accepting new requests
 * 2. Waits for in-flight requests to complete
 * 3. Closes database connections
 * 4. Deregisters from service registry
 * 5. Exits cleanly
 * 
 * In K8s: Works with preStop hooks and SIGTERM
 */
@Injectable()
export class GracefulShutdownService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger('GracefulShutdown');
    private isShuttingDown = false;
    private activeConnections = 0;
    private readonly shutdownTimeout: number;
    private readonly cleanupCallbacks: Array<() => Promise<void>> = [];

    constructor(private readonly config: ConfigService) {
        this.shutdownTimeout = parseInt(config.get('SHUTDOWN_TIMEOUT_MS', '30000'), 10);
    }

    onModuleInit() {
        // Register signal handlers
        process.on('SIGTERM', () => this.shutdown('SIGTERM'));
        process.on('SIGINT', () => this.shutdown('SIGINT'));
        process.on('SIGUSR2', () => this.shutdown('SIGUSR2')); // Nodemon restart

        this.logger.log('Graceful shutdown handlers registered');
    }

    async onModuleDestroy() {
        // NestJS will call this during shutdown
        this.logger.log('Module destruction started');
    }

    // Track active connections
    incrementConnections(): void {
        this.activeConnections++;
    }

    decrementConnections(): void {
        this.activeConnections--;
    }

    isShutdown(): boolean {
        return this.isShuttingDown;
    }

    // Register cleanup callbacks (database connections, message queues, etc.)
    registerCleanup(callback: () => Promise<void>): void {
        this.cleanupCallbacks.push(callback);
    }

    private async shutdown(signal: string) {
        if (this.isShuttingDown) {
            this.logger.warn('Shutdown already in progress');
            return;
        }

        this.isShuttingDown = true;
        this.logger.log(`Received ${signal}, starting graceful shutdown...`);

        // Start shutdown timer
        const shutdownTimer = setTimeout(() => {
            this.logger.error('Shutdown timeout exceeded, forcing exit');
            process.exit(1);
        }, this.shutdownTimeout);

        try {
            // 1. Stop accepting new requests
            this.logger.log('Stopping new request acceptance...');

            // 2. Wait for active connections to drain
            await this.waitForConnectionsDrain();

            // 3. Run cleanup callbacks
            this.logger.log('Running cleanup callbacks...');
            for (const callback of this.cleanupCallbacks) {
                try {
                    await callback();
                } catch (error) {
                    this.logger.error('Cleanup callback failed:', error);
                }
            }

            // 4. Clear timer and exit
            clearTimeout(shutdownTimer);
            this.logger.log('Graceful shutdown complete');
            process.exit(0);
        } catch (error) {
            this.logger.error('Error during shutdown:', error);
            clearTimeout(shutdownTimer);
            process.exit(1);
        }
    }

    private async waitForConnectionsDrain(maxWaitMs = 15000): Promise<void> {
        const startTime = Date.now();

        while (this.activeConnections > 0) {
            if (Date.now() - startTime > maxWaitMs) {
                this.logger.warn(`${this.activeConnections} connections still active after drain timeout`);
                break;
            }
            this.logger.log(`Waiting for ${this.activeConnections} active connections...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        this.logger.log('All connections drained');
    }
}

/**
 * Connection Tracking Middleware
 */
export function createConnectionTracker(shutdownService: GracefulShutdownService) {
    return (req: any, res: any, next: any) => {
        // Reject new requests during shutdown
        if (shutdownService.isShutdown()) {
            res.status(503).json({
                error: 'Service is shutting down',
                retryAfter: 30,
            });
            return;
        }

        shutdownService.incrementConnections();

        res.on('finish', () => {
            shutdownService.decrementConnections();
        });

        res.on('close', () => {
            shutdownService.decrementConnections();
        });

        next();
    };
}
