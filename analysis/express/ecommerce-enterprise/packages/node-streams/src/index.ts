/**
 * @ecommerce-enterprise/node-streams
 * 
 * Enhanced Node.js streams module with enterprise features:
 * - High-performance native C++ stream operations
 * - Advanced flow control and backpressure management
 * - Real-time monitoring and performance analytics
 * - Enterprise security and compliance features
 * - TypeScript-first design with NestJS integration
 */

// Import types first
import {
  StreamMetrics,
  StreamConfig,
  StreamOperation,
  StreamAuditEntry,
  StreamPerformanceAnalysis,
  StreamFilter,
  EncryptedStreamConfig,
  CompressedStreamConfig,
  MultiplexedStreamConfig,
  StreamSplitterConfig,
  StreamMergerConfig,
  StreamCircuitBreakerConfig,
  StreamRateLimiterConfig,
  StreamBackpressureConfig,
  StreamRetryConfig,
  StreamTimeoutConfig,
  StreamSecurityConfig,
  StreamMonitoringConfig,
  StreamComplianceConfig,
  StreamError,
  StreamEvent,
  StreamSubscription,
  StreamPool,
  StreamManager,
  StreamFactory,
  StreamValidator,
  StreamOptimizer,
  StreamAnalyzer,
  StreamReporter,
  StreamExporter,
  StreamImporter,
  StreamSerializer,
  StreamCompressor,
  StreamEncryptor,
  StreamAuthenticator,
  StreamAuthorizer,
  StreamAuditor,
  StreamMonitor,
  StreamAlert,
  StreamHealthCheck,
  StreamDiagnostics,
  StreamBenchmark,
  StreamTestSuite,
  StreamTestResult,
  StreamTestReport,
  StreamDocumentation,
  StreamConfiguration,
} from './types/streams.types';

// Re-export all types
export * from './types/streams.types';

// Import and re-export the core service
import { EnhancedStreamsService } from './core/enhanced-streams.service';
export { EnhancedStreamsService };

// Export the main service
export { EnhancedStreamsService as default };

// Export high-level APIs for better DX
export * from './apis/streams-api';
export * from './apis/fluent-streams';
