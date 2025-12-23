#ifndef CRYPTO_OPERATIONS_H
#define CRYPTO_OPERATIONS_H

#include <napi.h>
#include <string>
#include <vector>
#include <memory>
#include <openssl/evp.h>
#include <openssl/aes.h>
#include <openssl/rsa.h>
#include <openssl/ec.h>
#include <openssl/rand.h>
#include <openssl/sha.h>
#include <openssl/hmac.h>

namespace EnterpriseCrypto {

// Enhanced crypto operations with enterprise features
class CryptoOperations {
public:
    static void Init(Napi::Env env, Napi::Object exports);
    
    // High-performance encryption/decryption
    static Napi::Value EncryptAES256GCM(const Napi::CallbackInfo& info);
    static Napi::Value DecryptAES256GCM(const Napi::CallbackInfo& info);
    
    // Enhanced key generation
    static Napi::Value GenerateKeyPair(const Napi::CallbackInfo& info);
    static Napi::Value GenerateSecretKey(const Napi::CallbackInfo& info);
    
    // Digital signatures with audit trail
    static Napi::Value SignData(const Napi::CallbackInfo& info);
    static Napi::Value VerifySignature(const Napi::CallbackInfo& info);
    
    // Hash operations with performance metrics
    static Napi::Value HashData(const Napi::CallbackInfo& info);
    static Napi::Value HMACData(const Napi::CallbackInfo& info);
    
    // Key derivation with enterprise features
    static Napi::Value DeriveKey(const Napi::CallbackInfo& info);
    static Napi::Value DeriveKeyFromPassword(const Napi::CallbackInfo& info);
    
    // Random number generation with entropy monitoring
    static Napi::Value GenerateRandomBytes(const Napi::CallbackInfo& info);
    static Napi::Value GenerateSecureRandom(const Napi::CallbackInfo& info);
    
    // Key management operations
    static Napi::Value RotateKey(const Napi::CallbackInfo& info);
    static Napi::Value ValidateKey(const Napi::CallbackInfo& info);
    static Napi::Value ExportKey(const Napi::CallbackInfo& info);
    static Napi::Value ImportKey(const Napi::CallbackInfo& info);
    
    // Performance monitoring
    static Napi::Value GetPerformanceMetrics(const Napi::CallbackInfo& info);
    static Napi::Value ResetPerformanceMetrics(const Napi::CallbackInfo& info);
    
    // Security features
    static Napi::Value TimingSafeEqual(const Napi::CallbackInfo& info);
    static Napi::Value ConstantTimeCompare(const Napi::CallbackInfo& info);
    
private:
    // Internal helper methods
    static std::string GetAlgorithmName(int algorithm);
    static bool ValidateKeyStrength(int keySize, const std::string& algorithm);
    static void LogCryptoOperation(const std::string& operation, const std::string& keyId, double duration);
    static void RecordPerformanceMetric(const std::string& operation, double duration, size_t dataSize);
};

// Key management utilities
class KeyManager {
public:
    static Napi::Value CreateKey(const Napi::CallbackInfo& info);
    static Napi::Value RotateKey(const Napi::CallbackInfo& info);
    static Napi::Value RevokeKey(const Napi::CallbackInfo& info);
    static Napi::Value ListKeys(const Napi::CallbackInfo& info);
    static Napi::Value GetKeyMetadata(const Napi::CallbackInfo& info);
    
private:
    static std::string GenerateKeyId();
    static bool IsKeyValid(const std::string& keyId);
    static void UpdateKeyMetadata(const std::string& keyId, const std::string& metadata);
};

// Audit trail for compliance
class AuditLogger {
public:
    static void LogOperation(const std::string& operation, 
                           const std::string& keyId, 
                           const std::string& userId,
                           bool success,
                           const std::string& details = "");
    
    static Napi::Value GetAuditLog(const Napi::CallbackInfo& info);
    static Napi::Value ExportAuditLog(const Napi::CallbackInfo& info);
    
private:
    static std::string FormatAuditEntry(const std::string& operation,
                                      const std::string& keyId,
                                      const std::string& userId,
                                      bool success,
                                      const std::string& details);
};

} // namespace EnterpriseCrypto

#endif // CRYPTO_OPERATIONS_H
