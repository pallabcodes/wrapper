/**
 * PM2 Ecosystem Configuration
 * Silicon Valley-grade production deployment with advanced monitoring
 */

module.exports = {
  apps: [
    {
      // Main application
      name: 'fastify-extraction',
      script: 'dist/index.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      
      // Environment configuration
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
        JWT_SECRET: process.env.JWT_SECRET,
        DATABASE_URL: process.env.DATABASE_URL,
        REDIS_URL: process.env.REDIS_URL,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
        PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET
      },
      
      // Performance optimization
      node_args: [
        '--max-old-space-size=4096', // 4GB heap
        '--optimize-for-size',
        '--gc-interval=100',
        '--max-semi-space-size=64'
      ],
      
      // Process management
      max_memory_restart: '2G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Monitoring
      pmx: true,
      monitoring: true,
      
      // Advanced features
      kill_timeout: 5000,
      listen_timeout: 8000,
      shutdown_with_message: true,
      
      // Health checks
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Auto restart conditions
      autorestart: true,
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        'temp',
        'dist'
      ],
      
      // Environment variables for different stages
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      
      env_testing: {
        NODE_ENV: 'testing',
        PORT: 3001,
        HOST: '0.0.0.0'
      }
    },
    
    // Worker processes for background tasks
    {
      name: 'fastify-worker',
      script: 'dist/workers/index.js',
      instances: 2,
      exec_mode: 'cluster',
      
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'background',
        REDIS_URL: process.env.REDIS_URL
      },
      
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    },
    
    // Analytics processor
    {
      name: 'fastify-analytics',
      script: 'dist/workers/analytics.js',
      instances: 1,
      exec_mode: 'fork',
      
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'analytics',
        DATABASE_URL: process.env.DATABASE_URL
      },
      
      max_memory_restart: '512M',
      autorestart: true,
      watch: false
    },
    
    // Notification processor
    {
      name: 'fastify-notifications',
      script: 'dist/workers/notifications.js',
      instances: 2,
      exec_mode: 'cluster',
      
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'notifications',
        REDIS_URL: process.env.REDIS_URL,
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
        TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN
      },
      
      max_memory_restart: '512M',
      autorestart: true,
      watch: false
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:company/fastify-extraction.git',
      path: '/var/www/fastify-extraction',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    
    staging: {
      user: 'deploy',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:company/fastify-extraction.git',
      path: '/var/www/fastify-extraction-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  }
}
