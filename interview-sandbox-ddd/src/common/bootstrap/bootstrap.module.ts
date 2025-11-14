import { Module } from '@nestjs/common';
import { AppBootstrapService } from './app-bootstrap.service';

/**
 * Bootstrap Module
 * 
 * Registers the bootstrap service that implements lifecycle hooks
 */
@Module({
  providers: [AppBootstrapService],
})
export class BootstrapModule {}

