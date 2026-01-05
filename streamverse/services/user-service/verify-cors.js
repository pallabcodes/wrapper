// CORS Verification Script
// Run this after starting the service to verify CORS is working

const http = require('http');

console.log('🔍 CORS Verification for StreamVerse User Service');
console.log('================================================\n');

// Test endpoints that should work with CORS enabled
const endpoints = [
  { path: '/health', method: 'GET', description: 'Health Check' },
  { path: '/users/register', method: 'POST', description: 'User Registration' },
];

const testCORS = (endpoint) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Origin': 'http://localhost:3000', // Simulate browser origin
        'Content-Type': 'application/json',
      },
    };

    // Add body for POST requests
    if (endpoint.method === 'POST') {
      const testData = JSON.stringify({
        email: 'cors-test@example.com',
        username: 'corstest',
        password: 'TestPass123'
      });
      options.headers['Content-Length'] = Buffer.byteLength(testData);

      const req = http.request(options, (res) => {
        console.log(`✅ ${endpoint.description}:`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   CORS Headers:`);
        console.log(`   - Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'NOT SET'}`);
        console.log(`   - Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials'] || 'NOT SET'}`);
        console.log(`   - Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods'] || 'NOT SET'}`);
        console.log('');
        resolve();
      });

      req.on('error', (err) => {
        console.log(`❌ ${endpoint.description}: Connection failed - ${err.message}`);
        console.log('   Make sure the service is running with: npm run start:dev\n');
        resolve();
      });

      req.write(testData);
      req.end();
    } else {
      const req = http.request(options, (res) => {
        console.log(`✅ ${endpoint.description}:`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   CORS Headers:`);
        console.log(`   - Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'NOT SET'}`);
        console.log(`   - Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials'] || 'NOT SET'}`);
        console.log('');
        resolve();
      });

      req.on('error', (err) => {
        console.log(`❌ ${endpoint.description}: Connection failed - ${err.message}`);
        console.log('   Make sure the service is running with: npm run start:dev\n');
        resolve();
      });

      req.end();
    }
  });
};

async function runVerification() {
  console.log('Testing CORS configuration...\n');

  for (const endpoint of endpoints) {
    await testCORS(endpoint);
  }

  console.log('🎯 CORS Verification Complete!');
  console.log('\nExpected Results:');
  console.log('- Status should be 200 (or 201 for POST)');
  console.log('- Access-Control-Allow-Origin should be "*" or the requesting origin');
  console.log('- Access-Control-Allow-Credentials should be "true"');
  console.log('\nIf CORS headers are missing or incorrect, check main.ts CORS configuration.');
  console.log('\nNow try opening browser-test.html in your browser for full testing!');
}

runVerification();
