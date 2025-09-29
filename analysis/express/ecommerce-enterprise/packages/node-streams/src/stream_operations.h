#ifndef STREAM_OPERATIONS_H
#define STREAM_OPERATIONS_H

#include <napi.h>
#include <memory>
#include <string>
#include <vector>
#include <map>

// Core stream operations
Napi::Value CreateReadableStream(const Napi::CallbackInfo& info);
Napi::Value CreateWritableStream(const Napi::CallbackInfo& info);
Napi::Value CreateTransformStream(const Napi::CallbackInfo& info);
Napi::Value CreateDuplexStream(const Napi::CallbackInfo& info);

// Enhanced stream operations
Napi::Value CreateEncryptedStream(const Napi::CallbackInfo& info);
Napi::Value CreateCompressedStream(const Napi::CallbackInfo& info);
Napi::Value CreateMultiplexedStream(const Napi::CallbackInfo& info);
Napi::Value CreateSplitterStream(const Napi::CallbackInfo& info);
Napi::Value CreateMergerStream(const Napi::CallbackInfo& info);

// Performance operations
Napi::Value OptimizeStream(const Napi::CallbackInfo& info);
Napi::Value MonitorStream(const Napi::CallbackInfo& info);
Napi::Value AnalyzeStream(const Napi::CallbackInfo& info);

// Security operations
Napi::Value EnableEncryption(const Napi::CallbackInfo& info);
Napi::Value EnableAuthentication(const Napi::CallbackInfo& info);
Napi::Value EnableAuthorization(const Napi::CallbackInfo& info);

// Utility operations
Napi::Value ValidateStream(const Napi::CallbackInfo& info);
Napi::Value SerializeStream(const Napi::CallbackInfo& info);
Napi::Value DeserializeStream(const Napi::CallbackInfo& info);

// Helper functions
std::string GenerateStreamId();
Napi::Object CreateStreamResult(Napi::Env env, const std::string& streamId, const std::string& type, const std::string& algorithm);
Napi::Object CreateMetricsObject(Napi::Env env, double bytesProcessed, double chunksProcessed, double throughput, double latency);

#endif // STREAM_OPERATIONS_H
