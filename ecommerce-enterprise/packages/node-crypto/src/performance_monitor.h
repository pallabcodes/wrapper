#ifndef PERFORMANCE_MONITOR_H
#define PERFORMANCE_MONITOR_H

#include <napi.h>
#include <string>
#include <map>
#include <vector>
#include <chrono>
#include <mutex>
#include <atomic>

namespace EnterpriseCrypto {

// Performance metrics structure
struct PerformanceMetric {
    std::string operation;
    double totalDuration;
    size_t callCount;
    double averageDuration;
    double minDuration;
    double maxDuration;
    size_t totalDataSize;
    double averageDataSize;
    std::chrono::system_clock::time_point lastCall;
    std::chrono::system_clock::time_point firstCall;
};

// Performance monitoring for crypto operations
class PerformanceMonitor {
public:
    static void Init(Napi::Env env, Napi::Object exports);
    
    // Core performance tracking
    static void RecordOperation(const std::string& operation, double duration, size_t dataSize = 0);
    static void StartTimer(const std::string& operation);
    static void EndTimer(const std::string& operation, size_t dataSize = 0);
    
    // Performance metrics retrieval
    static Napi::Value GetPerformanceMetrics(const Napi::CallbackInfo& info);
    static Napi::Value GetOperationMetrics(const Napi::CallbackInfo& info);
    static Napi::Value GetOverallMetrics(const Napi::CallbackInfo& info);
    static Napi::Value GetPerformanceTrends(const Napi::CallbackInfo& info);
    
    // Performance analysis
    static Napi::Value AnalyzePerformance(const Napi::CallbackInfo& info);
    static Napi::Value DetectPerformanceIssues(const Napi::CallbackInfo& info);
    static Napi::Value GetPerformanceRecommendations(const Napi::CallbackInfo& info);
    
    // Performance management
    static Napi::Value ResetMetrics(const Napi::CallbackInfo& info);
    static Napi::Value ClearOperationMetrics(const Napi::CallbackInfo& info);
    static Napi::Value SetPerformanceThresholds(const Napi::CallbackInfo& info);
    static Napi::Value GetPerformanceThresholds(const Napi::CallbackInfo& info);
    
    // Performance reporting
    static Napi::Value GeneratePerformanceReport(const Napi::CallbackInfo& info);
    static Napi::Value ExportPerformanceData(const Napi::CallbackInfo& info);
    static Napi::Value GetPerformanceAlerts(const Napi::CallbackInfo& info);
    
private:
    // Internal storage
    static std::map<std::string, PerformanceMetric> metrics;
    static std::map<std::string, std::chrono::high_resolution_clock::time_point> activeTimers;
    static std::mutex metricsMutex;
    static std::map<std::string, double> performanceThresholds;
    
    // Helper methods
    static void UpdateMetric(const std::string& operation, double duration, size_t dataSize);
    static double CalculatePercentile(const std::vector<double>& values, double percentile);
    static std::string FormatDuration(double duration);
    static bool IsPerformanceIssue(const PerformanceMetric& metric);
    static std::string GetPerformanceRecommendation(const PerformanceMetric& metric);
    
    // Performance analysis helpers
    static std::vector<double> GetDurationHistory(const std::string& operation);
    static double CalculateTrend(const std::vector<double>& values);
    static std::map<std::string, double> GetOperationComparison();
    static std::vector<std::string> GetSlowestOperations(int limit = 10);
    static std::vector<std::string> GetMostFrequentOperations(int limit = 10);
};

// Real-time performance monitoring
class RealTimeMonitor {
public:
    static void Init(Napi::Env env, Napi::Object exports);
    
    // Real-time monitoring
    static Napi::Value StartRealTimeMonitoring(const Napi::CallbackInfo& info);
    static Napi::Value StopRealTimeMonitoring(const Napi::CallbackInfo& info);
    static Napi::Value GetRealTimeMetrics(const Napi::CallbackInfo& info);
    static Napi::Value SetMonitoringInterval(const Napi::CallbackInfo& info);
    
    // Performance alerts
    static Napi::Value SetPerformanceAlert(const Napi::CallbackInfo& info);
    static Napi::Value GetActiveAlerts(const Napi::CallbackInfo& info);
    static Napi::Value ClearAlerts(const Napi::CallbackInfo& info);
    
private:
    static std::atomic<bool> isMonitoring;
    static std::chrono::milliseconds monitoringInterval;
    static std::map<std::string, double> alertThresholds;
    static std::vector<std::string> activeAlerts;
    static std::mutex alertMutex;
    
    static void MonitoringLoop();
    static void CheckPerformanceAlerts();
    static void TriggerAlert(const std::string& operation, const std::string& reason);
};

// Performance optimization utilities
class PerformanceOptimizer {
public:
    static void Init(Napi::Env env, Napi::Object exports);
    
    // Optimization suggestions
    static Napi::Value GetOptimizationSuggestions(const Napi::CallbackInfo& info);
    static Napi::Value AnalyzeBottlenecks(const Napi::CallbackInfo& info);
    static Napi::Value GetResourceUsage(const Napi::CallbackInfo& info);
    
    // Performance tuning
    static Napi::Value TunePerformance(const Napi::CallbackInfo& info);
    static Napi::Value SetPerformanceMode(const Napi::CallbackInfo& info);
    static Napi::Value GetPerformanceMode(const Napi::CallbackInfo& info);
    
private:
    static std::string GetOptimizationSuggestion(const PerformanceMetric& metric);
    static std::vector<std::string> IdentifyBottlenecks();
    static std::map<std::string, double> GetResourceUsageMetrics();
    static void ApplyPerformanceTuning(const std::string& operation, const std::string& suggestion);
};

// Performance benchmarking
class PerformanceBenchmark {
public:
    static void Init(Napi::Env env, Napi::Object exports);
    
    // Benchmarking operations
    static Napi::Value BenchmarkOperation(const Napi::CallbackInfo& info);
    static Napi::Value CompareOperations(const Napi::CallbackInfo& info);
    static Napi::Value RunStressTest(const Napi::CallbackInfo& info);
    
    // Benchmark results
    static Napi::Value GetBenchmarkResults(const Napi::CallbackInfo& info);
    static Napi::Value ExportBenchmarkData(const Napi::CallbackInfo& info);
    static Napi::Value GetBenchmarkHistory(const Napi::CallbackInfo& info);
    
private:
    static std::map<std::string, std::vector<double>> benchmarkResults;
    static std::mutex benchmarkMutex;
    
    static double RunSingleBenchmark(const std::string& operation, int iterations);
    static std::vector<double> RunMultipleBenchmarks(const std::string& operation, int iterations, int runs);
    static std::map<std::string, double> CalculateBenchmarkStats(const std::vector<double>& results);
};

} // namespace EnterpriseCrypto

#endif // PERFORMANCE_MONITOR_H
