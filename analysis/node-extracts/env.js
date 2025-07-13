// Node.js Environment Variable Patterns - Repurposable Extraction
// These patterns are universal and can be adapted to other languages (Go, Python, Rust, etc.)

// Accessing environment variables
function getEnvVar(name, defaultValue = undefined) {
  return process.env[name] !== undefined ? process.env[name] : defaultValue;
}

// Setting environment variables (for child processes)
function setEnvVar(name, value) {
  process.env[name] = value;
}

// Loading environment variables from a .env file (using dotenv)
// const dotenv = require('dotenv');
// dotenv.config();
// Now process.env contains .env values

// Example: node script.js
// process.env.FOO = 'bar';
// getEnvVar('FOO') => 'bar'

module.exports = {
  getEnvVar,
  setEnvVar
};
