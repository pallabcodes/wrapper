/**
 * Enhanced Streams Service
 * 
 * NestJS injectable service that provides enterprise-grade stream operations
 * with performance monitoring, security, and compliance features.
 */

import type { NestJSDecorator } from '../types/streams-custom.types';

// Optional NestJS imports - will work even if NestJS is not installed
let Injectable: NestJSDecorator;
let Logger: typeof LoggerClass;

try {
  const nestjs = require('@nestjs/common');
  Injectable = nestjs.Injectable;
  Logger = nestjs.Logger;
} catch (error) {
  // Fallback implementations for when NestJS is not available
  Injectable = function(target: unknown) { return target; };
  Logger = LoggerClass;
}

class LoggerClass {
  constructor(private context: string) {}
  debug(message: string) { console.debug(`[${this.context}] ${message}`); }
  log(message: string) { console.log(`[${this.context}] ${message}`); }
  warn(message: string) { console.warn(`[${this.context}] ${message}`); }
  error(message: string) { console.error(`[${this.context}] ${message}`); }
}
import { EnhancedStreamsService } from '../core/enhanced-streams.service';
import { 
  StreamConfig, 
  StreamMetrics, 
  StreamAuditEntry, 
  StreamPerformanceAnalysis,
  StreamFilter,
  EncryptedStreamConfig,
  CompressedStreamConfig,
  MultiplexedStreamConfig,
  StreamSplitterConfig,
  StreamMergerConfig,
} from '../types/streams.types';

@Injectable()
export class StreamsService {
  private readonly logger = new Logger(StreamsService.name);
  private streamsService: EnhancedStreamsService;

  constructor() {
    this.streamsService = new EnhancedStreamsService({
      global: {
        enableEncryption: false,
        enableCompression: false,
        enableMonitoring: true,
        enableBackpressure: true,
        enableRateLimiting: false,
        maxThroughput: 0,
        maxConcurrency: 0,
        retryAttempts: 3,
        retryDelay: 1000,
        timeout: 30000,
      },
      security: {
        enableAuthentication: false,
        enableAuthorization: false,
        enableEncryption: false,
        enableIntegrityCheck: false,
        enableRateLimiting: false,
        enableAuditLogging: true,
        allowedOrigins: [],
        allowedMethods: [],
        allowedHeaders: [],
        maxRequestSize: 1024 * 1024, // 1MB
        maxResponseSize: 1024 * 1024, // 1MB
      },
      monitoring: {
        enableMetrics: true,
        enableTracing: false,
        enableProfiling: false,
        enableAlerting: false,
        metricsInterval: 5000,
        tracingSampleRate: 0.1,
        profilingSampleRate: 0.01,
        alertThresholds: {
          highLatency: 1000,
          highErrorRate: 0.05,
          highMemoryUsage: 0.8,
          lowThroughput: 1000,
        },
      },
      compliance: {
        enableSOX: false,
        enableGDPR: false,
        enableHIPAA: false,
        enablePCI: false,
        dataRetentionDays: 2555, // 7 years
        auditLogRetentionDays: 2555, // 7 years
        enableDataAnonymization: false,
        enableDataEncryption: false,
        enableAccessLogging: true,
        enableDataClassification: false,
      },
    });
  }

