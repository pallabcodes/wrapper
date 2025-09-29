#include "audit_trail.h"
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <ctime>

namespace EnterpriseCrypto {

// Static member definitions
std::vector<AuditEntry> AuditTrail::auditEntries;
std::mutex AuditTrail::auditMutex;
std::string AuditTrail::auditFilePath = "./audit.log";
bool AuditTrail::enableFileLogging = true;
size_t AuditTrail::maxMemoryEntries = 10000;

// Initialize audit trail system
void AuditTrail::Init(Napi::Env env, Napi::Object exports) {
    // Core audit logging
    exports.Set("logOperation", Napi::Function::New(env, [](const Napi::CallbackInfo& info) {
        if (info.Length() >= 4) {
            std::string operation = info[0].As<Napi::String>().Utf8Value();
            std::string keyId = info[1].As<Napi::String>().Utf8Value();
            std::string userId = info[2].As<Napi::String>().Utf8Value();
            bool success = info[3].As<Napi::Boolean>().Value();
            
            std::string details = info.Length() > 4 ? info[4].As<Napi::String>().Utf8Value() : "";
            std::string sessionId = info.Length() > 5 ? info[5].As<Napi::String>().Utf8Value() : "";
            std::string ipAddress = info.Length() > 6 ? info[6].As<Napi::String>().Utf8Value() : "";
            std::string userAgent = info.Length() > 7 ? info[7].As<Napi::String>().Utf8Value() : "";
            double duration = info.Length() > 8 ? info[8].As<Napi::Number>().DoubleValue() : 0.0;
            size_t dataSize = info.Length() > 9 ? info[9].As<Napi::Number>().Uint32Value() : 0;
            
            LogOperation(operation, keyId, userId, success, details, sessionId, ipAddress, userAgent, duration, dataSize);
        }
        return env.Undefined();
    }));
    
    // Audit retrieval methods
    exports.Set("getAuditLog", Napi::Function::New(env, GetAuditLog));
    exports.Set("getAuditLogByUser", Napi::Function::New(env, GetAuditLogByUser));
    exports.Set("getAuditLogByKey", Napi::Function::New(env, GetAuditLogByKey));
    exports.Set("getAuditLogByOperation", Napi::Function::New(env, GetAuditLogByOperation));
    exports.Set("getAuditLogByTimeRange", Napi::Function::New(env, GetAuditLogByTimeRange));
    
    // Export methods
    exports.Set("exportAuditLog", Napi::Function::New(env, ExportAuditLog));
    exports.Set("exportAuditLogCSV", Napi::Function::New(env, ExportAuditLogCSV));
    exports.Set("exportAuditLogJSON", Napi::Function::New(env, ExportAuditLogJSON));
    exports.Set("generateComplianceReport", Napi::Function::New(env, GenerateComplianceReport));
    
    // Analysis methods
    exports.Set("analyzeAuditPatterns", Napi::Function::New(env, AnalyzeAuditPatterns));
    exports.Set("detectAnomalies", Napi::Function::New(env, DetectAnomalies));
    exports.Set("getSecurityMetrics", Napi::Function::New(env, GetSecurityMetrics));
    
    // Management methods
    exports.Set("clearAuditLog", Napi::Function::New(env, ClearAuditLog));
    exports.Set("archiveAuditLog", Napi::Function::New(env, ArchiveAuditLog));
    exports.Set("getAuditLogStats", Napi::Function::New(env, GetAuditLogStats));
    
    // Configuration methods
    exports.Set("setAuditConfig", Napi::Function::New(env, SetAuditConfig));
    exports.Set("getAuditConfig", Napi::Function::New(env, GetAuditConfig));
}

// Log a crypto operation to the audit trail
void AuditTrail::LogOperation(const std::string& operation, 
                             const std::string& keyId, 
                             const std::string& userId,
                             bool success,
                             const std::string& details,
                             const std::string& sessionId,
                             const std::string& ipAddress,
                             const std::string& userAgent,
                             double duration,
                             size_t dataSize) {
    std::lock_guard<std::mutex> lock(auditMutex);
    
    AuditEntry entry;
    entry.timestamp = GetCurrentTimestamp();
    entry.operation = operation;
    entry.keyId = keyId;
    entry.userId = userId;
    entry.sessionId = sessionId;
    entry.success = success;
    entry.details = details;
    entry.ipAddress = ipAddress;
    entry.userAgent = userAgent;
    entry.duration = duration;
    entry.dataSize = dataSize;
    
    // Add to memory storage
    auditEntries.push_back(entry);
    
    // Maintain memory limit
    if (auditEntries.size() > maxMemoryEntries) {
        auditEntries.erase(auditEntries.begin());
    }
    
    // Write to file if enabled
    if (enableFileLogging) {
        WriteToFile(entry);
    }
}

// Get current timestamp in ISO format
std::string AuditTrail::GetCurrentTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        now.time_since_epoch()) % 1000;
    
    std::stringstream ss;
    ss << std::put_time(std::gmtime(&time_t), "%Y-%m-%dT%H:%M:%S");
    ss << '.' << std::setfill('0') << std::setw(3) << ms.count() << 'Z';
    
    return ss.str();
}

