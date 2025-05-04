/**
 * Customized PuntaIQ server starter script for Replit environment
 * This script ensures the server binds to all available interfaces and ports properly 
 */
import { spawn } from 'child_process';
import http from 'http';

// Start the main application
console.log('Starting PuntaIQ application with environment overrides...');

// Define the environment variables needed for proper port binding in Replit
const env = {
  ...process.env,
  NODE_ENV: 'development',
  // Force port to use this specific port for Replit
  PORT: 3000,
  // Force binding to all interfaces
  HOST: '0.0.0.0'
};

// Start the main Express server 
const serverProcess = spawn('node', ['--no-warnings', '--loader', 'tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: env
});

// Handle errors
serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle exit
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

console.log('Server startup initiated. Waiting for initialization...');