/**
 * Launch script for the standalone PuntaIQ server
 * This will check for dependencies and launch the server
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[LAUNCHER] Starting PuntaIQ standalone server...');

// Check if morgan is installed, if not, install it
let npmInstallNeeded = false;

try {
  require.resolve('morgan');
  console.log('[LAUNCHER] Morgan dependency found');
} catch (e) {
  console.log('[LAUNCHER] Morgan dependency missing, will install');
  npmInstallNeeded = true;
}

try {
  require.resolve('node-fetch');
  console.log('[LAUNCHER] node-fetch dependency found');
} catch (e) {
  console.log('[LAUNCHER] node-fetch dependency missing, will install');
  npmInstallNeeded = true;
}

// Function to start the standalone server
function startServer() {
  console.log('[LAUNCHER] Starting standalone server process...');
  
  // Start the standalone server as a child process
  const server = spawn('node', ['standalone-server.js'], {
    stdio: 'inherit',
    detached: true
  });
  
  server.on('error', (err) => {
    console.error('[LAUNCHER] Failed to start server:', err);
  });
  
  // Log when the server exits
  server.on('close', (code) => {
    console.log(`[LAUNCHER] Server process exited with code ${code}`);
  });
  
  console.log(`[LAUNCHER] Server process started with PID: ${server.pid}`);
  
  // Don't wait for the child process
  server.unref();
  
  console.log('[LAUNCHER] Standalone server launched successfully!');
  console.log('[LAUNCHER] Access the application at: http://localhost:3000');
}

// If we need to install dependencies, do that first
if (npmInstallNeeded) {
  console.log('[LAUNCHER] Installing required dependencies...');
  
  const install = spawn('npm', ['install', 'morgan', 'node-fetch@2'], {
    stdio: 'inherit'
  });
  
  install.on('error', (err) => {
    console.error('[LAUNCHER] Failed to install dependencies:', err);
    process.exit(1);
  });
  
  install.on('close', (code) => {
    if (code !== 0) {
      console.error(`[LAUNCHER] npm install exited with code ${code}`);
      process.exit(code);
    }
    
    console.log('[LAUNCHER] Dependencies installed successfully');
    startServer();
  });
} else {
  // Start the server directly if no installation is needed
  startServer();
}