// Format audit entry for display
std::string AuditTrail::FormatAuditEntry(const AuditEntry& entry) {
    std::stringstream ss;
    ss << "[" << entry.timestamp << "] "
       << "Operation: " << entry.operation << " "
       << "KeyID: " << entry.keyId << " "
       << "User: " << entry.userId << " "
       << "Success: " << (entry.success ? "true" : "false") << " "
       << "Duration: " << entry.duration << "ms "
       << "DataSize: " << entry.dataSize << " bytes";
    
    if (!entry.details.empty()) {
        ss << " Details: " << entry.details;
    }
    
    return ss.str();
}

// Write audit entry to file
void AuditTrail::WriteToFile(const AuditEntry& entry) {
    std::ofstream file(auditFilePath, std::ios::app);
    if (file.is_open()) {
        file << FormatAuditEntry(entry) << std::endl;
        file.close();
    }
}

// Get all audit log entries
Napi::Value AuditTrail::GetAuditLog(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::lock_guard<std::mutex> lock(auditMutex);
    
    Napi::Array result = Napi::Array::New(env, auditEntries.size());
    
    for (size_t i = 0; i < auditEntries.size(); i++) {
        Napi::Object entry = Napi::Object::New(env);
        entry.Set("timestamp", auditEntries[i].timestamp);
        entry.Set("operation", auditEntries[i].operation);
        entry.Set("keyId", auditEntries[i].keyId);
        entry.Set("userId", auditEntries[i].userId);
        entry.Set("sessionId", auditEntries[i].sessionId);
        entry.Set("success", auditEntries[i].success);
        entry.Set("details", auditEntries[i].details);
        entry.Set("ipAddress", auditEntries[i].ipAddress);
        entry.Set("userAgent", auditEntries[i].userAgent);
        entry.Set("duration", auditEntries[i].duration);
        entry.Set("dataSize", auditEntries[i].dataSize);
        
        result.Set(i, entry);
    }
    
    return result;
}

// Get audit log by user
Napi::Value AuditTrail::GetAuditLogByUser(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected userId parameter").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string userId = info[0].As<Napi::String>().Utf8Value();
    std::lock_guard<std::mutex> lock(auditMutex);
    
    std::vector<AuditEntry> filteredEntries = FilterByUser(auditEntries, userId);
    Napi::Array result = Napi::Array::New(env, filteredEntries.size());
    
    for (size_t i = 0; i < filteredEntries.size(); i++) {
        Napi::Object entry = Napi::Object::New(env);
        entry.Set("timestamp", filteredEntries[i].timestamp);
        entry.Set("operation", filteredEntries[i].operation);
        entry.Set("keyId", filteredEntries[i].keyId);
        entry.Set("userId", filteredEntries[i].userId);
        entry.Set("success", filteredEntries[i].success);
        entry.Set("duration", filteredEntries[i].duration);
        
        result.Set(i, entry);
    }
    
    return result;
}

// Get audit log by key
Napi::Value AuditTrail::GetAuditLogByKey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected keyId parameter").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string keyId = info[0].As<Napi::String>().Utf8Value();
    std::lock_guard<std::mutex> lock(auditMutex);
    
    std::vector<AuditEntry> filteredEntries = FilterByKey(auditEntries, keyId);
    Napi::Array result = Napi::Array::New(env, filteredEntries.size());
    
    for (size_t i = 0; i < filteredEntries.size(); i++) {
        Napi::Object entry = Napi::Object::New(env);
        entry.Set("timestamp", filteredEntries[i].timestamp);
        entry.Set("operation", filteredEntries[i].operation);
        entry.Set("keyId", filteredEntries[i].keyId);
        entry.Set("userId", filteredEntries[i].userId);
        entry.Set("success", filteredEntries[i].success);
        entry.Set("duration", filteredEntries[i].duration);
        
        result.Set(i, entry);
    }
    
    return result;
}

