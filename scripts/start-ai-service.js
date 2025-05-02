#!/usr/bin/env node

/**
 * Utility script to start the AI microservice
 * Usage: node scripts/start-ai-service.js
 */

const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";

console.log(`${BLUE}Starting PuntaIQ AI Microservice...${RESET}`);

// Path to the Python script
const scriptPath = path.join(__dirname, '..', 'ai_service', 'start_api_service.py');

// Check if required environment variables are set
const requiredVars = ['ODDS_API_KEY', 'SPORTSDB_API_KEY'];
let missingVars = [];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.log(`${RED}Error: The following environment variables are required: ${missingVars.join(', ')}${RESET}`);
  console.log(`${YELLOW}Please make sure they are set in the .env file${RESET}`);
  process.exit(1);
}

// Start the process
const aiProcess = spawn('python', [scriptPath], {
  stdio: 'inherit',
  detached: true
});

// Handle process events
aiProcess.on('error', (err) => {
  console.error(`${RED}Failed to start AI service: ${err.message}${RESET}`);
  process.exit(1);
});

aiProcess.on('exit', (code, signal) => {
  if (code !== null) {
    console.log(`${YELLOW}AI service exited with code ${code}${RESET}`);
  } else if (signal !== null) {
    console.log(`${YELLOW}AI service was killed with signal ${signal}${RESET}`);
  }
  process.exit(code || 0);
});

console.log(`${GREEN}AI service started!${RESET}`);
console.log(`${BLUE}Press Ctrl+C to stop the service${RESET}`);

// Keep the script running
process.on('SIGINT', () => {
  console.log(`${YELLOW}Stopping AI service...${RESET}`);
  
  // In Windows, we need to spawn taskkill to kill the child and its children
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', aiProcess.pid, '/f', '/t']);
  } else {
    // On POSIX systems we can kill the process group
    process.kill(-aiProcess.pid, 'SIGINT');
  }
  
  process.exit(0);
});