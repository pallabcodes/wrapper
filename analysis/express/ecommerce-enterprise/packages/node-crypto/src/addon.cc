#include <napi.h>
#include <node_api.h>
#include "crypto_operations.h"
#include "audit_trail.h"
#include "performance_monitor.h"

// Initialize the addon
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  // Initialize crypto operations
  CryptoOperations::Init(env, exports);
  
  // Initialize audit trail
  AuditTrail::Init(env, exports);
  
  // Initialize performance monitor
  PerformanceMonitor::Init(env, exports);
  
  return exports;
}

NODE_API_MODULE(node_crypto_addon, Init)