// Get audit log by operation
Napi::Value AuditTrail::GetAuditLogByOperation(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected operation parameter").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string operation = info[0].As<Napi::String>().Utf8Value();
    std::lock_guard<std::mutex> lock(auditMutex);
    
    std::vector<AuditEntry> filteredEntries = FilterByOperation(auditEntries, operation);
    Napi::Array result = Napi::Array::New(env, filteredEntries.size());
    
    for (size_t i = 0; i < filteredEntries.size(); i++) {
        Napi::Object entry = Napi::Object::New(env);
        entry.Set("timestamp", filteredEntries[i].timestamp);
        entry.Set("operation", filteredEntries[i].operation);
        entry.Set("keyId", filteredEntries[i].keyId);
        entry.Set("userId", filteredEntries[i].userId);
        entry.Set("success", filteredEntries[i].success);
        entry.Set("duration", filteredEntries[i].duration);
        
        result.Set(i, entry);
    }
    
    return result;
}

// Get audit log by time range
Napi::Value AuditTrail::GetAuditLogByTimeRange(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected startTime and endTime parameters").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string startTime = info[0].As<Napi::String>().Utf8Value();
    std::string endTime = info[1].As<Napi::String>().Utf8Value();
    std::lock_guard<std::mutex> lock(auditMutex);
    
    std::vector<AuditEntry> filteredEntries = FilterByTimeRange(auditEntries, startTime, endTime);
    Napi::Array result = Napi::Array::New(env, filteredEntries.size());
    
    for (size_t i = 0; i < filteredEntries.size(); i++) {
        Napi::Object entry = Napi::Object::New(env);
        entry.Set("timestamp", filteredEntries[i].timestamp);
        entry.Set("operation", filteredEntries[i].operation);
        entry.Set("keyId", filteredEntries[i].keyId);
        entry.Set("userId", filteredEntries[i].userId);
        entry.Set("success", filteredEntries[i].success);
        entry.Set("duration", filteredEntries[i].duration);
        
        result.Set(i, entry);
    }
    
    return result;
}

// Export audit log as CSV
Napi::Value AuditTrail::ExportAuditLogCSV(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::lock_guard<std::mutex> lock(auditMutex);
    
    std::stringstream csv;
    csv << "Timestamp,Operation,KeyID,UserID,SessionID,Success,Details,IPAddress,UserAgent,Duration,DataSize\n";
    
    for (const auto& entry : auditEntries) {
        csv << entry.timestamp << ","
            << entry.operation << ","
            << entry.keyId << ","
            << entry.userId << ","
            << entry.sessionId << ","
            << (entry.success ? "true" : "false") << ","
            << "\"" << entry.details << "\","
            << entry.ipAddress << ","
            << "\"" << entry.userAgent << "\","
            << entry.duration << ","
            << entry.dataSize << "\n";
    }
    
    return Napi::String::New(env, csv.str());
}

// Export audit log as JSON
Napi::Value AuditTrail::ExportAuditLogJSON(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::lock_guard<std::mutex> lock(auditMutex);
    
    Napi::Array result = Napi::Array::New(env, auditEntries.size());
    
    for (size_t i = 0; i < auditEntries.size(); i++) {
        Napi::Object entry = Napi::Object::New(env);
        entry.Set("timestamp", auditEntries[i].timestamp);
        entry.Set("operation", auditEntries[i].operation);
        entry.Set("keyId", auditEntries[i].keyId);
        entry.Set("userId", auditEntries[i].userId);
        entry.Set("sessionId", auditEntries[i].sessionId);
        entry.Set("success", auditEntries[i].success);
        entry.Set("details", auditEntries[i].details);
        entry.Set("ipAddress", auditEntries[i].ipAddress);
        entry.Set("userAgent", auditEntries[i].userAgent);
        entry.Set("duration", auditEntries[i].duration);
        entry.Set("dataSize", auditEntries[i].dataSize);
        
        result.Set(i, entry);
    }
    
    return result;
}

