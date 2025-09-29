#ifndef FLOW_CONTROL_H
#define FLOW_CONTROL_H

#include <napi.h>
#include <memory>
#include <string>
#include <map>
#include <chrono>

// Flow control operations
Napi::Value EnableBackpressure(const Napi::CallbackInfo& info);
Napi::Value EnableRateLimiting(const Napi::CallbackInfo& info);
Napi::Value EnableCircuitBreaker(const Napi::CallbackInfo& info);

// Monitoring operations
Napi::Value StartMonitoring(const Napi::CallbackInfo& info);
Napi::Value StopMonitoring(const Napi::CallbackInfo& info);
Napi::Value GetMetrics(const Napi::CallbackInfo& info);
Napi::Value GetHealthCheck(const Napi::CallbackInfo& info);

// Helper functions
std::string GetCurrentTimestamp();
long long GetCurrentTimestampMs();

#endif // FLOW_CONTROL_H
