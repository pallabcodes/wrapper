import { ConfigService } from '@nestjs/config';

/**
 * Environment Variable Validation
 * Ensures all required configuration is present at startup
 */
export function validateEnvironment(configService: ConfigService): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables for all environments
  const requiredVars = [
    'JWT_SECRET',
    'DB_HOST',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_NAME',
    'REDIS_URL',
    'FRONTEND_URL'
  ];

  // Check required variables
  requiredVars.forEach(varName => {
    if (!configService.get(varName)) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // AWS-specific validation
  const useAWSServices = configService.get('USE_AWS_SERVICES') === 'true';
  if (useAWSServices) {
    const awsVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];

    awsVars.forEach(varName => {
      if (!configService.get(varName)) {
        errors.push(`AWS services enabled but missing: ${varName}`);
      }
    });

    // Check if SQS URL is provided when AWS services are enabled
    if (!configService.get('NOTIFICATION_QUEUE_URL')) {
      warnings.push('AWS services enabled but NOTIFICATION_QUEUE_URL not set - will use Kafka');
    }
  }

  // Security warnings
  if (configService.get('NODE_ENV') === 'production') {
    const jwtSecret = configService.get('JWT_SECRET');
    if (jwtSecret && (jwtSecret.includes('dev') || jwtSecret.includes('test') || jwtSecret.length < 32)) {
      warnings.push('JWT_SECRET appears to be insecure for production - use a strong, random secret');
    }

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

interface EnvironmentSummary {
  environment: string;
  port: number | string;
  database: {
    host: string;
    port: number | string;
    name: string;
    ssl: boolean;
  };
  messaging: string;
  cache: string;
  aws: {
    enabled: boolean;
    region: string | null;
  };
  externalServices: {
    email: string;
    sms: string;
    push: string;
  };
}

/**
 * Get environment summary for logging
 */
export function getEnvironmentSummary(configService: ConfigService): EnvironmentSummary {
  const useAWSServices = configService.get('USE_AWS_SERVICES') === 'true';
  const isProduction = configService.get('NODE_ENV') === 'production';

  return {
    environment: configService.get('NODE_ENV'),
    port: configService.get('PORT'),
    database: {
      host: configService.get('DB_HOST'),
      port: configService.get('DB_PORT'),
      name: configService.get('DB_NAME'),
      ssl: useAWSServices && isProduction // AWS RDS uses SSL
    },
    messaging: useAWSServices ? 'AWS SQS' : 'Kafka',
    cache: 'Redis',
    aws: {
      enabled: useAWSServices,
      region: useAWSServices ? configService.get('AWS_REGION') : null
    },
    externalServices: {
      email: configService.get('SENDGRID_API_KEY') ? 'SendGrid' : 'Not configured',
      sms: configService.get('TWILIO_ACCOUNT_SID') ? 'Twilio' : 'Not configured',
      push: configService.get('FIREBASE_SERVICE_ACCOUNT') ? 'Firebase' : 'Not configured'
    }
  };
}
