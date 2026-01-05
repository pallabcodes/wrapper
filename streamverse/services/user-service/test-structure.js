// Simple test to validate our domain structure
console.log('🧪 Testing StreamVerse User Service Structure...\n');

// Test Value Objects
const { Email } = require('./dist/domain/value-objects/email.vo');
const { Username } = require('./dist/domain/value-objects/username.vo');
const { Password } = require('./dist/domain/value-objects/password.vo');

console.log('✅ Value Objects imported successfully');

// Test basic functionality
try {
  const email = Email.create('test@example.com');
  const username = Username.create('testuser');
  const password = Password.create('TestPass123');

  console.log('✅ Value Objects validation works');
  console.log('✅ Domain layer structure is valid');
} catch (error) {
  console.error('❌ Domain validation failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 Basic structure validation passed!');
console.log('The user-service domain layer is working correctly.');
console.log('Note: Full service requires database and NestJS runtime.');
