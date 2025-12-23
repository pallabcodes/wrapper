#include <napi.h>
#include "stream_operations.h"
#include "flow_control.h"
#include "performance_monitor.h"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  // Core stream operations
  exports.Set(Napi::String::New(env, "createReadableStream"), Napi::Function::New(env, CreateReadableStream));
  exports.Set(Napi::String::New(env, "createWritableStream"), Napi::Function::New(env, CreateWritableStream));
  exports.Set(Napi::String::New(env, "createTransformStream"), Napi::Function::New(env, CreateTransformStream));
  exports.Set(Napi::String::New(env, "createDuplexStream"), Napi::Function::New(env, CreateDuplexStream));
  
  // Enhanced stream operations
  exports.Set(Napi::String::New(env, "createEncryptedStream"), Napi::Function::New(env, CreateEncryptedStream));
  exports.Set(Napi::String::New(env, "createCompressedStream"), Napi::Function::New(env, CreateCompressedStream));
  exports.Set(Napi::String::New(env, "createMultiplexedStream"), Napi::Function::New(env, CreateMultiplexedStream));
  exports.Set(Napi::String::New(env, "createSplitterStream"), Napi::Function::New(env, CreateSplitterStream));
  exports.Set(Napi::String::New(env, "createMergerStream"), Napi::Function::New(env, CreateMergerStream));
  
  // Performance operations
  exports.Set(Napi::String::New(env, "optimizeStream"), Napi::Function::New(env, OptimizeStream));
  exports.Set(Napi::String::New(env, "monitorStream"), Napi::Function::New(env, MonitorStream));
  exports.Set(Napi::String::New(env, "analyzeStream"), Napi::Function::New(env, AnalyzeStream));
  
  // Flow control
  exports.Set(Napi::String::New(env, "enableBackpressure"), Napi::Function::New(env, EnableBackpressure));
  exports.Set(Napi::String::New(env, "enableRateLimiting"), Napi::Function::New(env, EnableRateLimiting));
  exports.Set(Napi::String::New(env, "enableCircuitBreaker"), Napi::Function::New(env, EnableCircuitBreaker));
  
  // Security operations
  exports.Set(Napi::String::New(env, "enableEncryption"), Napi::Function::New(env, EnableEncryption));
  exports.Set(Napi::String::New(env, "enableAuthentication"), Napi::Function::New(env, EnableAuthentication));
  exports.Set(Napi::String::New(env, "enableAuthorization"), Napi::Function::New(env, EnableAuthorization));
  
  // Monitoring operations
  exports.Set(Napi::String::New(env, "startMonitoring"), Napi::Function::New(env, StartMonitoring));
  exports.Set(Napi::String::New(env, "stopMonitoring"), Napi::Function::New(env, StopMonitoring));
  exports.Set(Napi::String::New(env, "getMetrics"), Napi::Function::New(env, GetMetrics));
  exports.Set(Napi::String::New(env, "getHealthCheck"), Napi::Function::New(env, GetHealthCheck));
  
  // Utility operations
  exports.Set(Napi::String::New(env, "validateStream"), Napi::Function::New(env, ValidateStream));
  exports.Set(Napi::String::New(env, "serializeStream"), Napi::Function::New(env, SerializeStream));
  exports.Set(Napi::String::New(env, "deserializeStream"), Napi::Function::New(env, DeserializeStream));
  
  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
