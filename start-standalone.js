/**
 * Script to start the standalone server
 * This can be run directly from Node.js to bypass the main Express server
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting standalone PuntaIQ server...');

// Launch the standalone server
const server = spawn('node', ['launch-standalone.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

// Handle server exit
server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Standalone server exited with code ${code}`);
  } else {
    console.log('Standalone server exited gracefully');
  }
});

console.log('Started standalone server process. Press Ctrl+C to exit.');