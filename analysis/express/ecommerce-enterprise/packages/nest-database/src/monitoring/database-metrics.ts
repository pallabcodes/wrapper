import { Injectable } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class DatabaseMetrics {
  // private readonly logger = new Logger(DatabaseMetrics.name);
  
  private readonly queryCounter: promClient.Counter;
  private readonly queryDuration: promClient.Histogram;
  private readonly errorCounter: promClient.Counter;
  private readonly cacheHitCounter: promClient.Counter;
  private readonly transactionCounter: promClient.Counter;
  private readonly transactionDuration: promClient.Histogram;

  constructor() {
    this.queryCounter = new promClient.Counter({
      name: 'database_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table'],
    });

    this.queryDuration = new promClient.Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
    });

    this.errorCounter = new promClient.Counter({
      name: 'database_errors_total',
      help: 'Total number of database errors',
      labelNames: ['operation', 'error_type'],
    });

    this.cacheHitCounter = new promClient.Counter({
      name: 'database_cache_hits_total',
      help: 'Total number of database cache hits',
    });

    this.transactionCounter = new promClient.Counter({
      name: 'database_transactions_total',
      help: 'Total number of database transactions',
      labelNames: ['status'],
    });

    this.transactionDuration = new promClient.Histogram({
      name: 'database_transaction_duration_seconds',
      help: 'Duration of database transactions in seconds',
      buckets: [0.01, 0.1, 0.5, 1, 5, 10, 30],
    });
  }

  recordQuery(operation: string, table: string, duration: number): void {
    this.queryCounter.inc({ operation, table });
    this.queryDuration.observe({ operation, table }, duration / 1000);
  }

  recordError(operation: string, errorType: string): void {
    this.errorCounter.inc({ operation, error_type: errorType });
  }

  recordCacheHit(): void {
    this.cacheHitCounter.inc();
  }

  recordTransaction(status: 'success' | 'error', duration: number): void {
    this.transactionCounter.inc({ status });
    this.transactionDuration.observe({ status }, duration / 1000);
  }

  async getMetrics(): Promise<string> {
    return promClient.register.metrics();
  }

  async resetMetrics(): Promise<void> {
    const registry = promClient.register as unknown as {
      resetMetrics?: () => void;
      clear?: () => void;
    };
    if (registry.resetMetrics) {
      registry.resetMetrics();
    } else if (registry.clear) {
      registry.clear();
    }
  }
}
