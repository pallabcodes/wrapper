/**
 * Enhanced Streams Module
 * 
 * NestJS module for integrating the enhanced streams functionality
 * with enterprise features and performance optimizations.
 */

import type { NestJSDecorator } from '../types/streams-custom.types';

// Optional NestJS imports - will work even if NestJS is not installed
let Module: NestJSDecorator;
let Global: NestJSDecorator;

try {
  const nestjs = require('@nestjs/common');
  Module = nestjs.Module;
  Global = nestjs.Global;
} catch (error) {
  // Fallback implementations for when NestJS is not available
  Module = function(config: unknown) { return function(target: unknown) { return target; }; };
  Global = function(target: unknown) { return target; };
}
import { StreamsService } from './streams.service';

@Global()
@Module({
  providers: [StreamsService],
  exports: [StreamsService],
})
export class StreamsModule {}
