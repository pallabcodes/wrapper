import { Module } from '@nestjs/common';
import { WorkerPoolService } from './worker-pool.service';

/**
 * Worker Threads Module
 * 
 * Provides worker thread pool for CPU-intensive tasks
 */
@Module({
  providers: [WorkerPoolService],
  exports: [WorkerPoolService],
})
export class WorkerThreadsModule {}

