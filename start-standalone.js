/**
 * Script to start the standalone server
 * This can be run directly from Node.js to bypass the main Express server
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting PuntaIQ Standalone Server');

// Define the standalone server script path
const standaloneScriptPath = path.join(__dirname, 'standalone-server.js');

// Check if the script exists
if (!fs.existsSync(standaloneScriptPath)) {
  console.error(`Error: standalone-server.js not found at ${standaloneScriptPath}`);
  process.exit(1);
}

// Start the standalone server as a detached process
const server = spawn('node', [standaloneScriptPath], {
  detached: true,
  stdio: 'inherit'
});

// Log server info and exit this script
console.log(`Standalone server starting with PID: ${server.pid}`);
console.log('This script will exit, but the server will continue running.');
console.log('You can access the PuntaIQ application at: http://localhost:3000');

// Don't wait for the child process
server.unref();

// Exit after a short delay
setTimeout(() => {
  console.log('Standalone server launch script complete.');
  process.exit(0);
}, 500);