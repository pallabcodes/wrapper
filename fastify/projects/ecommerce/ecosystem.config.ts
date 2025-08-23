/**
 * PM2 Ecosystem Configuration
 * 
 * Production-ready configuration for the functional ecommerce platform
 * Aligned with Fastify ecosystem and functional programming patterns
 */

import type { Ecosystem } from 'pm2'

const ecosystem: Ecosystem = {
  apps: [
    {
      name: 'ecommerce-api',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        LOG_LEVEL: 'debug'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        LOG_LEVEL: 'info'
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        LOG_LEVEL: 'warn'
      },
      // Performance optimizations
      node_args: '--max-old-space-size=4096',
      max_memory_restart: '2G',
      
      // Monitoring
      monitoring: true,
      pmx: true,
      
      // Auto restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Logs
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced settings
      kill_timeout: 5000,
      listen_timeout: 8000,
      shutdown_with_message: true,
      
      // Health check
      health_check_grace_period: 3000,
      
      // Source map support
      source_map_support: true,
      
      // Cluster settings
      increment_var: 'PORT',
      
      // Watch settings for development
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      
      // Advanced PM2 features
      instance_var: 'INSTANCE_ID',
      
      // Environment variables
      env_file: '.env'
    },
    
    // Background workers - Functional approach
    {
      name: 'ecommerce-worker-email',
      script: 'dist/workers/email.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        WORKER_TYPE: 'email'
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'email'
      },
      autorestart: true,
      max_memory_restart: '1G'
    },
    
    {
      name: 'ecommerce-worker-notifications',
      script: 'dist/workers/notifications.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        WORKER_TYPE: 'notifications'
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'notifications'
      },
      autorestart: true,
      max_memory_restart: '512M'
    },
    
    {
      name: 'ecommerce-scheduler',
      script: 'dist/workers/scheduler.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 */6 * * *', // Restart every 6 hours
      env: {
        NODE_ENV: 'development',
        WORKER_TYPE: 'scheduler'
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'scheduler'
      },
      autorestart: true,
      max_memory_restart: '256M'
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server-1', 'production-server-2'],
      ref: 'origin/main',
      repo: 'git@github.com:company/ecommerce-platform.git',
      path: '/var/www/ecommerce',
      'post-deploy': 'npm ci && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'npm install pm2 -g'
    },
    
    staging: {
      user: 'deploy',
      host: 'staging-server',
      ref: 'origin/develop',
      repo: 'git@github.com:company/ecommerce-platform.git',
      path: '/var/www/ecommerce-staging',
      'post-deploy': 'npm ci && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  }
}

export default ecosystem
