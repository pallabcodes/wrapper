#include "performance_monitor.h"

PerformanceMonitor& PerformanceMonitor::GetInstance() {
  static PerformanceMonitor instance;
  return instance;
}

void PerformanceMonitor::StartOperation(const std::string& operationName) {
  std::lock_guard<std::mutex> lock(mutex_);
  startTimes_[operationName] = std::chrono::high_resolution_clock::now();
}

void PerformanceMonitor::EndOperation(const std::string& operationName) {
  std::lock_guard<std::mutex> lock(mutex_);
  auto endTime = std::chrono::high_resolution_clock::now();
  
  if (startTimes_.count(operationName)) {
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(
      endTime - startTimes_[operationName]
    ).count();
    
    OperationMetrics& metric = metrics_[operationName];
    metric.totalDuration += duration;
    metric.callCount++;
    
    if (metric.minDuration == -1 || duration < metric.minDuration) {
      metric.minDuration = duration;
    }
    if (duration > metric.maxDuration) {
      metric.maxDuration = duration;
    }
    
    metric.averageDuration = static_cast<double>(metric.totalDuration) / metric.callCount;
    metric.successRate = metric.callCount > 0 ? 
      ((metric.callCount - metric.errorCount) / static_cast<double>(metric.callCount)) * 100.0 : 100.0;
    
    startTimes_.erase(operationName); // Clear start time
  }
}

std::map<std::string, OperationMetrics> PerformanceMonitor::GetMetrics() const {
  std::lock_guard<std::mutex> lock(mutex_);
  return metrics_;
}

void PerformanceMonitor::ResetMetrics() {
  std::lock_guard<std::mutex> lock(mutex_);
  metrics_.clear();
  startTimes_.clear();
}
