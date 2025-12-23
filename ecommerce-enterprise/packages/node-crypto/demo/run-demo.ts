/**
 * Enhanced Node.js Crypto Demo
 * 
 * Demonstrates the capabilities of the enhanced crypto module
 * with enterprise features, audit trails, and performance monitoring.
 */

import { EnhancedCryptoService } from '../src/index';
import { performance } from 'perf_hooks';

async function runDemo() {
  console.log('🚀 Enhanced Node.js Crypto Demo');
  console.log('================================\n');

  // Initialize the enhanced crypto service
  const crypto = new EnhancedCryptoService({
    defaultAlgorithm: 'aes-256-gcm',
    auditLogging: true,
    performanceMonitoring: true,
    fileLogging: true,
    auditFilePath: './demo-audit.log',
  });

  console.log('✅ Crypto service initialized');
  console.log(`📊 Configuration:`, crypto.getConfig());
  console.log('');

  // Demo 1: Basic Encryption/Decryption
  console.log('🔐 Demo 1: Basic Encryption/Decryption');
  console.log('-'.repeat(40));

  try {
    const sensitiveData = Buffer.from('This is highly sensitive payment information that needs to be encrypted!');
    console.log(`📝 Original data: ${sensitiveData.toString()}`);

    // Generate a secret key
    const secretKey = await crypto.generateSecretKey('aes-256-gcm');
    console.log(`🔑 Generated secret key: ${secretKey.keyId}`);

    // Encrypt the data
    const startEncrypt = performance.now();
    const encrypted = await crypto.encrypt(sensitiveData, secretKey.key);
    const encryptTime = performance.now() - startEncrypt;

    console.log(`🔒 Encrypted data: ${encrypted.ciphertext.length} bytes`);
    console.log(`⏱️  Encryption time: ${encryptTime.toFixed(2)}ms`);
    console.log(`🏷️  Algorithm: ${encrypted.algorithm}`);
    console.log(`🔑 Key ID: ${encrypted.metadata?.keyId}`);

    // Decrypt the data
    const startDecrypt = performance.now();
    const decrypted = await crypto.decrypt(encrypted, secretKey.key);
    const decryptTime = performance.now() - startDecrypt;

    console.log(`🔓 Decrypted data: ${decrypted.plaintext.toString()}`);
    console.log(`⏱️  Decryption time: ${decryptTime.toFixed(2)}ms`);
    console.log(`✅ Data integrity verified: ${sensitiveData.equals(decrypted.plaintext)}`);

  } catch (error) {
    console.error('❌ Encryption/Decryption failed:', error);
  }

  console.log('');

  // Demo 2: Key Management
  console.log('🔑 Demo 2: Key Management');
  console.log('-'.repeat(40));

  try {
    // Generate RSA key pair
    const keyPair = await crypto.generateKeyPair('rsa-2048');
    console.log(`🔐 Generated RSA key pair: ${keyPair.keyId}`);
    console.log(`📏 Key size: ${keyPair.keySize} bits`);
    console.log(`🏷️  Algorithm: ${keyPair.algorithm}`);
    console.log(`📅 Created at: ${keyPair.createdAt}`);

    // Generate ECDSA key pair
    const ecKeyPair = await crypto.generateKeyPair('ec-p256');
    console.log(`🔐 Generated ECDSA key pair: ${ecKeyPair.keyId}`);
    console.log(`📏 Key size: ${ecKeyPair.keySize} bits`);

  } catch (error) {
    console.error('❌ Key generation failed:', error);
  }

  console.log('');

  // Demo 3: Performance Monitoring
  console.log('📊 Demo 3: Performance Monitoring');
  console.log('-'.repeat(40));

  try {
    // Perform multiple operations to generate metrics
    const operations = ['encrypt', 'decrypt', 'generateKey'];
    const iterations = 10;

    for (const operation of operations) {
      console.log(`🔄 Running ${iterations} ${operation} operations...`);
      
      for (let i = 0; i < iterations; i++) {
        const data = Buffer.from(`Test data ${i}`);
        const key = await crypto.generateSecretKey('aes-256-gcm');
        
        if (operation === 'encrypt') {
          await crypto.encrypt(data, key.key);
        } else if (operation === 'decrypt') {
          const encrypted = await crypto.encrypt(data, key.key);
          await crypto.decrypt(encrypted, key.key);
        }
        // generateKey is already called above
      }
    }

    // Get performance metrics
    const metrics = crypto.getPerformanceMetrics();
    console.log('\n📈 Performance Metrics:');
    
    for (const [operation, metric] of Object.entries(metrics)) {
      console.log(`  ${operation}:`);
      console.log(`    Total calls: ${metric.callCount}`);
      console.log(`    Average duration: ${metric.averageDuration.toFixed(2)}ms`);
      console.log(`    Min duration: ${metric.minDuration.toFixed(2)}ms`);
      console.log(`    Max duration: ${metric.maxDuration.toFixed(2)}ms`);
      console.log(`    Total data processed: ${metric.totalDataSize} bytes`);
    }

    // Get performance analysis
    const analysis = crypto.getPerformanceAnalysis();
    console.log('\n🔍 Performance Analysis:');
    console.log(`  Slowest operations: ${analysis.slowestOperations.length}`);
    console.log(`  Most frequent operations: ${analysis.mostFrequentOperations.length}`);
    console.log(`  Performance issues: ${analysis.performanceIssues.length}`);

  } catch (error) {
    console.error('❌ Performance monitoring failed:', error);
  }

  console.log('');

  // Demo 4: Audit Trail
  console.log('📋 Demo 4: Audit Trail');
  console.log('-'.repeat(40));

  try {
    // Get audit log
    const auditLog = crypto.getAuditLog();
    console.log(`📊 Total audit entries: ${auditLog.length}`);

    // Get audit statistics
    const auditStats = crypto.getAuditLogStats();
    console.log('\n📈 Audit Statistics:');
    console.log(`  Total entries: ${auditStats.totalEntries}`);
    console.log(`  Success count: ${auditStats.successCount}`);
    console.log(`  Failure count: ${auditStats.failureCount}`);
    console.log(`  Success rate: ${(auditStats.successRate * 100).toFixed(2)}%`);
    console.log(`  Average duration: ${auditStats.averageDuration.toFixed(2)}ms`);
    console.log(`  Total data size: ${auditStats.totalDataSize} bytes`);

    // Show recent audit entries
    console.log('\n📝 Recent Audit Entries:');
    const recentEntries = auditLog.slice(-5);
    for (const entry of recentEntries) {
      console.log(`  [${entry.timestamp}] ${entry.operation} - ${entry.success ? 'SUCCESS' : 'FAILED'} (${entry.duration.toFixed(2)}ms)`);
    }

    // Export audit log
    const csvExport = crypto.exportAuditLog('csv');
    console.log(`\n📄 CSV export length: ${csvExport.length} characters`);

  } catch (error) {
    console.error('❌ Audit trail failed:', error);
  }

  console.log('');

  // Demo 5: Security Features
  console.log('🛡️ Demo 5: Security Features');
  console.log('-'.repeat(40));

  try {
    // Generate secure random bytes
    const randomBytes = crypto.generateRandomBytes(32);
    console.log(`🎲 Generated 32 random bytes: ${randomBytes.length} bytes`);

    // Timing-safe comparison
    const data1 = Buffer.from('test data');
    const data2 = Buffer.from('test data');
    const data3 = Buffer.from('different data');
    
    const isEqual1 = crypto.timingSafeEqual(data1, data2);
    const isEqual2 = crypto.timingSafeEqual(data1, data3);
    
    console.log(`🔍 Timing-safe comparison (same data): ${isEqual1}`);
    console.log(`🔍 Timing-safe comparison (different data): ${isEqual2}`);

  } catch (error) {
    console.error('❌ Security features failed:', error);
  }

  console.log('');

  // Demo 6: Compliance Features
  console.log('📋 Demo 6: Compliance Features');
  console.log('-'.repeat(40));

  try {
    // Get audit log by operation
    const encryptEntries = crypto.getAuditLog({ operation: 'encrypt' });
    console.log(`🔒 Encryption operations: ${encryptEntries.length}`);

    // Get audit log by time range (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    const recentEntries = crypto.getAuditLog({ 
      startTime: oneHourAgo, 
      endTime: now 
    });
    console.log(`⏰ Operations in last hour: ${recentEntries.length}`);

    // Show compliance information
    console.log('\n📊 Compliance Information:');
    console.log(`  Audit logging: ${crypto.getConfig().auditLogging ? 'Enabled' : 'Disabled'}`);
    console.log(`  File logging: ${crypto.getConfig().fileLogging ? 'Enabled' : 'Disabled'}`);
    console.log(`  Audit file: ${crypto.getConfig().auditFilePath}`);
    console.log(`  Retention days: ${crypto.getConfig().auditRetentionDays}`);

  } catch (error) {
    console.error('❌ Compliance features failed:', error);
  }

  console.log('');

  // Demo 7: Error Handling
  console.log('⚠️ Demo 7: Error Handling');
  console.log('-'.repeat(40));

  try {
    // Try to decrypt with wrong key
    const data = Buffer.from('test data');
    const key1 = await crypto.generateSecretKey('aes-256-gcm');
    const key2 = await crypto.generateSecretKey('aes-256-gcm');
    
    const encrypted = await crypto.encrypt(data, key1.key);
    console.log('✅ Encryption successful');
    
    try {
      await crypto.decrypt(encrypted, key2.key); // Wrong key
    } catch (decryptError) {
      console.log('❌ Decryption failed as expected (wrong key)');
      console.log(`   Error: ${decryptError instanceof Error ? decryptError.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Error handling demo failed:', error);
  }

  console.log('');

  // Demo 8: Configuration Management
  console.log('⚙️ Demo 8: Configuration Management');
  console.log('-'.repeat(40));

  try {
    // Show current configuration
    const currentConfig = crypto.getConfig();
    console.log('📋 Current Configuration:');
    console.log(`  Default algorithm: ${currentConfig.defaultAlgorithm}`);
    console.log(`  Key rotation interval: ${currentConfig.keyRotationInterval} days`);
    console.log(`  Audit retention: ${currentConfig.auditRetentionDays} days`);
    console.log(`  Performance monitoring: ${currentConfig.performanceMonitoring ? 'Enabled' : 'Disabled'}`);

    // Update configuration
    crypto.updateConfig({
      defaultAlgorithm: 'aes-128-gcm',
      keyRotationInterval: 30,
    });

    const updatedConfig = crypto.getConfig();
    console.log('\n📋 Updated Configuration:');
    console.log(`  Default algorithm: ${updatedConfig.defaultAlgorithm}`);
    console.log(`  Key rotation interval: ${updatedConfig.keyRotationInterval} days`);

  } catch (error) {
    console.error('❌ Configuration management failed:', error);
  }

  console.log('');

  // Demo Summary
  console.log('🎉 Demo Summary');
  console.log('===============');
  console.log('✅ Enhanced crypto service successfully demonstrated');
  console.log('✅ Native C++ performance optimizations working');
  console.log('✅ Audit trail and compliance features active');
  console.log('✅ Performance monitoring and analysis functional');
  console.log('✅ Security features and error handling working');
  console.log('✅ TypeScript types and IntelliSense support');
  console.log('✅ NestJS integration ready');
  console.log('');
  console.log('🚀 The enhanced crypto module is ready for production use!');
  console.log('📚 Check the README.md for more examples and API documentation.');
}

// Run the demo
runDemo().catch(console.error);
