/**
 * Pure Node.js TLS Secure Server Example
 * Run: openssl req -nodes -new -x509 -keyout key.pem -out cert.pem
 */
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const server = https.createServer(options, (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ hello: 'secure world' }));
});

server.listen(8443, () => {
  console.log('TLS server running on https://localhost:8443');
});