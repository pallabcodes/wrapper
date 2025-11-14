import { Module } from '@nestjs/common';
import { LazyModuleLoaderService } from './lazy-module-loader.service';

/**
 * Lazy Loading Module
 * 
 * Provides service for lazy loading other modules
 */
@Module({
  providers: [LazyModuleLoaderService],
  exports: [LazyModuleLoaderService],
})
export class LazyLoadingModule {}

