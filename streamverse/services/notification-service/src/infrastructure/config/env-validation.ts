import { ConfigService } from '@nestjs/config';

/**
 * Environment Variable Validation for Notification Service
 */
export function validateEnvironment(configService: ConfigService): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables for all environments
  const requiredVars = [
    'DB_HOST',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_NAME',
    'KAFKA_BROKERS',
    'REDIS_URL',
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL',
    'FRONTEND_URL'
  ];

  // Check required variables
  requiredVars.forEach(varName => {
    if (!configService.get(varName)) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // Validate email configuration
  const fromEmail = configService.get('SENDGRID_FROM_EMAIL');
  if (fromEmail && !fromEmail.includes('@')) {
    warnings.push('SENDGRID_FROM_EMAIL should be a valid email address');
  }

  // Validate frontend URL
  const frontendUrl = configService.get('FRONTEND_URL');
  if (frontendUrl && !frontendUrl.startsWith('http')) {
    warnings.push('FRONTEND_URL should start with http:// or https://');
  }

  // Security warnings for production
  if (configService.get('NODE_ENV') === 'production') {
    const dbPassword = configService.get('DB_PASSWORD');
    if (dbPassword && dbPassword.length < 12) {
      warnings.push('Database password is weak - use strong passwords in production');
    }
  }

  // Port validation
  const port = configService.get('PORT');
  if (port && (isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535)) {
    errors.push('PORT must be a valid number between 1 and 65535');
  }

  // Database port validation
  const dbPort = configService.get('DB_PORT');
  if (dbPort && (isNaN(Number(dbPort)) || Number(dbPort) < 1 || Number(dbPort) > 65535)) {
    errors.push('DB_PORT must be a valid number between 1 and 65535');
  }

  // Log results
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (errors.length === 0) {
    console.log('✅ Environment validation passed');
  }
}

/**
 * Get environment summary for logging
 */
export function getEnvironmentSummary(configService: ConfigService): Record<string, any> {
  return {
    environment: configService.get('NODE_ENV'),
    port: configService.get('PORT'),
    database: {
      host: configService.get('DB_HOST'),
      port: configService.get('DB_PORT'),
      name: configService.get('DB_NAME')
    },
    messaging: 'Kafka',
    cache: 'Redis',
    externalServices: {
      email: 'SendGrid',
      sms: configService.get('TWILIO_ACCOUNT_SID') ? 'Twilio' : 'Not configured',
      push: configService.get('FIREBASE_SERVICE_ACCOUNT') ? 'Firebase' : 'Not configured'
    }
  };
}