// Get audit log statistics
Napi::Value AuditTrail::GetAuditLogStats(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::lock_guard<std::mutex> lock(auditMutex);
    
    Napi::Object stats = Napi::Object::New(env);
    stats.Set("totalEntries", auditEntries.size());
    
    // Count by operation
    std::map<std::string, int> operationCounts;
    std::map<std::string, int> userCounts;
    int successCount = 0;
    double totalDuration = 0.0;
    size_t totalDataSize = 0;
    
    for (const auto& entry : auditEntries) {
        operationCounts[entry.operation]++;
        userCounts[entry.userId]++;
        if (entry.success) successCount++;
        totalDuration += entry.duration;
        totalDataSize += entry.dataSize;
    }
    
    stats.Set("successCount", successCount);
    stats.Set("failureCount", auditEntries.size() - successCount);
    stats.Set("successRate", auditEntries.size() > 0 ? (double)successCount / auditEntries.size() : 0.0);
    stats.Set("averageDuration", auditEntries.size() > 0 ? totalDuration / auditEntries.size() : 0.0);
    stats.Set("totalDataSize", totalDataSize);
    
    // Operation counts
    Napi::Object operationStats = Napi::Object::New(env);
    for (const auto& pair : operationCounts) {
        operationStats.Set(pair.first, pair.second);
    }
    stats.Set("operationCounts", operationStats);
    
    // User counts
    Napi::Object userStats = Napi::Object::New(env);
    for (const auto& pair : userCounts) {
        userStats.Set(pair.first, pair.second);
    }
    stats.Set("userCounts", userStats);
    
    return stats;
}

// Filter helper methods
std::vector<AuditEntry> AuditTrail::FilterByUser(const std::vector<AuditEntry>& entries, const std::string& userId) {
    std::vector<AuditEntry> filtered;
    std::copy_if(entries.begin(), entries.end(), std::back_inserter(filtered),
                [&userId](const AuditEntry& entry) { return entry.userId == userId; });
    return filtered;
}

std::vector<AuditEntry> AuditTrail::FilterByKey(const std::vector<AuditEntry>& entries, const std::string& keyId) {
    std::vector<AuditEntry> filtered;
    std::copy_if(entries.begin(), entries.end(), std::back_inserter(filtered),
                [&keyId](const AuditEntry& entry) { return entry.keyId == keyId; });
    return filtered;
}

std::vector<AuditEntry> AuditTrail::FilterByOperation(const std::vector<AuditEntry>& entries, const std::string& operation) {
    std::vector<AuditEntry> filtered;
    std::copy_if(entries.begin(), entries.end(), std::back_inserter(filtered),
                [&operation](const AuditEntry& entry) { return entry.operation == operation; });
    return filtered;
}

std::vector<AuditEntry> AuditTrail::FilterByTimeRange(const std::vector<AuditEntry>& entries, 
                                                    const std::string& startTime, 
                                                    const std::string& endTime) {
    std::vector<AuditEntry> filtered;
    std::copy_if(entries.begin(), entries.end(), std::back_inserter(filtered),
                [&startTime, &endTime](const AuditEntry& entry) { 
                    return entry.timestamp >= startTime && entry.timestamp <= endTime; 
                });
    return filtered;
}

// Placeholder implementations for other methods
Napi::Value AuditTrail::ExportAuditLog(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::String::New(env, "Audit log export not implemented");
}

Napi::Value AuditTrail::GenerateComplianceReport(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::String::New(env, "Compliance report not implemented");
}

Napi::Value AuditTrail::AnalyzeAuditPatterns(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Object::New(env);
}

Napi::Value AuditTrail::DetectAnomalies(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Array::New(env, 0);
}

Napi::Value AuditTrail::GetSecurityMetrics(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Object::New(env);
}

Napi::Value AuditTrail::ClearAuditLog(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::lock_guard<std::mutex> lock(auditMutex);
    auditEntries.clear();
    return Napi::Boolean::New(env, true);
}

Napi::Value AuditTrail::ArchiveAuditLog(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Boolean::New(env, true);
}

Napi::Value AuditTrail::SetAuditConfig(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Boolean::New(env, true);
}

Napi::Value AuditTrail::GetAuditConfig(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object config = Napi::Object::New(env);
    config.Set("fileLogging", enableFileLogging);
    config.Set("filePath", auditFilePath);
    config.Set("maxMemoryEntries", maxMemoryEntries);
    return config;
}

} // namespace EnterpriseCrypto
