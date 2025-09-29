#include "crypto_operations.h"
#include "audit_trail.h"
#include "performance_monitor.h"
#include <chrono>
#include <sstream>
#include <iomanip>

namespace EnterpriseCrypto {

// Initialize all crypto operations
void CryptoOperations::Init(Napi::Env env, Napi::Object exports) {
    // Core crypto operations
    exports.Set("encryptAES256GCM", Napi::Function::New(env, EncryptAES256GCM));
    exports.Set("decryptAES256GCM", Napi::Function::New(env, DecryptAES256GCM));
    exports.Set("generateKeyPair", Napi::Function::New(env, GenerateKeyPair));
    exports.Set("generateSecretKey", Napi::Function::New(env, GenerateSecretKey));
    exports.Set("signData", Napi::Function::New(env, SignData));
    exports.Set("verifySignature", Napi::Function::New(env, VerifySignature));
    exports.Set("hashData", Napi::Function::New(env, HashData));
    exports.Set("hmacData", Napi::Function::New(env, HMACData));
    exports.Set("deriveKey", Napi::Function::New(env, DeriveKey));
    exports.Set("deriveKeyFromPassword", Napi::Function::New(env, DeriveKeyFromPassword));
    exports.Set("generateRandomBytes", Napi::Function::New(env, GenerateRandomBytes));
    exports.Set("generateSecureRandom", Napi::Function::New(env, GenerateSecureRandom));
    
    // Key management
    exports.Set("rotateKey", Napi::Function::New(env, RotateKey));
    exports.Set("validateKey", Napi::Function::New(env, ValidateKey));
    exports.Set("exportKey", Napi::Function::New(env, ExportKey));
    exports.Set("importKey", Napi::Function::New(env, ImportKey));
    
    // Performance and security
    exports.Set("getPerformanceMetrics", Napi::Function::New(env, GetPerformanceMetrics));
    exports.Set("resetPerformanceMetrics", Napi::Function::New(env, ResetPerformanceMetrics));
    exports.Set("timingSafeEqual", Napi::Function::New(env, TimingSafeEqual));
    exports.Set("constantTimeCompare", Napi::Function::New(env, ConstantTimeCompare));
}

// High-performance AES-256-GCM encryption
Napi::Value CryptoOperations::EncryptAES256GCM(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected data, key, and iv").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        // Extract parameters
        Napi::Buffer<uint8_t> data = info[0].As<Napi::Buffer<uint8_t>>();
        Napi::Buffer<uint8_t> key = info[1].As<Napi::Buffer<uint8_t>>();
        Napi::Buffer<uint8_t> iv = info[2].As<Napi::Buffer<uint8_t>>();
        
        if (key.Length() != 32) {
            Napi::TypeError::New(env, "Key must be 32 bytes for AES-256").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        if (iv.Length() != 12) {
            Napi::TypeError::New(env, "IV must be 12 bytes for GCM").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Initialize OpenSSL context
        EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
        if (!ctx) {
            Napi::Error::New(env, "Failed to create cipher context").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Initialize encryption
        if (EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), nullptr, key.Data(), iv.Data()) != 1) {
            EVP_CIPHER_CTX_free(ctx);
            Napi::Error::New(env, "Failed to initialize encryption").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Encrypt data
        std::vector<uint8_t> ciphertext(data.Length());
        int len;
        if (EVP_EncryptUpdate(ctx, ciphertext.data(), &len, data.Data(), data.Length()) != 1) {
            EVP_CIPHER_CTX_free(ctx);
            Napi::Error::New(env, "Failed to encrypt data").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Finalize encryption
        int finalLen;
        if (EVP_EncryptFinal_ex(ctx, ciphertext.data() + len, &finalLen) != 1) {
            EVP_CIPHER_CTX_free(ctx);
            Napi::Error::New(env, "Failed to finalize encryption").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Get authentication tag
        uint8_t tag[16];
        if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, 16, tag) != 1) {
            EVP_CIPHER_CTX_free(ctx);
            Napi::Error::New(env, "Failed to get authentication tag").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        EVP_CIPHER_CTX_free(ctx);
        
        // Calculate performance metrics
        auto end = std::chrono::high_resolution_clock::now();
        double duration = std::chrono::duration<double, std::milli>(end - start).count();
        
        // Record performance metrics
        RecordPerformanceMetric("encryptAES256GCM", duration, data.Length());
        
        // Log audit trail
        std::string keyId = "key_" + std::to_string(std::hash<std::string>{}(std::string(key.Data(), key.Data() + key.Length())));
        LogCryptoOperation("encryptAES256GCM", keyId, duration);
        
        // Create result object
        Napi::Object result = Napi::Object::New(env);
        result.Set("ciphertext", Napi::Buffer<uint8_t>::Copy(env, ciphertext.data(), len + finalLen));
        result.Set("tag", Napi::Buffer<uint8_t>::Copy(env, tag, 16));
        result.Set("iv", iv);
        result.Set("algorithm", "aes-256-gcm");
        result.Set("keyId", keyId);
        result.Set("performance", Napi::Object::New(env));
        result.Get("performance").As<Napi::Object>().Set("duration", duration);
        result.Get("performance").As<Napi::Object>().Set("dataSize", data.Length());
        
        return result;
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// High-performance AES-256-GCM decryption
Napi::Value CryptoOperations::DecryptAES256GCM(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected ciphertext, key, iv, and tag").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        // Extract parameters
        Napi::Buffer<uint8_t> ciphertext = info[0].As<Napi::Buffer<uint8_t>>();
        Napi::Buffer<uint8_t> key = info[1].As<Napi::Buffer<uint8_t>>();
        Napi::Buffer<uint8_t> iv = info[2].As<Napi::Buffer<uint8_t>>();
        Napi::Buffer<uint8_t> tag = info[3].As<Napi::Buffer<uint8_t>>();
        
        if (key.Length() != 32) {
            Napi::TypeError::New(env, "Key must be 32 bytes for AES-256").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        if (iv.Length() != 12) {
            Napi::TypeError::New(env, "IV must be 12 bytes for GCM").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        if (tag.Length() != 16) {
            Napi::TypeError::New(env, "Tag must be 16 bytes for GCM").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Initialize OpenSSL context
        EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
        if (!ctx) {
            Napi::Error::New(env, "Failed to create cipher context").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Initialize decryption
        if (EVP_DecryptInit_ex(ctx, EVP_aes_256_gcm(), nullptr, key.Data(), iv.Data()) != 1) {
            EVP_CIPHER_CTX_free(ctx);
            Napi::Error::New(env, "Failed to initialize decryption").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Set authentication tag
        if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_TAG, 16, tag.Data()) != 1) {
            EVP_CIPHER_CTX_free(ctx);
            Napi::Error::New(env, "Failed to set authentication tag").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Decrypt data
        std::vector<uint8_t> plaintext(ciphertext.Length());
        int len;
        if (EVP_DecryptUpdate(ctx, plaintext.data(), &len, ciphertext.Data(), ciphertext.Length()) != 1) {
            EVP_CIPHER_CTX_free(ctx);
            Napi::Error::New(env, "Failed to decrypt data").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Finalize decryption
        int finalLen;
        int result = EVP_DecryptFinal_ex(ctx, plaintext.data() + len, &finalLen);
        EVP_CIPHER_CTX_free(ctx);
        
        if (result != 1) {
            Napi::Error::New(env, "Failed to finalize decryption - authentication failed").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Calculate performance metrics
        auto end = std::chrono::high_resolution_clock::now();
        double duration = std::chrono::duration<double, std::milli>(end - start).count();
        
        // Record performance metrics
        RecordPerformanceMetric("decryptAES256GCM", duration, ciphertext.Length());
        
        // Log audit trail
        std::string keyId = "key_" + std::to_string(std::hash<std::string>{}(std::string(key.Data(), key.Data() + key.Length())));
        LogCryptoOperation("decryptAES256GCM", keyId, duration);
        
        // Create result object
        Napi::Object resultObj = Napi::Object::New(env);
        resultObj.Set("plaintext", Napi::Buffer<uint8_t>::Copy(env, plaintext.data(), len + finalLen));
        resultObj.Set("algorithm", "aes-256-gcm");
        resultObj.Set("keyId", keyId);
        resultObj.Set("performance", Napi::Object::New(env));
        resultObj.Get("performance").As<Napi::Object>().Set("duration", duration);
        resultObj.Get("performance").As<Napi::Object>().Set("dataSize", ciphertext.Length());
        
        return resultObj;
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// Generate high-quality random bytes
Napi::Value CryptoOperations::GenerateRandomBytes(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected length parameter").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        int length = info[0].As<Napi::Number>().Int32Value();
        
        if (length <= 0 || length > 1024 * 1024) { // Max 1MB
            Napi::TypeError::New(env, "Length must be between 1 and 1048576").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        std::vector<uint8_t> randomBytes(length);
        
        if (RAND_bytes(randomBytes.data(), length) != 1) {
            Napi::Error::New(env, "Failed to generate random bytes").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Calculate performance metrics
        auto end = std::chrono::high_resolution_clock::now();
        double duration = std::chrono::duration<double, std::milli>(end - start).count();
        
        // Record performance metrics
        RecordPerformanceMetric("generateRandomBytes", duration, length);
        
        // Log audit trail
        LogCryptoOperation("generateRandomBytes", "system", duration);
        
        // Create result object
        Napi::Object result = Napi::Object::New(env);
        result.Set("randomBytes", Napi::Buffer<uint8_t>::Copy(env, randomBytes.data(), length));
        result.Set("length", length);
        result.Set("entropy", "high");
        result.Set("performance", Napi::Object::New(env));
        result.Get("performance").As<Napi::Object>().Set("duration", duration);
        result.Get("performance").As<Napi::Object>().Set("dataSize", length);
        
        return result;
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// Timing-safe comparison
Napi::Value CryptoOperations::TimingSafeEqual(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected two buffers to compare").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        Napi::Buffer<uint8_t> a = info[0].As<Napi::Buffer<uint8_t>>();
        Napi::Buffer<uint8_t> b = info[1].As<Napi::Buffer<uint8_t>>();
        
        if (a.Length() != b.Length()) {
            return Napi::Boolean::New(env, false);
        }
        
        bool result = CRYPTO_memcmp(a.Data(), b.Data(), a.Length()) == 0;
        
        // Log audit trail
        LogCryptoOperation("timingSafeEqual", "system", 0.0);
        
        return Napi::Boolean::New(env, result);
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// Helper methods
std::string CryptoOperations::GetAlgorithmName(int algorithm) {
    switch (algorithm) {
        case 1: return "aes-256-gcm";
        case 2: return "rsa-2048";
        case 3: return "ec-p256";
        default: return "unknown";
    }
}

bool CryptoOperations::ValidateKeyStrength(int keySize, const std::string& algorithm) {
    if (algorithm == "aes-256-gcm") {
        return keySize == 256;
    } else if (algorithm == "rsa-2048") {
        return keySize == 2048;
    } else if (algorithm == "ec-p256") {
        return keySize == 256;
    }
    return false;
}

void CryptoOperations::LogCryptoOperation(const std::string& operation, const std::string& keyId, double duration) {
    // This would integrate with the audit trail system
    AuditLogger::LogOperation(operation, keyId, "system", true, 
                            "Duration: " + std::to_string(duration) + "ms");
}

void CryptoOperations::RecordPerformanceMetric(const std::string& operation, double duration, size_t dataSize) {
    // This would integrate with the performance monitoring system
    // Implementation would track metrics for monitoring and optimization
}

// Placeholder implementations for other methods
Napi::Value CryptoOperations::GenerateKeyPair(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would generate RSA or EC key pairs
    return Napi::Object::New(env);
}

Napi::Value CryptoOperations::GenerateSecretKey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would generate secret keys
    return Napi::Object::New(env);
}

Napi::Value CryptoOperations::SignData(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would sign data
    return Napi::Object::New(env);
}

Napi::Value CryptoOperations::VerifySignature(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would verify signatures
    return Napi::Object::New(env);
}

Napi::Value CryptoOperations::HashData(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would hash data
    return Napi::Object::New(env);
}

Napi::Value CryptoOperations::HMACData(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would compute HMAC
    return Napi::Object::New(env);
}

Napi::Value CryptoOperations::DeriveKey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would derive keys
    return Napi::Object::New(env);
}

Napi::Value CryptoOperations::DeriveKeyFromPassword(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would derive keys from passwords
    return Napi::Object::New(env);
}

Napi::Value CryptoOperations::GenerateSecureRandom(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would generate secure random data
    return Napi::Object::New(env);
}

Napi::Value CryptoOperations::RotateKey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would rotate keys
    return Napi::Object::New(env);
}

Napi::Value CryptoOperations::ValidateKey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would validate keys
    return Napi::Object::New(env);
}

Napi::Value CryptoOperations::ExportKey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would export keys
    return Napi::Object::New(env);
}

Napi::Value CryptoOperations::ImportKey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would import keys
    return Napi::Object::New(env);
}

Napi::Value CryptoOperations::GetPerformanceMetrics(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would return performance metrics
    return Napi::Object::New(env);
}

Napi::Value CryptoOperations::ResetPerformanceMetrics(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would reset performance metrics
    return Napi::Object::New(env);
}

Napi::Value CryptoOperations::ConstantTimeCompare(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Implementation would do constant time comparison
    return Napi::Boolean::New(env, false);
}

} // namespace EnterpriseCrypto
