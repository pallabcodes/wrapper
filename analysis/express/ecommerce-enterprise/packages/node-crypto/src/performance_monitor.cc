#include "performance_monitor.h"
#include <algorithm>
#include <numeric>
#include <sstream>
#include <iomanip>

namespace EnterpriseCrypto {

// Static member definitions
std::map<std::string, PerformanceMetric> PerformanceMonitor::metrics;
std::map<std::string, std::chrono::high_resolution_clock::time_point> PerformanceMonitor::activeTimers;
std::mutex PerformanceMonitor::metricsMutex;
std::map<std::string, double> PerformanceMonitor::performanceThresholds;

std::atomic<bool> RealTimeMonitor::isMonitoring{false};
std::chrono::milliseconds RealTimeMonitor::monitoringInterval{1000};
std::map<std::string, double> RealTimeMonitor::alertThresholds;
std::vector<std::string> RealTimeMonitor::activeAlerts;
std::mutex RealTimeMonitor::alertMutex;

std::map<std::string, std::vector<double>> PerformanceBenchmark::benchmarkResults;
std::mutex PerformanceBenchmark::benchmarkMutex;

// Initialize performance monitoring system
void PerformanceMonitor::Init(Napi::Env env, Napi::Object exports) {
    // Core performance tracking
    exports.Set("recordOperation", Napi::Function::New(env, [](const Napi::CallbackInfo& info) {
        if (info.Length() >= 2) {
            std::string operation = info[0].As<Napi::String>().Utf8Value();
            double duration = info[1].As<Napi::Number>().DoubleValue();
            size_t dataSize = info.Length() > 2 ? info[2].As<Napi::Number>().Uint32Value() : 0;
            
            RecordOperation(operation, duration, dataSize);
        }
        return env.Undefined();
    }));
    
    exports.Set("startTimer", Napi::Function::New(env, [](const Napi::CallbackInfo& info) {
        if (info.Length() >= 1) {
            std::string operation = info[0].As<Napi::String>().Utf8Value();
            StartTimer(operation);
        }
        return env.Undefined();
    }));
    
    exports.Set("endTimer", Napi::Function::New(env, [](const Napi::CallbackInfo& info) {
        if (info.Length() >= 1) {
            std::string operation = info[0].As<Napi::String>().Utf8Value();
            size_t dataSize = info.Length() > 1 ? info[1].As<Napi::Number>().Uint32Value() : 0;
            EndTimer(operation, dataSize);
        }
        return env.Undefined();
    }));
    
    // Performance metrics retrieval
    exports.Set("getPerformanceMetrics", Napi::Function::New(env, GetPerformanceMetrics));
    exports.Set("getOperationMetrics", Napi::Function::New(env, GetOperationMetrics));
    exports.Set("getOverallMetrics", Napi::Function::New(env, GetOverallMetrics));
    exports.Set("getPerformanceTrends", Napi::Function::New(env, GetPerformanceTrends));
    
    // Performance analysis
    exports.Set("analyzePerformance", Napi::Function::New(env, AnalyzePerformance));
    exports.Set("detectPerformanceIssues", Napi::Function::New(env, DetectPerformanceIssues));
    exports.Set("getPerformanceRecommendations", Napi::Function::New(env, GetPerformanceRecommendations));
    
    // Performance management
    exports.Set("resetMetrics", Napi::Function::New(env, ResetMetrics));
    exports.Set("clearOperationMetrics", Napi::Function::New(env, ClearOperationMetrics));
    exports.Set("setPerformanceThresholds", Napi::Function::New(env, SetPerformanceThresholds));
    exports.Set("getPerformanceThresholds", Napi::Function::New(env, GetPerformanceThresholds));
    
    // Performance reporting
    exports.Set("generatePerformanceReport", Napi::Function::New(env, GeneratePerformanceReport));
    exports.Set("exportPerformanceData", Napi::Function::New(env, ExportPerformanceData));
    exports.Set("getPerformanceAlerts", Napi::Function::New(env, GetPerformanceAlerts));
}

// Record a performance metric
void PerformanceMonitor::RecordOperation(const std::string& operation, double duration, size_t dataSize) {
    std::lock_guard<std::mutex> lock(metricsMutex);
    UpdateMetric(operation, duration, dataSize);
}

// Start a performance timer
void PerformanceMonitor::StartTimer(const std::string& operation) {
    std::lock_guard<std::mutex> lock(metricsMutex);
    activeTimers[operation] = std::chrono::high_resolution_clock::now();
}

// End a performance timer and record the metric
void PerformanceMonitor::EndTimer(const std::string& operation, size_t dataSize) {
    std::lock_guard<std::mutex> lock(metricsMutex);
    
    auto it = activeTimers.find(operation);
    if (it != activeTimers.end()) {
        auto endTime = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration<double, std::milli>(endTime - it->second).count();
        
        UpdateMetric(operation, duration, dataSize);
        activeTimers.erase(it);
    }
}

// Update performance metric
void PerformanceMonitor::UpdateMetric(const std::string& operation, double duration, size_t dataSize) {
    auto it = metrics.find(operation);
    if (it == metrics.end()) {
        // Create new metric
        PerformanceMetric metric;
        metric.operation = operation;
        metric.totalDuration = duration;
        metric.callCount = 1;
        metric.averageDuration = duration;
        metric.minDuration = duration;
        metric.maxDuration = duration;
        metric.totalDataSize = dataSize;
        metric.averageDataSize = dataSize;
        metric.lastCall = std::chrono::system_clock::now();
        metric.firstCall = std::chrono::system_clock::now();
        
        metrics[operation] = metric;
    } else {
        // Update existing metric
        PerformanceMetric& metric = it->second;
        metric.totalDuration += duration;
        metric.callCount++;
        metric.averageDuration = metric.totalDuration / metric.callCount;
        metric.minDuration = std::min(metric.minDuration, duration);
        metric.maxDuration = std::max(metric.maxDuration, duration);
        metric.totalDataSize += dataSize;
        metric.averageDataSize = metric.totalDataSize / metric.callCount;
        metric.lastCall = std::chrono::system_clock::now();
    }
}

// Get performance metrics for all operations
Napi::Value PerformanceMonitor::GetPerformanceMetrics(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::lock_guard<std::mutex> lock(metricsMutex);
    
    Napi::Object result = Napi::Object::New(env);
    
    for (const auto& pair : metrics) {
        Napi::Object metric = Napi::Object::New(env);
        metric.Set("operation", pair.second.operation);
        metric.Set("totalDuration", pair.second.totalDuration);
        metric.Set("callCount", pair.second.callCount);
        metric.Set("averageDuration", pair.second.averageDuration);
        metric.Set("minDuration", pair.second.minDuration);
        metric.Set("maxDuration", pair.second.maxDuration);
        metric.Set("totalDataSize", pair.second.totalDataSize);
        metric.Set("averageDataSize", pair.second.averageDataSize);
        
        // Convert timestamps to ISO strings
        auto time_t = std::chrono::system_clock::to_time_t(pair.second.lastCall);
        std::stringstream ss;
        ss << std::put_time(std::gmtime(&time_t), "%Y-%m-%dT%H:%M:%SZ");
        metric.Set("lastCall", ss.str());
        
        result.Set(pair.first, metric);
    }
    
    return result;
}

// Get performance metrics for a specific operation
Napi::Value PerformanceMonitor::GetOperationMetrics(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected operation parameter").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string operation = info[0].As<Napi::String>().Utf8Value();
    std::lock_guard<std::mutex> lock(metricsMutex);
    
    auto it = metrics.find(operation);
    if (it == metrics.end()) {
        return env.Null();
    }
    
    Napi::Object metric = Napi::Object::New(env);
    metric.Set("operation", it->second.operation);
    metric.Set("totalDuration", it->second.totalDuration);
    metric.Set("callCount", it->second.callCount);
    metric.Set("averageDuration", it->second.averageDuration);
    metric.Set("minDuration", it->second.minDuration);
    metric.Set("maxDuration", it->second.maxDuration);
    metric.Set("totalDataSize", it->second.totalDataSize);
    metric.Set("averageDataSize", it->second.averageDataSize);
    
    // Convert timestamps to ISO strings
    auto time_t = std::chrono::system_clock::to_time_t(it->second.lastCall);
    std::stringstream ss;
    ss << std::put_time(std::gmtime(&time_t), "%Y-%m-%dT%H:%M:%SZ");
    metric.Set("lastCall", ss.str());
    
    return metric;
}

// Get overall performance metrics
Napi::Value PerformanceMonitor::GetOverallMetrics(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::lock_guard<std::mutex> lock(metricsMutex);
    
    Napi::Object result = Napi::Object::New(env);
    
    if (metrics.empty()) {
        result.Set("totalOperations", 0);
        result.Set("totalDuration", 0.0);
        result.Set("averageDuration", 0.0);
        result.Set("totalDataSize", 0);
        return result;
    }
    
    double totalDuration = 0.0;
    size_t totalCalls = 0;
    size_t totalDataSize = 0;
    double minDuration = std::numeric_limits<double>::max();
    double maxDuration = 0.0;
    
    for (const auto& pair : metrics) {
        totalDuration += pair.second.totalDuration;
        totalCalls += pair.second.callCount;
        totalDataSize += pair.second.totalDataSize;
        minDuration = std::min(minDuration, pair.second.minDuration);
        maxDuration = std::max(maxDuration, pair.second.maxDuration);
    }
    
    result.Set("totalOperations", metrics.size());
    result.Set("totalCalls", totalCalls);
    result.Set("totalDuration", totalDuration);
    result.Set("averageDuration", totalCalls > 0 ? totalDuration / totalCalls : 0.0);
    result.Set("minDuration", minDuration);
    result.Set("maxDuration", maxDuration);
    result.Set("totalDataSize", totalDataSize);
    result.Set("averageDataSize", totalCalls > 0 ? totalDataSize / totalCalls : 0.0);
    
    return result;
}

// Analyze performance and detect issues
Napi::Value PerformanceMonitor::AnalyzePerformance(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::lock_guard<std::mutex> lock(metricsMutex);
    
    Napi::Object analysis = Napi::Object::New(env);
    
    // Find slowest operations
    std::vector<std::pair<std::string, double>> slowestOps;
    for (const auto& pair : metrics) {
        slowestOps.push_back({pair.first, pair.second.averageDuration});
    }
    
    std::sort(slowestOps.begin(), slowestOps.end(), 
              [](const auto& a, const auto& b) { return a.second > b.second; });
    
    Napi::Array slowestArray = Napi::Array::New(env, std::min(5, (int)slowestOps.size()));
    for (int i = 0; i < std::min(5, (int)slowestOps.size()); i++) {
        Napi::Object op = Napi::Object::New(env);
        op.Set("operation", slowestOps[i].first);
        op.Set("averageDuration", slowestOps[i].second);
        slowestArray.Set(i, op);
    }
    analysis.Set("slowestOperations", slowestArray);
    
    // Find most frequent operations
    std::vector<std::pair<std::string, size_t>> frequentOps;
    for (const auto& pair : metrics) {
        frequentOps.push_back({pair.first, pair.second.callCount});
    }
    
    std::sort(frequentOps.begin(), frequentOps.end(), 
              [](const auto& a, const auto& b) { return a.second > b.second; });
    
    Napi::Array frequentArray = Napi::Array::New(env, std::min(5, (int)frequentOps.size()));
    for (int i = 0; i < std::min(5, (int)frequentOps.size()); i++) {
        Napi::Object op = Napi::Object::New(env);
        op.Set("operation", frequentOps[i].first);
        op.Set("callCount", frequentOps[i].second);
        frequentArray.Set(i, op);
    }
    analysis.Set("mostFrequentOperations", frequentArray);
    
    // Performance issues
    Napi::Array issuesArray = Napi::Array::New(env, 0);
    int issueCount = 0;
    for (const auto& pair : metrics) {
        if (IsPerformanceIssue(pair.second)) {
            Napi::Object issue = Napi::Object::New(env);
            issue.Set("operation", pair.first);
            issue.Set("issue", "High average duration");
            issue.Set("averageDuration", pair.second.averageDuration);
            issuesArray.Set(issueCount++, issue);
        }
    }
    analysis.Set("performanceIssues", issuesArray);
    
    return analysis;
}

// Detect performance issues
Napi::Value PerformanceMonitor::DetectPerformanceIssues(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::lock_guard<std::mutex> lock(metricsMutex);
    
    Napi::Array issues = Napi::Array::New(env, 0);
    int issueCount = 0;
    
    for (const auto& pair : metrics) {
        if (IsPerformanceIssue(pair.second)) {
            Napi::Object issue = Napi::Object::New(env);
            issue.Set("operation", pair.first);
            issue.Set("type", "performance");
            issue.Set("severity", "warning");
            issue.Set("message", "Operation has high average duration");
            issue.Set("averageDuration", pair.second.averageDuration);
            issue.Set("recommendation", GetPerformanceRecommendation(pair.second));
            issues.Set(issueCount++, issue);
        }
    }
    
    return issues;
}

// Get performance recommendations
Napi::Value PerformanceMonitor::GetPerformanceRecommendations(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::lock_guard<std::mutex> lock(metricsMutex);
    
    Napi::Array recommendations = Napi::Array::New(env, 0);
    int recCount = 0;
    
    for (const auto& pair : metrics) {
        std::string recommendation = GetPerformanceRecommendation(pair.second);
        if (!recommendation.empty()) {
            Napi::Object rec = Napi::Object::New(env);
            rec.Set("operation", pair.first);
            rec.Set("recommendation", recommendation);
            rec.Set("priority", "medium");
            recommendations.Set(recCount++, rec);
        }
    }
    
    return recommendations;
}

// Reset all performance metrics
Napi::Value PerformanceMonitor::ResetMetrics(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::lock_guard<std::mutex> lock(metricsMutex);
    
    metrics.clear();
    activeTimers.clear();
    
    return Napi::Boolean::New(env, true);
}

// Clear metrics for a specific operation
Napi::Value PerformanceMonitor::ClearOperationMetrics(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected operation parameter").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string operation = info[0].As<Napi::String>().Utf8Value();
    std::lock_guard<std::mutex> lock(metricsMutex);
    
    auto it = metrics.find(operation);
    if (it != metrics.end()) {
        metrics.erase(it);
        return Napi::Boolean::New(env, true);
    }
    
    return Napi::Boolean::New(env, false);
}

// Helper methods
bool PerformanceMonitor::IsPerformanceIssue(const PerformanceMetric& metric) {
    // Consider it an issue if average duration is over 100ms
    return metric.averageDuration > 100.0;
}

std::string PerformanceMonitor::GetPerformanceRecommendation(const PerformanceMetric& metric) {
    if (metric.averageDuration > 1000.0) {
        return "Consider optimizing this operation - it's taking over 1 second on average";
    } else if (metric.averageDuration > 500.0) {
        return "This operation could benefit from optimization";
    } else if (metric.callCount > 10000) {
        return "Consider caching results for this frequently called operation";
    }
    return "";
}

// Placeholder implementations for other methods
Napi::Value PerformanceMonitor::GetPerformanceTrends(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Object::New(env);
}

Napi::Value PerformanceMonitor::SetPerformanceThresholds(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Boolean::New(env, true);
}

Napi::Value PerformanceMonitor::GetPerformanceThresholds(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Object::New(env);
}

Napi::Value PerformanceMonitor::GeneratePerformanceReport(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::String::New(env, "Performance report not implemented");
}

Napi::Value PerformanceMonitor::ExportPerformanceData(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Object::New(env);
}

Napi::Value PerformanceMonitor::GetPerformanceAlerts(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Array::New(env, 0);
}

} // namespace EnterpriseCrypto
