import { Injectable } from '@nestjs/common';
import { Worker } from 'worker_threads';
import * as path from 'path';

/**
 * Worker Pool Service
 * 
 * Demonstrates using Worker Threads for CPU-intensive tasks
 * 
 * Use cases:
 * - Heavy computations (image processing, data transformation)
 * - CPU-bound tasks that would block the event loop
 * - Parallel processing of large datasets
 * - Cryptographic operations
 */
@Injectable()
export class WorkerPoolService {
  private workers: Worker[] = [];
  private readonly maxWorkers: number;
  private activeTasks = 0;

  constructor() {
    // Use number of CPU cores, but limit to reasonable number
    this.maxWorkers = Math.min(require('os').cpus().length, 4);
  }

  /**
   * Execute CPU-intensive task in worker thread
   */
  async executeTask<T>(taskData: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.activeTasks >= this.maxWorkers) {
        // In production, you'd want a queue here
        reject(new Error('Worker pool is busy'));
        return;
      }

      this.activeTasks++;
      const worker = this.createWorker();

      worker.on('message', (result: T) => {
        this.activeTasks--;
        worker.terminate();
        resolve(result);
      });

      worker.on('error', (error) => {
        this.activeTasks--;
        worker.terminate();
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          this.activeTasks--;
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });

      worker.postMessage(taskData);
    });
  }

  /**
   * Process array of items in parallel using worker threads
   */
  async processInParallel<T, R>(
    items: T[],
    processor: (item: T) => R,
    batchSize: number = 10,
  ): Promise<R[]> {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    const results: R[] = [];
    for (const batch of batches) {
      const batchPromises = batch.map((item) => this.executeTask<R>({ item, processor }));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  private createWorker(): Worker {
    // In production, this would point to the compiled JS file in dist/
    // For development, use the source file
    const workerPath = path.join(__dirname, 'worker.thread.js');
    return new Worker(workerPath);
  }

  /**
   * Cleanup all workers
   */
  async shutdown(): Promise<void> {
    const terminationPromises = this.workers.map((worker) => worker.terminate());
    await Promise.all(terminationPromises);
    this.workers = [];
  }
}