  // Core stream creation methods
  async createReadableStream(config: Partial<StreamConfig> = {}): Promise<NodeJS.ReadableStream> {
    this.logger.debug('Creating readable stream');
    try {
      const stream = this.streamsService.createReadableStream(config);
      this.logger.log('Readable stream created successfully');
      return stream;
    } catch (error) {
      this.logger.error(`Failed to create readable stream: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async createWritableStream(config: Partial<StreamConfig> = {}): Promise<NodeJS.WritableStream> {
    this.logger.debug('Creating writable stream');
    try {
      const stream = this.streamsService.createWritableStream(config);
      this.logger.log('Writable stream created successfully');
      return stream;
    } catch (error) {
      this.logger.error(`Failed to create writable stream: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async createTransformStream(config: Partial<StreamConfig> = {}): Promise<NodeJS.TransformStream> {
    this.logger.debug('Creating transform stream');
    try {
      const stream = this.streamsService.createTransformStream(config);
      this.logger.log('Transform stream created successfully');
      return stream;
    } catch (error) {
      this.logger.error(`Failed to create transform stream: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async createDuplexStream(config: Partial<StreamConfig> = {}): Promise<NodeJS.DuplexStream> {
    this.logger.debug('Creating duplex stream');
    try {
      const stream = this.streamsService.createDuplexStream(config);
      this.logger.log('Duplex stream created successfully');
      return stream;
    } catch (error) {
      this.logger.error(`Failed to create duplex stream: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // Enhanced stream creation methods
  async createEncryptedStream(config: EncryptedStreamConfig): Promise<NodeJS.TransformStream> {
    this.logger.debug('Creating encrypted stream');
    try {
      const stream = this.streamsService.createEncryptedStream(config);
      this.logger.log('Encrypted stream created successfully');
      return stream;
    } catch (error) {
      this.logger.error(`Failed to create encrypted stream: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async createCompressedStream(config: CompressedStreamConfig): Promise<NodeJS.TransformStream> {
    this.logger.debug('Creating compressed stream');
    try {
      const stream = this.streamsService.createCompressedStream(config);
      this.logger.log('Compressed stream created successfully');
      return stream;
    } catch (error) {
      this.logger.error(`Failed to create compressed stream: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async createMultiplexedStream(config: MultiplexedStreamConfig): Promise<NodeJS.DuplexStream> {
    this.logger.debug('Creating multiplexed stream');
    try {
      const stream = this.streamsService.createMultiplexedStream(config);
      this.logger.log('Multiplexed stream created successfully');
      return stream;
    } catch (error) {
      this.logger.error(`Failed to create multiplexed stream: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async createSplitterStream(config: StreamSplitterConfig): Promise<NodeJS.TransformStream> {
    this.logger.debug('Creating splitter stream');
    try {
      const stream = this.streamsService.createSplitterStream(config);
      this.logger.log('Splitter stream created successfully');
      return stream;
    } catch (error) {
      this.logger.error(`Failed to create splitter stream: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async createMergerStream(config: StreamMergerConfig): Promise<any> {
    this.logger.debug('Creating merger stream');
    try {
      const stream = this.streamsService.createMergerStream(config);
      this.logger.log('Merger stream created successfully');
      return stream;
    } catch (error) {
      this.logger.error(`Failed to create merger stream: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // Performance monitoring
  async getStreamMetrics(streamId: string): Promise<StreamMetrics | null> {
    this.logger.debug(`Getting metrics for stream: ${streamId}`);
    try {
      const metrics = this.streamsService.getStreamMetrics(streamId);
      this.logger.log(`Metrics retrieved for stream: ${streamId}`);
      return metrics;
    } catch (error) {
      this.logger.error(`Failed to get metrics for stream ${streamId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getAllStreamMetrics(): Promise<Map<string, StreamMetrics>> {
    this.logger.debug('Getting all stream metrics');
    try {
      const metrics = this.streamsService.getAllStreamMetrics();
      this.logger.log('All stream metrics retrieved');
      return metrics;
    } catch (error) {
      this.logger.error(`Failed to get all stream metrics: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getStreamPerformanceAnalysis(streamId: string): Promise<StreamPerformanceAnalysis> {
    this.logger.debug(`Getting performance analysis for stream: ${streamId}`);
    try {
      const analysis = this.streamsService.getStreamPerformanceAnalysis(streamId);
      this.logger.log(`Performance analysis retrieved for stream: ${streamId}`);
      return analysis;
    } catch (error) {
      this.logger.error(`Failed to get performance analysis for stream ${streamId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // Audit trail
  async getAuditLog(filter?: StreamFilter): Promise<StreamAuditEntry[]> {
    this.logger.debug('Getting audit log');
    try {
      const auditLog = this.streamsService.getAuditLog(filter);
      this.logger.log(`Audit log retrieved with ${auditLog.length} entries`);
      return auditLog;
    } catch (error) {
      this.logger.error(`Failed to get audit log: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async exportAuditLog(format: 'json' | 'csv' | 'xml' = 'json'): Promise<string | StreamAuditEntry[]> {
    this.logger.debug(`Exporting audit log in ${format} format`);
    try {
      const result = this.streamsService.exportAuditLog(format);
      this.logger.log(`Audit log exported in ${format} format`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to export audit log: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // Configuration management
  async updateConfig(newConfig: StreamConfiguration): Promise<void> {
    this.logger.debug('Updating streams configuration');
    try {
      this.streamsService.updateConfig(newConfig);
      this.logger.log('Streams configuration updated successfully');
    } catch (error) {
      this.logger.error(`Failed to update configuration: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getConfig(): Promise<any> {
    this.logger.debug('Getting streams configuration');
    try {
      const config = this.streamsService.getConfig();
      this.logger.log('Streams configuration retrieved');
      return config;
    } catch (error) {
      this.logger.error(`Failed to get configuration: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // Health check
  async getHealthStatus(): Promise<any> {
    this.logger.debug('Getting streams health status');
    try {
      const allMetrics = await this.getAllStreamMetrics();
      const totalStreams = allMetrics.size;
      const activeStreams = Array.from(allMetrics.values()).filter(m => !m.endTime).length;
      
      const totalBytesProcessed = Array.from(allMetrics.values()).reduce((sum, m) => sum + m.bytesProcessed, 0);
      const totalThroughput = Array.from(allMetrics.values()).reduce((sum, m) => sum + m.throughput, 0);
      const averageThroughput = totalStreams > 0 ? totalThroughput / totalStreams : 0;
      
      const totalErrors = Array.from(allMetrics.values()).reduce((sum, m) => sum + m.errorCount, 0);
      const totalChunks = Array.from(allMetrics.values()).reduce((sum, m) => sum + m.chunksProcessed, 0);
      const errorRate = totalChunks > 0 ? (totalErrors / totalChunks) * 100 : 0;
      
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        streams: {
          total: totalStreams,
          active: activeStreams,
          inactive: totalStreams - activeStreams,
        },
        performance: {
          totalBytesProcessed,
          averageThroughput,
          errorRate,
        },
        uptime: process.uptime(),
        version: '1.0.0',
      };
      
      this.logger.log('Streams health status retrieved');
      return healthStatus;
    } catch (error) {
      this.logger.error(`Failed to get health status: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
