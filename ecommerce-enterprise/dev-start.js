#!/usr/bin/env node

/**
 * 🚀 Enterprise Development Starter
 * Professional way to run all @ecommerce-enterprise services
 *
 * This script provides multiple development workflows:
 * 1. Local development (recommended for coding)
 * 2. Docker development (recommended for full integration testing)
 * 3. Individual service debugging
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showBanner() {
  log(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 ENTERPRISE DEVELOPMENT                    ║
║                   @ecommerce-enterprise                        ║
╚══════════════════════════════════════════════════════════════╝
`, 'cyan');
}

function showOptions() {
  log(`
📋 DEVELOPMENT OPTIONS:
`, 'yellow');

  log(`1. ${colors.green}Local Development${colors.reset} (Recommended for coding)`);
  log(`   • Hot reload enabled`);
  log(`   • Individual service logs`);
  log(`   • Perfect for debugging`);
  log(`   • Command: ${colors.cyan}npm run dev:local${colors.reset}`);

  log(`
2. ${colors.green}Docker Development${colors.reset} (Recommended for integration testing)`);
  log(`   • Full containerized environment`);
  log(`   • PostgreSQL + Redis included`);
  log(`   • Production-like setup`);
  log(`   • Command: ${colors.cyan}npm run dev:docker${colors.reset}`);

  log(`
3. ${colors.green}Individual Services${colors.reset} (For debugging specific service)`);
  log(`   • Analytics: ${colors.cyan}npm run dev:analytics${colors.reset}`);
  log(`   • Payment: ${colors.cyan}npm run dev:payment${colors.reset}`);
  log(`   • Notification: ${colors.cyan}npm run dev:notification${colors.reset}`);

  log(`
4. ${colors.green}Health Check${colors.reset} (Check all services)`);
  log(`   • Command: ${colors.cyan}npm run health:all${colors.reset}`);
}

function checkDocker() {
  try {
    execSync('docker --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  return major >= 18;
}

function startLocalDevelopment() {
  log(`
🚀 STARTING LOCAL DEVELOPMENT MODE
═══════════════════════════════════
`, 'green');

  // Kill any existing processes and free up ports
  log(`🛑 Cleaning up existing processes...`, 'yellow');
  try {
    execSync('pkill -f "nest start" || true', { stdio: 'pipe' });
    execSync('pkill -f "ts-node-dev" || true', { stdio: 'pipe' });
    execSync('pkill -f "npm.*dev" || true', { stdio: 'pipe' });
    
    // Force kill processes on specific ports
    execSync('lsof -ti:3001 | xargs kill -9 2>/dev/null || true', { stdio: 'pipe' });
    execSync('lsof -ti:3002 | xargs kill -9 2>/dev/null || true', { stdio: 'pipe' });
    execSync('lsof -ti:3003 | xargs kill -9 2>/dev/null || true', { stdio: 'pipe' });
    
    log(`✅ Ports cleaned up`, 'green');
  } catch (error) {
    log(`⚠️  Cleanup warning: ${error.message}`, 'yellow');
  }
  
  // Wait for ports to be fully released
  log(`⏳ Waiting for ports to be released...`, 'yellow');
  execSync('sleep 3', { stdio: 'pipe' });

  const services = [
    {
      name: 'Analytics',
      path: 'packages/analytics',
      command: 'npm run start:dev',
      port: 3003,
      color: 'cyan'
    },
    {
      name: 'Payment',
      path: 'packages/payment',
      command: 'npm run dev',
      port: 3001,
      color: 'yellow'
    },
    {
      name: 'Notification',
      path: 'packages/notification',
      command: 'npm run dev',
      port: 3002,
      color: 'magenta'
    }
  ];

  const processes = [];

  services.forEach((service, index) => {
    setTimeout(() => {
      log(`📦 Starting ${service.name} Service...`, service.color);

      const cwd = path.join(__dirname, service.path);
      const proc = spawn(service.command.split(' ')[0], service.command.split(' ').slice(1), {
        cwd,
        stdio: ['inherit', 'pipe', 'pipe'],
        detached: true
      });

      proc.stdout.on('data', (data) => {
        log(`[${service.name}] ${data.toString().trim()}`, service.color);
      });

      proc.stderr.on('data', (data) => {
        log(`[${service.name}] ERROR: ${data.toString().trim()}`, 'red');
      });

      proc.on('close', (code) => {
        log(`[${service.name}] Process exited with code ${code}`, code === 0 ? 'green' : 'red');
      });

      processes.push(proc);

      // Health check after startup
      setTimeout(() => {
        checkServiceHealth(service.name, service.port);
      }, 5000 + (index * 2000));

    }, index * 1000);
  });

  // Show service URLs
  setTimeout(() => {
    log(`
🎉 SERVICES STARTED!
════════════════════
`, 'green');

    services.forEach(service => {
      log(`📊 ${service.name}: http://localhost:${service.port}`, service.color);
    });

    log(`
🔍 Health Check URLs:`, 'yellow');
    services.forEach(service => {
      const endpoint = service.name === 'Analytics' ? '/api/v1/analytics/health' : '/health';
      log(`   ${service.name}: http://localhost:${service.port}${endpoint}`, service.color);
    });

    log(`
🛑 To stop all services: ${colors.red}Ctrl+C${colors.reset}
📋 To view logs: Check each terminal window
`, 'yellow');

  }, 3000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    log(`
🛑 SHUTTING DOWN SERVICES...
`, 'red');

    processes.forEach(proc => {
      try {
        process.kill(-proc.pid);
      } catch {}
    });

    process.exit(0);
  });
}

function checkServiceHealth(serviceName, port) {
  const endpoint = serviceName === 'Analytics' ? '/api/v1/analytics/health' : '/health';
  const url = `http://localhost:${port}${endpoint}`;

  try {
    const response = require('http').get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          if (health.status === 'ok' || health.success) {
            log(`✅ ${serviceName} Service is healthy`, 'green');
          } else {
            log(`⚠️  ${serviceName} Service responding but not healthy`, 'yellow');
          }
        } catch {
          log(`⚠️  ${serviceName} Service responding`, 'yellow');
        }
      });
    });

    response.on('error', () => {
      log(`❌ ${serviceName} Service not responding`, 'red');
    });

    response.setTimeout(3000, () => {
      response.destroy();
      log(`⏳ ${serviceName} Service starting...`, 'yellow');
    });

  } catch (error) {
    log(`❌ ${serviceName} Health check failed`, 'red');
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  showBanner();

  // Pre-flight checks
  if (!checkNodeVersion()) {
    log(`❌ Node.js version 18+ required. Current: ${process.version}`, 'red');
    process.exit(1);
  }

  if (command === 'docker' && !checkDocker()) {
    log(`❌ Docker is not installed or not running`, 'red');
    process.exit(1);
  }

  switch (command) {
    case 'local':
      startLocalDevelopment();
      break;

    case 'docker':
      log(`🚀 Starting Docker Development Mode...`, 'green');
      try {
        execSync('npm run docker:dev', { stdio: 'inherit' });
        log(`✅ Docker services started!`, 'green');
        log(`📋 View logs: npm run docker:dev:logs`, 'yellow');
        log(`🔍 Check health: npm run docker:dev:health`, 'yellow');
      } catch (error) {
        log(`❌ Failed to start Docker services`, 'red');
      }
      break;

    case 'analytics':
      log(`🚀 Starting Analytics Service...`, 'cyan');
      spawn('npm', ['run', 'start:dev'], {
        cwd: path.join(__dirname, 'packages/analytics'),
        stdio: 'inherit'
      });
      break;

    case 'payment':
      log(`🚀 Starting Payment Service...`, 'yellow');
      spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'packages/payment'),
        stdio: 'inherit'
      });
      break;

    case 'notification':
      log(`🚀 Starting Notification Service...`, 'magenta');
      spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'packages/notification'),
        stdio: 'inherit'
      });
      break;

    default:
      showOptions();
      log(`
💡 Quick Start:
   ${colors.green}npm run dev:local${colors.reset}    - Start all services locally
   ${colors.green}npm run dev:docker${colors.reset}   - Start all services in Docker
   ${colors.green}npm run health:all${colors.reset}   - Check service health

🎯 For Google/Stripe/Airbnb level development:
   Use ${colors.cyan}npm run dev:local${colors.reset} for coding
   Use ${colors.cyan}npm run dev:docker${colors.reset} for integration testing
`, 'yellow');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = { startLocalDevelopment, checkServiceHealth };
