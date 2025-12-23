#ifndef PERFORMANCE_MONITOR_H
#define PERFORMANCE_MONITOR_H

#include <napi.h>
#include <string>
#include <map>
#include <chrono>
#include <mutex>

struct OperationMetrics {
  long long totalDuration = 0; // in microseconds
  int callCount = 0;
  long long minDuration = -1;
  long long maxDuration = 0;
  double averageDuration = 0.0;
  int errorCount = 0;
  double successRate = 100.0;
};

class PerformanceMonitor {
public:
  static PerformanceMonitor& GetInstance();
  void StartOperation(const std::string& operationName);
  void EndOperation(const std::string& operationName);
  std::map<std::string, OperationMetrics> GetMetrics() const;
  void ResetMetrics();
  
  // Delete copy constructor and assignment operator to enforce singleton
  PerformanceMonitor(const PerformanceMonitor&) = delete;
  PerformanceMonitor& operator=(const PerformanceMonitor&) = delete;

private:
  PerformanceMonitor() = default;
  std::map<std::string, std::chrono::high_resolution_clock::time_point> startTimes_;
  std::map<std::string, OperationMetrics> metrics_;
  mutable std::mutex mutex_; // Mutex for thread-safe access
};

#endif // PERFORMANCE_MONITOR_H
