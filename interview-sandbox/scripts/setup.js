#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envExample = `# Application Configuration
NODE_ENV=development
PORT=3000
APP_NAME=Interview Sandbox API
CORS_ORIGIN=*

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=rootpassword
DB_NAME=interview_db

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production-use-a-strong-random-string
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Bcrypt Configuration
BCRYPT_ROUNDS=12

# OTP Configuration
OTP_EXPIRATION=600000
OTP_LENGTH=6

# Redis Configuration (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Facebook OAuth (Optional)
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/facebook/callback

# Stripe Payment (Optional)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Logger Configuration
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_CONSOLE_ENABLED=true
LOG_DIRECTORY=logs
LOG_MAX_FILES=14d
LOG_MAX_SIZE=20m
LOG_SCHEDULED_DELETION=false
LOG_DELETION_SCHEDULE=1w
`;

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

// Create .env.example
if (!fs.existsSync(envExamplePath)) {
  fs.writeFileSync(envExamplePath, envExample);
  console.log('✅ Created .env.example');
} else {
  console.log('ℹ️  .env.example already exists');
}

// Create .env from .env.example if it doesn't exist
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envExample);
  console.log('✅ Created .env file from .env.example');
  console.log('⚠️  Please update .env with your actual configuration values');
} else {
  console.log('ℹ️  .env file already exists, skipping creation');
}

console.log('\n📝 Next steps:');
console.log('1. Copy environment file for your target environment:');
console.log('   - Development: cp .env.development.example .env.development');
console.log('   - Test: cp .env.test.example .env.test');
console.log('   - Production: cp .env.production.example .env.production');
console.log('2. Update .env.{environment} with your credentials');
console.log('3. Set NODE_ENV environment variable (development/test/production)');
console.log('4. Run: npm run docker:up (to start MySQL and Redis)');
console.log('5. Run: npm run db:create (to create the database)');
console.log('6. Run: npm run start:dev (to start the application)');
console.log('\nOr simply run: npm run dev (starts everything)');
console.log('\n💡 Tip: CORS_ORIGIN supports comma-separated domains for production');

