#ifndef AUDIT_TRAIL_H
#define AUDIT_TRAIL_H

#include <napi.h>
#include <string>
#include <vector>
#include <chrono>
#include <mutex>
#include <fstream>

namespace EnterpriseCrypto {

// Audit trail entry structure
struct AuditEntry {
    std::string timestamp;
    std::string operation;
    std::string keyId;
    std::string userId;
    std::string sessionId;
    bool success;
    std::string details;
    std::string ipAddress;
    std::string userAgent;
    double duration;
    size_t dataSize;
};

// Audit trail manager for compliance and security
class AuditTrail {
public:
    static void Init(Napi::Env env, Napi::Object exports);
    
    // Core audit logging
    static void LogOperation(const std::string& operation, 
                           const std::string& keyId, 
                           const std::string& userId,
                           bool success,
                           const std::string& details = "",
                           const std::string& sessionId = "",
                           const std::string& ipAddress = "",
                           const std::string& userAgent = "",
                           double duration = 0.0,
                           size_t dataSize = 0);
    
    // Audit trail retrieval
    static Napi::Value GetAuditLog(const Napi::CallbackInfo& info);
    static Napi::Value GetAuditLogByUser(const Napi::CallbackInfo& info);
    static Napi::Value GetAuditLogByKey(const Napi::CallbackInfo& info);
    static Napi::Value GetAuditLogByOperation(const Napi::CallbackInfo& info);
    static Napi::Value GetAuditLogByTimeRange(const Napi::CallbackInfo& info);
    
    // Audit trail export and compliance
    static Napi::Value ExportAuditLog(const Napi::CallbackInfo& info);
    static Napi::Value ExportAuditLogCSV(const Napi::CallbackInfo& info);
    static Napi::Value ExportAuditLogJSON(const Napi::CallbackInfo& info);
    static Napi::Value GenerateComplianceReport(const Napi::CallbackInfo& info);
    
    // Audit trail analysis
    static Napi::Value AnalyzeAuditPatterns(const Napi::CallbackInfo& info);
    static Napi::Value DetectAnomalies(const Napi::CallbackInfo& info);
    static Napi::Value GetSecurityMetrics(const Napi::CallbackInfo& info);
    
    // Audit trail management
    static Napi::Value ClearAuditLog(const Napi::CallbackInfo& info);
    static Napi::Value ArchiveAuditLog(const Napi::CallbackInfo& info);
    static Napi::Value GetAuditLogStats(const Napi::CallbackInfo& info);
    
    // Configuration
    static Napi::Value SetAuditConfig(const Napi::CallbackInfo& info);
    static Napi::Value GetAuditConfig(const Napi::CallbackInfo& info);
    
private:
    // Internal storage and management
    static std::vector<AuditEntry> auditEntries;
    static std::mutex auditMutex;
    static std::string auditFilePath;
    static bool enableFileLogging;
    static size_t maxMemoryEntries;
    
    // Helper methods
    static std::string GetCurrentTimestamp();
    static std::string FormatAuditEntry(const AuditEntry& entry);
    static void WriteToFile(const AuditEntry& entry);
    static void LoadAuditLogFromFile();
    static void SaveAuditLogToFile();
    
    // Analysis helpers
    static std::vector<AuditEntry> FilterByUser(const std::vector<AuditEntry>& entries, const std::string& userId);
    static std::vector<AuditEntry> FilterByKey(const std::vector<AuditEntry>& entries, const std::string& keyId);
    static std::vector<AuditEntry> FilterByOperation(const std::vector<AuditEntry>& entries, const std::string& operation);
    static std::vector<AuditEntry> FilterByTimeRange(const std::vector<AuditEntry>& entries, 
                                                   const std::string& startTime, 
                                                   const std::string& endTime);
    
    // Compliance helpers
    static bool IsCompliantOperation(const std::string& operation);
    static std::string GenerateComplianceSummary(const std::vector<AuditEntry>& entries);
    static std::vector<std::string> GetComplianceViolations(const std::vector<AuditEntry>& entries);
};

// Compliance reporting utilities
class ComplianceReporter {
public:
    static Napi::Value GenerateSOXReport(const Napi::CallbackInfo& info);
    static Napi::Value GenerateGDPRReport(const Napi::CallbackInfo& info);
    static Napi::Value GenerateHIPAAReport(const Napi::CallbackInfo& info);
    static Napi::Value GeneratePCIDSSReport(const Napi::CallbackInfo& info);
    
private:
    static std::string FormatSOXEntry(const AuditEntry& entry);
    static std::string FormatGDPREntry(const AuditEntry& entry);
    static std::string FormatHIPAAEntry(const AuditEntry& entry);
    static std::string FormatPCIDSSEntry(const AuditEntry& entry);
};

// Security analysis utilities
class SecurityAnalyzer {
public:
    static Napi::Value DetectSuspiciousActivity(const Napi::CallbackInfo& info);
    static Napi::Value AnalyzeAccessPatterns(const Napi::CallbackInfo& info);
    static Napi::Value GenerateThreatReport(const Napi::CallbackInfo& info);
    static Napi::Value CheckComplianceStatus(const Napi::CallbackInfo& info);
    
private:
    static bool IsSuspiciousPattern(const std::vector<AuditEntry>& entries);
    static std::vector<std::string> IdentifyAnomalies(const std::vector<AuditEntry>& entries);
    static double CalculateRiskScore(const std::vector<AuditEntry>& entries);
};

} // namespace EnterpriseCrypto

#endif // AUDIT_TRAIL_H
